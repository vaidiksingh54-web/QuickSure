import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { NotFoundError, ConflictError, AppError } from '../utils/errors.js';

// In-memory mock sellers and platform data for local test environment
let mockAdminSellers = {
  'seller-0001-0000-0000-000000000001': {
    id: 'seller-0001-0000-0000-000000000001',
    user_id: '22222222-2222-2222-2222-222222222222',
    store_name: 'QuickSure Electronics Hub',
    store_slug: 'quicksure-electronics',
    description: 'Premier audio, smartphones, and smart home appliances',
    commission_rate: 10.00,
    status: 'approved',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
    products_count: 14,
  },
  'seller-0002-0000-0000-000000000002': {
    id: 'seller-0002-0000-0000-000000000002',
    user_id: 'seller-user-0002',
    store_name: 'TrendSetter Fashion',
    store_slug: 'trendsetter-fashion',
    description: 'Premium apparel, ethnic wear, and sustainable clothing',
    commission_rate: 12.00,
    status: 'approved',
    created_at: '2026-11-20T11:00:00Z',
    updated_at: '2026-11-20T11:00:00Z',
    products_count: 8,
  },
  'seller-0003-0000-0000-000000000003': {
    id: 'seller-0003-0000-0000-000000000003',
    user_id: 'seller-user-0003',
    store_name: 'EcoLiving Home Crafts',
    store_slug: 'ecoliving-crafts',
    description: 'Artisan hand-crafted wooden and ceramic kitchenware',
    commission_rate: 10.00,
    status: 'pending',
    created_at: '2026-11-21T01:00:00Z',
    updated_at: '2026-11-21T01:00:00Z',
    products_count: 0,
  },
};

let mockCategories = [
  { id: 'cat-001', name: 'Electronics', slug: 'electronics', parent_id: null, is_active: true, display_order: 1, product_count: 24 },
  { id: 'cat-002', name: 'Smartphones', slug: 'smartphones', parent_id: 'cat-001', is_active: true, display_order: 1, product_count: 12 },
  { id: 'cat-003', name: 'Audio & Sound', slug: 'audio-sound', parent_id: 'cat-001', is_active: true, display_order: 2, product_count: 8 },
  { id: 'cat-004', name: 'Fashion & Apparel', slug: 'fashion', parent_id: null, is_active: true, display_order: 2, product_count: 32 },
  { id: 'cat-005', name: 'Home & Kitchen', slug: 'home-kitchen', parent_id: null, is_active: true, display_order: 3, product_count: 18 },
];

export const adminService = {
  /**
   * Aggregate platform-wide analytics and financial metrics
   */
  getPlatformStats: async () => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const sellersList = Object.values(mockAdminSellers);
      const approvedSellers = sellersList.filter((s) => s.status === 'approved').length;
      const pendingSellers = sellersList.filter((s) => s.status === 'pending').length;

      return {
        financials: {
          gross_merchandise_value: 384590.00,
          platform_commission_earned: 41250.00,
          net_seller_payouts: 343340.00,
          average_order_value: 2465.00,
          currency: 'INR',
        },
        orders: {
          total_orders: 156,
          completed_orders: 142,
          shipped_orders: 8,
          pending_fulfillment: 6,
          cancelled_orders: 0,
        },
        sellers: {
          total_sellers: sellersList.length,
          approved_sellers: approvedSellers,
          pending_approvals: pendingSellers,
          suspended_sellers: sellersList.filter((s) => s.status === 'suspended').length,
        },
        catalog: {
          total_products: 48,
          total_categories: mockCategories.length,
          active_coupons: 4,
        },
      };
    }

    // Production: Supabase queries
    const { count: totalOrders } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    const { count: completedOrders } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: approvedSellers } = await supabaseAdmin.from('sellers').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: pendingSellers } = await supabaseAdmin.from('sellers').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: totalProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

    // Sum totals from sub_orders
    const { data: subOrderTotals } = await supabaseAdmin
      .from('sub_orders')
      .select('subtotal, commission_fee, seller_payout_amount');

    const gmv = (subOrderTotals || []).reduce((sum, so) => sum + Number(so.subtotal || 0), 0);
    const commission = (subOrderTotals || []).reduce((sum, so) => sum + Number(so.commission_fee || 0), 0);
    const payouts = (subOrderTotals || []).reduce((sum, so) => sum + Number(so.seller_payout_amount || 0), 0);

    return {
      financials: {
        gross_merchandise_value: Math.round(gmv * 100) / 100,
        platform_commission_earned: Math.round(commission * 100) / 100,
        net_seller_payouts: Math.round(payouts * 100) / 100,
        average_order_value: totalOrders > 0 ? Math.round((gmv / totalOrders) * 100) / 100 : 0,
        currency: 'INR',
      },
      orders: {
        total_orders: totalOrders || 0,
        completed_orders: completedOrders || 0,
      },
      sellers: {
        approved_sellers: approvedSellers || 0,
        pending_approvals: pendingSellers || 0,
      },
      catalog: {
        total_products: totalProducts || 0,
      },
    };
  },

  /**
   * List sellers with status filter and pagination
   */
  getSellers: async ({ status = null, page = 1, limit = 10 }) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      let list = Object.values(mockAdminSellers);
      if (status) {
        list = list.filter((s) => s.status === status);
      }
      const total = list.length;
      const start = (page - 1) * limit;
      const paged = list.slice(start, start + limit);
      return { sellers: paged, total, page, limit };
    }

    let query = supabaseAdmin.from('sellers').select('*, profiles(email, full_name, phone)', { count: 'exact' });
    if (status) query = query.eq('status', status);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw new AppError(`Failed to fetch sellers: ${error.message}`, 500);
    return { sellers: data || [], total: count || 0, page, limit };
  },

  /**
   * Update seller approval status
   */
  updateSellerStatus: async (sellerId, newStatus, reason = null) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const seller = mockAdminSellers[sellerId];
      if (!seller) throw new NotFoundError(`Seller '${sellerId}' not found`);

      seller.status = newStatus;
      seller.status_reason = reason;
      seller.updated_at = new Date().toISOString();

      return seller;
    }

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sellerId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError(`Seller '${sellerId}' not found`);
    return data;
  },

  /**
   * Override seller platform commission rate (0.00% to 100.00%)
   */
  updateCommissionRate: async (sellerId, commissionRate) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const seller = mockAdminSellers[sellerId];
      if (!seller) throw new NotFoundError(`Seller '${sellerId}' not found`);

      seller.commission_rate = Number(commissionRate);
      seller.updated_at = new Date().toISOString();

      return seller;
    }

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .update({ commission_rate: Number(commissionRate), updated_at: new Date().toISOString() })
      .eq('id', sellerId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError(`Seller '${sellerId}' not found`);
    return data;
  },

  /**
   * Category Management
   */
  getCategories: async () => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      return mockCategories;
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw new AppError(`Failed to fetch categories: ${error.message}`, 500);
    return data || [];
  },

  createCategory: async (categoryData) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const exists = mockCategories.some((c) => c.slug === categoryData.slug);
      if (exists) throw new ConflictError(`Category with slug '${categoryData.slug}' already exists`);

      const newCat = {
        id: `cat-${Date.now()}`,
        ...categoryData,
        product_count: 0,
        created_at: new Date().toISOString(),
      };
      mockCategories.push(newCat);
      return newCat;
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError(`Category slug already exists`);
      throw new AppError(`Failed to create category: ${error.message}`, 500);
    }
    return data;
  },

  updateCategory: async (categoryId, updateData) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const cat = mockCategories.find((c) => c.id === categoryId);
      if (!cat) throw new NotFoundError(`Category '${categoryId}' not found`);

      Object.assign(cat, updateData);
      return cat;
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError(`Category '${categoryId}' not found`);
    return data;
  },

  deleteCategory: async (categoryId) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const idx = mockCategories.findIndex((c) => c.id === categoryId);
      if (idx === -1) throw new NotFoundError(`Category '${categoryId}' not found`);

      const [removed] = mockCategories.splice(idx, 1);
      return removed;
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw new AppError(`Failed to delete category: ${error.message}`, 500);
    return data;
  },
};
