import { Router } from 'express'
import { wishlistController } from '../controllers/wishlistController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Wishlist requires authentication
router.use(requireAuth)

router.get('/', asyncHandler(wishlistController.getWishlist))
router.post('/toggle', asyncHandler(wishlistController.toggleWishlistItem))
router.post('/move-to-cart', asyncHandler(wishlistController.moveToCart))

export default router
