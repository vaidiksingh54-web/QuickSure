import { ApiResponse } from '../utils/apiResponse.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { 
  addToCartSchema, 
  updateCartItemSchema, 
  mergeCartSchema,
  quoteCartSchema 
} from '../validators/cartValidator.js';
import { inventoryService } from '../services/inventoryService.js';
import { pricingService } from '../services/pricingService.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

// In-memory mock carts by user_id for test and local dev environments
let mockCarts = {
  '11111111-1111-1111-1111-111111111111': {
    cart_id: 'cart-0001',
    items: [
      {
        id: 'ci-0001',
        variant_id: 'v0000001-0000-0000-0000-000000000001',
        quantity: 1,
      },
    ],
  },
};

export const cartController = {
  /**
   * GET /api/cart
   * Retrieves user's active cart with live prices and stock availability
   */
  getCart: async (req, res) => {
    const userId = req.user.id;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userCart = mockCarts[userId] || { cart_id: `cart-${userId}`, items: [] };
      mockCarts[userId] = userCart;

      // Populate live details
      const populatedItems = [];
      for (const item of userCart.items) {
        try {
          const variant = await inventoryService.getVariantDetails(item.variant_id);
          populatedItems.push({
            id: item.id,
            variant_id: variant.id,
            sku: variant.sku,
            variant_name: variant.variant_name,
            unit_price: Number(variant.price),
            quantity: item.quantity,
            total_price: Number(variant.price) * item.quantity,
            available_stock: variant.stock_quantity,
            in_stock: variant.stock_quantity >= item.quantity,
          });
        } catch {
          // If variant deleted, omit or mark unavailable
        }
      }

      return ApiResponse.success(res, {
        message: 'Cart retrieved successfully',
        data: {
          cart_id: userCart.cart_id,
          items: populatedItems,
          total_items: populatedItems.reduce((sum, i) => sum + i.quantity, 0),
        },
      });
    }

    // Database querying logic via Supabase
    let { data: cart } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      const { data: newCart } = await supabaseAdmin
        .from('carts')
        .insert({ user_id: userId })
        .select('id')
        .single();
      cart = newCart;
    }

    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id, variant_id, quantity,
        product_variants (
          id, sku, price, compare_at_price, stock_quantity, variant_name,
          products (title, slug, product_images (image_url, is_primary))
        )
      `)
      .eq('cart_id', cart.id);

    if (error) throw error;

    return ApiResponse.success(res, {
      message: 'Cart retrieved successfully',
      data: {
        cart_id: cart.id,
        items: items || [],
        total_items: (items || []).reduce((sum, i) => sum + i.quantity, 0),
      },
    });
  },

  /**
   * POST /api/cart/items
   * Adds or increments a variant item in the user's cart
   */
  addItem: async (req, res) => {
    const userId = req.user.id;
    const { variant_id, quantity } = addToCartSchema.parse(req.body);

    // Validate variant exists and has sufficient stock
    const variant = await inventoryService.getVariantDetails(variant_id);
    if (variant.stock_quantity <= 0) {
      throw new ConflictError(`Item '${variant.variant_name}' is currently out of stock`);
    }

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userCart = mockCarts[userId] || { cart_id: `cart-${userId}`, items: [] };
      mockCarts[userId] = userCart;

      const existingItem = userCart.items.find((i) => i.variant_id === variant_id);
      if (existingItem) {
        const newQty = Math.min(10, Math.min(variant.stock_quantity, existingItem.quantity + quantity));
        existingItem.quantity = newQty;
      } else {
        userCart.items.push({
          id: `ci-${Date.now()}`,
          variant_id,
          quantity: Math.min(10, Math.min(variant.stock_quantity, quantity)),
        });
      }

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Item added to cart',
        data: { items: userCart.items },
      });
    }

    // Database insert / increment via Supabase
    let { data: cart } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      const { data: newCart } = await supabaseAdmin
        .from('carts')
        .insert({ user_id: userId })
        .select('id')
        .single();
      cart = newCart;
    }

    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('variant_id', variant_id)
      .single();

    if (existing) {
      const newQty = Math.min(10, Math.min(variant.stock_quantity, existing.quantity + quantity));
      await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          variant_id,
          quantity: Math.min(10, Math.min(variant.stock_quantity, quantity)),
        });
    }

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Item added to cart',
    });
  },

  /**
   * PUT /api/cart/items/:id
   * Updates line item quantity
   */
  updateItemQuantity: async (req, res) => {
    const { id } = req.params;
    const { quantity } = updateCartItemSchema.parse(req.body);
    const userId = req.user.id;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userCart = mockCarts[userId];
      if (!userCart) throw new NotFoundError('Cart not found');

      const item = userCart.items.find((i) => i.id === id);
      if (!item) throw new NotFoundError('Cart item not found');

      const variant = await inventoryService.getVariantDetails(item.variant_id);
      item.quantity = Math.min(10, Math.min(variant.stock_quantity, quantity));

      return ApiResponse.success(res, {
        message: 'Quantity updated',
        data: { item },
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      throw new NotFoundError('Cart item not found');
    }

    return ApiResponse.success(res, {
      message: 'Quantity updated',
      data: { item: updated },
    });
  },

  /**
   * DELETE /api/cart/items/:id
   * Removes item from cart
   */
  removeItem: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userCart = mockCarts[userId];
      if (userCart) {
        userCart.items = userCart.items.filter((i) => i.id !== id);
      }
      return ApiResponse.success(res, { message: 'Item removed from cart' });
    }

    await supabaseAdmin.from('cart_items').delete().eq('id', id);
    return ApiResponse.success(res, { message: 'Item removed from cart' });
  },

  /**
   * DELETE /api/cart
   * Clears all items in customer cart
   */
  clearCart: async (req, res) => {
    const userId = req.user.id;

    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      if (mockCarts[userId]) {
        mockCarts[userId].items = [];
      }
      return ApiResponse.success(res, { message: 'Cart cleared successfully' });
    }

    const { data: cart } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (cart) {
      await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
    }

    return ApiResponse.success(res, { message: 'Cart cleared successfully' });
  },

  /**
   * POST /api/cart/merge
   * Reconciles guest localStorage items into database cart on login (ADR-005)
   */
  mergeCart: async (req, res) => {
    const userId = req.user.id;
    const { items } = mergeCartSchema.parse(req.body);

    for (const item of items) {
      try {
        await cartController.addItem(
          {
            user: req.user,
            body: item,
          },
          { status: () => ({ json: () => {} }) }
        );
      } catch {
        // If out of stock, skip gracefully
      }
    }

    return ApiResponse.success(res, {
      message: 'Guest cart merged successfully into customer account',
    });
  },

  /**
   * POST /api/cart/quote
   * Authoritative server pricing quote with coupon validation
   * Enforces Rule 1 (Zero Client Pricing)
   */
  getQuote: async (req, res) => {
    const userId = req.user.id;
    const { coupon_code } = quoteCartSchema.parse(req.body);

    // Get current cart items
    let cartItems = [];
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const userCart = mockCarts[userId] || { items: [] };
      cartItems = userCart.items;
    } else {
      const { data: cart } = await supabaseAdmin.from('carts').select('id').eq('user_id', userId).single();
      if (cart) {
        const { data: dbItems } = await supabaseAdmin.from('cart_items').select('variant_id, quantity').eq('cart_id', cart.id);
        cartItems = dbItems || [];
      }
    }

    if (cartItems.length === 0) {
      return ApiResponse.success(res, {
        message: 'Cart is empty',
        data: {
          subtotal: 0,
          discount_amount: 0,
          shipping_fee: 0,
          tax_amount: 0,
          total_amount: 0,
          coupon_applied: null,
          items_breakdown: [],
          currency: 'INR',
        },
      });
    }

    const quote = await pricingService.calculateOrderQuote({
      items: cartItems,
      couponCode: coupon_code,
      userId,
    });

    return ApiResponse.success(res, {
      message: 'Authoritative price quote calculated',
      data: quote,
    });
  },

  // Internal helpers for orderController to access mock cart state
  _getMockCartItems: (userId) => {
    const userCart = mockCarts[userId];
    return userCart?.items || [];
  },

  _clearMockCart: (userId) => {
    if (mockCarts[userId]) {
      mockCarts[userId].items = [];
    }
  },
};
