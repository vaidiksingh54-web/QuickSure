import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// All order endpoints require authentication
router.use(requireAuth)

// Customer endpoints
router.post('/checkout', asyncHandler(orderController.checkout))
router.get('/', asyncHandler(orderController.getMyOrders))

// Seller fulfillment (must come before /:id to avoid route collision)
router.get('/seller/fulfillment', requireRole('seller', 'admin'), asyncHandler(orderController.getSellerSubOrders))

// Admin oversight (must come before /:id to avoid route collision)
router.get('/admin/all', requireRole('admin'), asyncHandler(orderController.getAllOrders))

// Sub-order status updates (seller + admin)
router.put('/sub/:id/status', requireRole('seller', 'admin'), asyncHandler(orderController.updateSubOrderStatus))

// Single order detail (must be last — /:id is a catch-all param)
router.get('/:id', asyncHandler(orderController.getOrderById))

export default router
