import { Router } from 'express'
import { productController } from '../controllers/productController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { requireRole, requireApprovedSeller } from '../middlewares/roleMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Public catalog routes
router.get('/', asyncHandler(productController.getProducts))
router.get('/detail/:slug', asyncHandler(productController.getProductBySlug))

// Seller specific routes
router.get(
  '/seller/mine',
  requireAuth,
  requireRole('seller'),
  requireApprovedSeller,
  asyncHandler(productController.getSellerProducts)
)

// Protected merchant & admin routes
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  asyncHandler(productController.createProduct)
)

router.put(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  asyncHandler(productController.updateProduct)
)

router.delete(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  asyncHandler(productController.deleteProduct)
)

export default router
