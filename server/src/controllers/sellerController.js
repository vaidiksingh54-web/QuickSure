import { ApiResponse } from '../utils/apiResponse.js';
import { sellerService } from '../services/sellerService.js';
import { orderService } from '../services/orderService.js';
import {
  sellerOnboardingSchema,
  updateStockSchema,
  dispatchSubOrderSchema,
  sellerParamIdSchema,
} from '../validators/sellerValidator.js';
import { paginationSchema } from '../validators/orderValidator.js';

export const sellerController = {
  /**
   * GET /api/seller/profile
   * Retrieve store profile of authenticated vendor
   */
  getProfile: async (req, res) => {
    const profile = await sellerService.getStoreProfile(req.user.id);
    return ApiResponse.success(res, {
      message: 'Store profile retrieved successfully',
      data: profile,
    });
  },

  /**
   * POST /api/seller/onboard
   * Register or update vendor storefront profile
   */
  upsertProfile: async (req, res) => {
    const payload = sellerOnboardingSchema.parse(req.body);
    const profile = await sellerService.upsertStoreProfile(req.user.id, payload);
    return ApiResponse.success(res, {
      message: 'Store profile saved successfully',
      data: profile,
      statusCode: 201,
    });
  },

  /**
   * GET /api/seller/products
   * List products belonging to authenticated seller
   */
  getProducts: async (req, res) => {
    const result = await sellerService.getSellerProducts(req.user.id);
    return ApiResponse.success(res, {
      message: 'Seller products retrieved successfully',
      data: result,
    });
  },

  /**
   * PUT /api/seller/variants/:id/stock
   * Quick update of variant stock quantity (Rule 5 IDOR protected)
   */
  updateStock: async (req, res) => {
    const { id } = sellerParamIdSchema.parse(req.params);
    const { stock_quantity } = updateStockSchema.parse(req.body);

    const updated = await sellerService.updateVariantStock(req.user.id, id, stock_quantity);
    return ApiResponse.success(res, {
      message: `Stock for SKU '${updated.sku}' updated to ${updated.stock_quantity}`,
      data: updated,
    });
  },

  /**
   * GET /api/seller/orders
   * List sub-orders assigned to authenticated seller for fulfillment
   */
  getFulfillmentOrders: async (req, res) => {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await orderService.getSubOrdersForSeller(req.user.id, page, limit);

    return ApiResponse.paginated(res, {
      data: result.sub_orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Seller fulfillment orders retrieved successfully',
    });
  },

  /**
   * PUT /api/seller/orders/sub/:id/dispatch
   * Dispatch sub-order package with courier and tracking number
   */
  dispatchOrder: async (req, res) => {
    const { id } = sellerParamIdSchema.parse(req.params);
    const payload = dispatchSubOrderSchema.parse(req.body);

    const result = await sellerService.dispatchSubOrder(req.user.id, id, payload);
    return ApiResponse.success(res, {
      message: `Sub-order marked as dispatched via ${payload.courier_name}`,
      data: result,
    });
  },
};
