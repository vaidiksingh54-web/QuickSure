-- ==============================================================================
-- QuickSure Marketplace Schema - Migration 003: Row Level Security (RLS)
-- Defense-in-Depth Policies for PostgreSQL
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PUBLIC READ ACCESS POLICIES (Catalog & Discovery)
-- ------------------------------------------------------------------------------

-- Categories: Publicly viewable if active
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (is_active = TRUE);

-- Products: Publicly viewable if active, approved, and not soft-deleted
CREATE POLICY "Active approved products are viewable by everyone" 
ON public.products FOR SELECT 
USING (is_active = TRUE AND is_approved = TRUE AND deleted_at IS NULL);

-- Product Variants: Publicly viewable if active
CREATE POLICY "Active product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (is_active = TRUE);

-- Product Images: Publicly viewable
CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images FOR SELECT 
USING (TRUE);

-- Approved Sellers: Publicly viewable store details
CREATE POLICY "Approved sellers are viewable by everyone" 
ON public.sellers FOR SELECT 
USING (status = 'approved');

-- Coupons: Publicly viewable if active and within validity window
CREATE POLICY "Active coupons are viewable by everyone" 
ON public.coupons FOR SELECT 
USING (is_active = TRUE AND NOW() BETWEEN starts_at AND expires_at);

-- ------------------------------------------------------------------------------
-- 2. TENANT ISOLATION POLICIES (Authenticated Users)
-- ------------------------------------------------------------------------------

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Addresses: Users can CRUD only their own addresses
CREATE POLICY "Users can manage own addresses" 
ON public.addresses FOR ALL 
USING (auth.uid() = user_id);

-- Carts & Cart Items: Users can access only their own cart
CREATE POLICY "Users can view own cart" 
ON public.carts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items" 
ON public.cart_items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.carts 
        WHERE carts.id = cart_items.cart_id 
        AND carts.user_id = auth.uid()
    )
);

-- Wishlists: Users can access only their own wishlist
CREATE POLICY "Users can manage own wishlist" 
ON public.wishlists FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist items" 
ON public.wishlist_items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.wishlists 
        WHERE wishlists.id = wishlist_items.wishlist_id 
        AND wishlists.user_id = auth.uid()
    )
);

-- Orders: Users can view only their own orders
CREATE POLICY "Users can view own parent orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Sub-Orders: Customer can view sub-orders for their own parent order; Sellers can view sub-orders assigned to them
CREATE POLICY "Users and sellers can view relevant sub-orders" 
ON public.sub_orders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = sub_orders.order_id 
        AND orders.user_id = auth.uid()
    )
    OR 
    EXISTS (
        SELECT 1 FROM public.sellers 
        WHERE sellers.id = sub_orders.seller_id 
        AND sellers.user_id = auth.uid()
    )
);

-- Order Items: Viewable if user owns the parent order or seller owns the sub-order
CREATE POLICY "Users and sellers can view order items" 
ON public.order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.sub_orders 
        JOIN public.orders ON orders.id = sub_orders.order_id
        WHERE sub_orders.id = order_items.sub_order_id
        AND (orders.user_id = auth.uid() OR sub_orders.seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()))
    )
);

-- Seller Self-Management: Sellers can manage their own products
CREATE POLICY "Sellers can manage own store" 
ON public.sellers FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can manage own products" 
ON public.products FOR ALL 
USING (
    seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
);

CREATE POLICY "Sellers can manage own product variants" 
ON public.product_variants FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = product_variants.product_id 
        AND products.seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
    )
);
