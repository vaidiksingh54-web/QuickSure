import { ApiResponse } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { orderService } from '../services/orderService.js';
import {
  checkoutSchema,
  updateSubOrderStatusSchema,
  orderIdParamSchema,
  paginationSchema,
} from '../validators/orderValidator.js';

export const orderController = {
  /**
   * POST /api/orders/checkout
   * Place an order from the customer's active cart
   */
  checkout: async (req, res) => {
    const userId = req.user.id;
    const payload = checkoutSchema.parse(req.body);

    // Get cart items by making an internal fetch to the cart data layer
    let cartItems = [];
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      // Import the cartController's internal getter to read its mock state
      const { cartController } = await import('./cartController.js');
      const rawItems = cartController._getMockCartItems(userId);
      if (!rawItems || rawItems.length === 0) {
        return ApiResponse.error(res, {
          message: 'Your cart is empty. Add items before checkout.',
          code: 'EMPTY_CART',
          statusCode: 422,
        });
      }
      cartItems = rawItems.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
      }));
    } else {
      const { supabaseAdmin } = await import('../config/supabase.js');
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id, cart_items(variant_id, quantity)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
        return ApiResponse.error(res, {
          message: 'Your cart is empty. Add items before checkout.',
          code: 'EMPTY_CART',
          statusCode: 422,
        });
      }
      cartItems = cart.cart_items;
    }

    // Orchestrate checkout
    const result = await orderService.placeOrder(userId, payload, cartItems);

    // Clear cart after successful order
    if (env.NODE_ENV !== 'production' && env.SUPABASE_URL.includes('placeholder.supabase.co')) {
      const { cartController } = await import('./cartController.js');
      cartController._clearMockCart(userId);
    }

    return ApiResponse.success(res, {
      message: `Order ${result.order.order_number} placed successfully!`,
      data: result,
      statusCode: 201,
    });
  },

  /**
   * GET /api/orders
   * Paginated order history for the authenticated customer
   */
  getMyOrders: async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await orderService.getOrdersForUser(userId, page, limit);

    return ApiResponse.paginated(res, {
      data: result.orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Order history retrieved successfully',
    });
  },

  /**
   * GET /api/orders/:id
   * Get single order detail with sub-orders, items, and payment info
   */
  getOrderById: async (req, res) => {
    const { id } = orderIdParamSchema.parse(req.params);
    const userId = req.user.id;
    const role = req.user.role;

    const order = await orderService.getOrderById(id, userId, role);

    return ApiResponse.success(res, {
      message: 'Order details retrieved successfully',
      data: order,
    });
  },

  /**
   * GET /api/orders/seller/fulfillment
   * List sub-orders for the authenticated seller's fulfillment dashboard
   */
  getSellerSubOrders: async (req, res) => {
    const sellerUserId = req.user.id;
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await orderService.getSubOrdersForSeller(sellerUserId, page, limit);

    return ApiResponse.paginated(res, {
      data: result.sub_orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Seller fulfillment sub-orders retrieved successfully',
    });
  },

  /**
   * PUT /api/orders/sub/:id/status
   * Update sub-order status (seller or admin — state machine enforced)
   */
  updateSubOrderStatus: async (req, res) => {
    const { id } = orderIdParamSchema.parse(req.params);
    const payload = updateSubOrderStatusSchema.parse(req.body);
    const userId = req.user.id;
    const role = req.user.role;

    const result = await orderService.updateSubOrderStatus(
      id,
      payload.status,
      userId,
      role,
      {
        courier_name: payload.courier_name,
        tracking_number: payload.tracking_number,
        notes: payload.notes,
      }
    );

    return ApiResponse.success(res, {
      message: `Sub-order status updated: ${result.transition.from} → ${result.transition.to}`,
      data: result,
    });
  },

  /**
   * GET /api/orders/admin/all
   * Admin-only: list all orders across all users
   */
  getAllOrders: async (req, res) => {
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await orderService.getAllOrders(page, limit);

    return ApiResponse.paginated(res, {
      data: result.orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'All orders retrieved successfully',
    });
  },
};
