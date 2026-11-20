-- ==============================================================================
-- QuickSure Marketplace Demo Seed Data
-- ==============================================================================

-- 1. Insert Categories & Subcategories
INSERT INTO public.categories (id, name, slug, description, icon_url, display_order)
VALUES 
    ('c0000001-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Smartphones, Audio, Computing and Smart Tech', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80', 1),
    ('c0000001-0000-0000-0000-000000000002', 'Fashion', 'fashion', 'Clothing, Footwear, Accessories and Style', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&q=80', 2),
    ('c0000001-0000-0000-0000-000000000003', 'Home & Living', 'home-living', 'Furniture, Decor, Kitchen and Appliances', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=100&q=80', 3),
    ('c0000001-0000-0000-0000-000000000004', 'Beauty & Personal Care', 'beauty', 'Skincare, Fragrances and Grooming', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&q=80', 4),
    ('c0000001-0000-0000-0000-000000000005', 'Sports & Fitness', 'sports', 'Exercise gear, Nutrition and Outdoor equipment', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&q=80', 5)
ON CONFLICT (id) DO NOTHING;

-- Subcategories
INSERT INTO public.categories (id, name, slug, description, parent_id, display_order)
VALUES 
    ('c0000002-0000-0000-0000-000000000001', 'Audio & Headphones', 'audio-headphones', 'Noise cancelling headphones and earbuds', 'c0000001-0000-0000-0000-000000000001', 1),
    ('c0000002-0000-0000-0000-000000000002', 'Smartphones & Wearables', 'smartphones-wearables', 'Latest smartphones and smartwatches', 'c0000001-0000-0000-0000-000000000001', 2),
    ('c0000002-0000-0000-0000-000000000003', 'Men Fashion', 'men-fashion', 'Shirts, jeans and activewear for men', 'c0000001-0000-0000-0000-000000000002', 1),
    ('c0000002-0000-0000-0000-000000000004', 'Kitchen Appliances', 'kitchen-appliances', 'Mixer grinders, air fryers and cookers', 'c0000001-0000-0000-0000-000000000003', 1)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Active Demo Coupons
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, starts_at, expires_at, is_active)
VALUES 
    ('d0000001-0000-0000-0000-000000000001', 'QUICK10', 'percentage', 10.00, 500.00, 200.00, 1000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE),
    ('d0000001-0000-0000-0000-000000000002', 'SURE50', 'fixed', 50.00, 300.00, 50.00, 500, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE),
    ('d0000001-0000-0000-0000-000000000003', 'WELCOME200', 'fixed', 200.00, 1500.00, 200.00, 2000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', TRUE)
ON CONFLICT (id) DO NOTHING;
