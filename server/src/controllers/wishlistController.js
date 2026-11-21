import { ApiResponse } from '../utils/apiResponse.js'
import { supabaseAdmin } from '../config/supabase.js'
import { env } from '../config/env.js'
import { z } from 'zod'
import { cartController } from './cartController.js'

const idRegex = /^[a-zA-Z0-9_-]{1,64}$/

const toggleWishlistSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required').regex(idRegex, 'Product ID must be a valid ID')
})

const moveToCartSchema = z.object({
  product_id: z.string().min(1).regex(idRegex, 'Product ID must be a valid ID'),
  variant_id: z.string().min(1).regex(idRegex, 'Variant ID must be a valid ID')
})

// In-memory mock wishlist for test environment
const mockWishlists = {
  '11111111-1111-1111-1111-111111111111': ['p0000001-0000-0000-0000-000000000002']
}

export const wishlistController = {
  /**
   * GET /api/wishlist
   * Returns authenticated user's wishlist
   */
  getWishlist: async (req, res) => {
    const userId = req.user.id

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const items = mockWishlists[userId] || []
      return ApiResponse.success(res, {
        message: 'Wishlist retrieved successfully',
        data: { product_ids: items, total_items: items.length }
      })
    }

    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .select('id, wishlist_items (product_id, products (*))')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return ApiResponse.success(res, {
      message: 'Wishlist retrieved successfully',
      data: { wishlist: data || { wishlist_items: [] } }
    })
  },

  /**
   * POST /api/wishlist/toggle
   * Adds or removes a product from user's wishlist
   */
  toggleWishlistItem: async (req, res) => {
    const userId = req.user.id
    const { product_id } = toggleWishlistSchema.parse(req.body)

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userList = mockWishlists[userId] || []
      const index = userList.indexOf(product_id)
      let action = 'added'

      if (index > -1) {
        userList.splice(index, 1)
        action = 'removed'
      } else {
        userList.push(product_id)
      }
      mockWishlists[userId] = userList

      return ApiResponse.success(res, {
        message: `Product ${action} to wishlist`,
        data: { product_id, is_in_wishlist: action === 'added' }
      })
    }

    let { data: wishlist } = await supabaseAdmin
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!wishlist) {
      const { data: newWl } = await supabaseAdmin.from('wishlists').insert({ user_id: userId }).select('id').single()
      wishlist = newWl
    }

    const { data: existing } = await supabaseAdmin
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', product_id)
      .single()

    let isAdded = false
    if (existing) {
      await supabaseAdmin.from('wishlist_items').delete().eq('id', existing.id)
    } else {
      await supabaseAdmin.from('wishlist_items').insert({ wishlist_id: wishlist.id, product_id })
      isAdded = true
    }

    return ApiResponse.success(res, {
      message: isAdded ? 'Added to wishlist' : 'Removed from wishlist',
      data: { product_id, is_in_wishlist: isAdded }
    })
  },

  /**
   * POST /api/wishlist/move-to-cart
   * Adds variant to cart and removes product from wishlist
   */
  moveToCart: async (req, res) => {
    const { product_id, variant_id } = moveToCartSchema.parse(req.body)

    // Add to cart
    await cartController.addItem(
      {
        user: req.user,
        body: { variant_id, quantity: 1 }
      },
      { status: () => ({ json: () => {} }) }
    )

    // Remove from wishlist
    await wishlistController.toggleWishlistItem(
      {
        user: req.user,
        body: { product_id }
      },
      { status: () => ({ json: () => {} }) }
    )

    return ApiResponse.success(res, {
      message: 'Item moved from wishlist to cart'
    })
  }
}
