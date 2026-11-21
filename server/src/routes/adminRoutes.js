import { Router } from 'express'
import { adminController } from '../controllers/adminController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Strict RBAC Invariant: ALL admin routes require authentication and 'admin' role
router.use(requireAuth)
router.use(requireRole('admin'))

// Platform Analytics
router.get('/stats', asyncHandler(adminController.getStats))

// Seller Management
router.get('/sellers', asyncHandler(adminController.getSellers))
router.put('/sellers/:id/status', asyncHandler(adminController.updateSellerStatus))
router.put('/sellers/:id/commission', asyncHandler(adminController.updateSellerCommission))

// Category Management
router.get('/categories', asyncHandler(adminController.getCategories))
router.post('/categories', asyncHandler(adminController.createCategory))
router.put('/categories/:id', asyncHandler(adminController.updateCategory))
router.delete('/categories/:id', asyncHandler(adminController.deleteCategory))

export default router
