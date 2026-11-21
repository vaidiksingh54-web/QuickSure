import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../utils/errors.js'
import { orderService } from './orderService.js'

// In-memory mock stores for local test environment
const mockSellersByUserId = {
  '22222222-2222-2222-2222-222222222222': {
    id: 'seller-0001-0000-0000-000000000001',
    user_id: '22222222-2222-2222-2222-222222222222',
    store_name: 'QuickSure Electronics Hub',
    store_slug: 'quicksure-electronics',
    description: 'Premier audio, smartphones, and smart home appliances',
    commission_rate: 10.00,
    status: 'approved',
    logo_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100',
    banner_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z'
  }
}

const mockSellerProducts = {
  'seller-0001-0000-0000-000000000001': [
    {
      id: 'p0000001-0000-0000-0000-000000000001',
      seller_id: 'seller-0001-0000-0000-000000000001',
      title: 'SonicPro Wireless ANC Headphones',
      slug: 'sonicpro-wireless-anc-headphones',
      category: 'Electronics',
      variants: [
        { id: 'v0000001-0000-0000-0000-000000000001', sku: 'SP-ANC-BLK', price: 2499.00, stock_quantity: 45, variant_name: 'Black' },
        { id: 'v0000001-0000-0000-0000-000000000002', sku: 'SP-ANC-SLV', price: 2599.00, stock_quantity: 18, variant_name: 'Silver' }
      ]
    },
    {
      id: 'p0000001-0000-0000-0000-000000000002',
      seller_id: 'seller-0001-0000-0000-000000000001',
      title: 'AeroWatch S5 Smartwatch',
      slug: 'aerowatch-s5-smartwatch',
      category: 'Electronics',
      variants: [
        { id: 'v0000001-0000-0000-0000-000000000003', sku: 'AW-S5-OBS', price: 1899.00, stock_quantity: 32, variant_name: 'Obsidian' }
      ]
    }
  ]
}

export const sellerService = {
  /**
   * Get store profile for authenticated seller user
   */
  getStoreProfile: async (userId) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const profile = mockSellersByUserId[userId]
      if (!profile) {
        throw new NotFoundError('No store profile found. Please complete seller onboarding.')
      }
      return profile
    }

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      throw new NotFoundError('No store profile found. Please complete seller onboarding.')
    }
    return data
  },

  /**
   * Onboard or update seller store profile
   */
  upsertStoreProfile: async (userId, profileData) => {
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const existing = mockSellersByUserId[userId]
      if (existing) {
        Object.assign(existing, profileData, { updated_at: new Date().toISOString() })
        return existing
      }

      const newSeller = {
        id: `seller-${Date.now()}`,
        user_id: userId,
        ...profileData,
        commission_rate: 10.00,
        status: 'pending', // Requires admin approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      mockSellersByUserId[userId] = newSeller
      if (!mockSellerProducts[newSeller.id]) mockSellerProducts[newSeller.id] = []
      return newSeller
    }

    const { data: existing } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('sellers')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new AppError(`Failed to update store: ${error.message}`, 500)
      return data
    }

    const { data, error } = await supabaseAdmin
      .from('sellers')
      .insert({
        user_id: userId,
        ...profileData,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new ConflictError('Store name or slug already exists')
      throw new AppError(`Failed to create store: ${error.message}`, 500)
    }
    return data
  },

  /**
   * Get all products owned by authenticated seller
   */
  getSellerProducts: async (userId) => {
    const profile = await sellerService.getStoreProfile(userId)

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const products = mockSellerProducts[profile.id] || []
      return {
        products,
        total: products.length,
        store_name: profile.store_name
      }
    }

    const { data, error, count } = await supabaseAdmin
      .from('products')
      .select('*, product_variants(*), product_images(*)', { count: 'exact' })
      .eq('seller_id', profile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw new AppError(`Failed to fetch seller products: ${error.message}`, 500)
    return { products: data || [], total: count || 0, store_name: profile.store_name }
  },

  /**
   * Quick Stock Adjustment
   * ENFORCES RULE 5: Verifies that the variant's parent product belongs to this seller (IDOR protection).
   */
  updateVariantStock: async (userId, variantId, stockQuantity) => {
    const profile = await sellerService.getStoreProfile(userId)

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const myProducts = mockSellerProducts[profile.id] || []
      let foundVariant = null

      for (const prod of myProducts) {
        const v = prod.variants.find((item) => item.id === variantId)
        if (v) {
          foundVariant = v
          break
        }
      }

      if (!foundVariant) {
        throw new ForbiddenError('Access denied: You do not own this product variant (IDOR Protection)')
      }

      foundVariant.stock_quantity = stockQuantity
      return {
        variant_id: variantId,
        sku: foundVariant.sku,
        stock_quantity: foundVariant.stock_quantity,
        updated_at: new Date().toISOString()
      }
    }

    // Verify ownership via join in Supabase
    const { data: variant, error: varError } = await supabaseAdmin
      .from('product_variants')
      .select('id, sku, products!inner(seller_id)')
      .eq('id', variantId)
      .single()

    if (varError || !variant) throw new NotFoundError(`Variant '${variantId}' not found`)

    if (variant.products.seller_id !== profile.id) {
      throw new ForbiddenError('Access denied: You do not own this product variant (IDOR Protection)')
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ stock_quantity: stockQuantity })
      .eq('id', variantId)
      .select('id, sku, stock_quantity')
      .single()

    if (error) throw new AppError(`Failed to update stock: ${error.message}`, 500)
    return data
  },

  /**
   * Dispatch Sub-Order (transition confirmed/packed -> shipped with tracking info)
   */
  dispatchSubOrder: async (userId, subOrderId, { courier_name, tracking_number, notes }) => {
    // Transition sub-order to 'shipped' through the authoritative order state machine
    return orderService.updateSubOrderStatus(subOrderId, 'shipped', userId, 'seller', {
      courier_name,
      tracking_number,
      notes: notes || `Dispatched by vendor with tracking number ${tracking_number}`
    })
  }
}
