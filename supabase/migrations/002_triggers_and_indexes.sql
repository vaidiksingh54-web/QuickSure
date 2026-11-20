-- ==============================================================================
-- QuickSure Marketplace Schema - Migration 002: Indexes & Automated Triggers
-- Hardened Edition with Security Guards
-- ==============================================================================

-- Enable trigram extension for efficient fuzzy catalog search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. PERFORMANCE & INTEGRITY INDEXES
-- ------------------------------------------------------------------------------

-- Addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

-- Sellers
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers (user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers (status);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_active_approved ON public.products (is_active, is_approved) WHERE deleted_at IS NULL;
-- Trigram search index for rapid partial matching on product title and brand
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON public.products USING gin (brand gin_trgm_ops);

-- Product Variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_price ON public.product_variants (price);

-- Product Images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);
-- Strict single primary image guarantee per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_image_per_product ON public.product_images (product_id) WHERE is_primary = TRUE;

-- Carts & Cart Items
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items (variant_id);

-- Wishlist Items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items (wishlist_id);

-- Orders & Sub-Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_order_id ON public.sub_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller_id ON public.sub_orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON public.sub_orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sub_order_id ON public.order_items (sub_order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_sub_order ON public.order_status_history (sub_order_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON public.payments (transaction_ref);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code) WHERE is_active = TRUE;


-- ------------------------------------------------------------------------------
-- 2. AUTOMATED UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updated_at column
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'profiles', 'addresses', 'sellers', 'products', 
        'product_variants', 'carts', 'cart_items', 'orders', 'sub_orders'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.%I;
            CREATE TRIGGER trigger_set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
        ', tbl, tbl);
    END LOOP;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. SECURITY TRIGGER: PREVENT ROLE TAMPERING (Enforces Rule 3)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Block role mutation unless executed by service role or superuser
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF current_user != 'postgres' AND current_setting('role', true) != 'service_role' THEN
            RAISE EXCEPTION 'Security violation: altering user role is strictly prohibited.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trigger_prevent_role_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_tampering();


-- ------------------------------------------------------------------------------
-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    derived_name TEXT;
BEGIN
    derived_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
        'Customer'
    );

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.id::text || '@quicksure.local'),
        derived_name,
        NEW.raw_user_meta_data->>'avatar_url',
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Auto-provision initial cart and wishlist containers
    BEGIN
        INSERT INTO public.carts (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
        INSERT INTO public.wishlists (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Prevent signup failure if cart container creation encounters a soft race
        NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
