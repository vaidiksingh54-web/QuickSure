import { ApiResponse } from '../utils/apiResponse.js';
import { adminService } from '../services/adminService.js';
import {
  updateSellerStatusSchema,
  updateCommissionSchema,
  adminCategorySchema,
  sellerIdParamSchema,
} from '../validators/adminValidator.js';
import { paginationSchema } from '../validators/orderValidator.js';

export const adminController = {
  /**
   * GET /api/admin/stats
   * Aggregated platform-wide financial & order statistics
   */
  getStats: async (req, res) => {
    const stats = await adminService.getPlatformStats();
    return ApiResponse.success(res, {
      message: 'Platform statistics retrieved successfully',
      data: stats,
    });
  },

  /**
   * GET /api/admin/sellers
   * Paginated sellers list with optional status filter
   */
  getSellers: async (req, res) => {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status || null;

    const result = await adminService.getSellers({ status, page, limit });

    return ApiResponse.paginated(res, {
      data: result.sellers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Sellers list retrieved successfully',
    });
  },

  /**
   * PUT /api/admin/sellers/:id/status
   * Approve, reject, or suspend a seller
   */
  updateSellerStatus: async (req, res) => {
    const { id } = sellerIdParamSchema.parse(req.params);
    const { status, reason } = updateSellerStatusSchema.parse(req.body);

    const updated = await adminService.updateSellerStatus(id, status, reason);

    return ApiResponse.success(res, {
      message: `Seller status updated to '${status}' successfully`,
      data: updated,
    });
  },

  /**
   * PUT /api/admin/sellers/:id/commission
   * Override seller platform commission rate
   */
  updateSellerCommission: async (req, res) => {
    const { id } = sellerIdParamSchema.parse(req.params);
    const { commission_rate } = updateCommissionSchema.parse(req.body);

    const updated = await adminService.updateCommissionRate(id, commission_rate);

    return ApiResponse.success(res, {
      message: `Seller commission rate set to ${commission_rate}% successfully`,
      data: updated,
    });
  },

  /**
   * GET /api/admin/categories
   * List all categories for administrative hierarchy tree
   */
  getCategories: async (req, res) => {
    const categories = await adminService.getCategories();
    return ApiResponse.success(res, {
      message: 'Admin categories list retrieved successfully',
      data: categories,
    });
  },

  /**
   * POST /api/admin/categories
   * Create a new category
   */
  createCategory: async (req, res) => {
    const payload = adminCategorySchema.parse(req.body);
    const created = await adminService.createCategory(payload);
    return ApiResponse.success(res, {
      message: `Category '${created.name}' created successfully`,
      data: created,
      statusCode: 201,
    });
  },

  /**
   * PUT /api/admin/categories/:id
   * Update category
   */
  updateCategory: async (req, res) => {
    const { id } = req.params;
    const payload = adminCategorySchema.partial().parse(req.body);
    const updated = await adminService.updateCategory(id, payload);
    return ApiResponse.success(res, {
      message: `Category updated successfully`,
      data: updated,
    });
  },

  /**
   * DELETE /api/admin/categories/:id
   * Remove a category
   */
  deleteCategory: async (req, res) => {
    const { id } = req.params;
    const deleted = await adminService.deleteCategory(id);
    return ApiResponse.success(res, {
      message: `Category removed successfully`,
      data: deleted,
    });
  },
};
