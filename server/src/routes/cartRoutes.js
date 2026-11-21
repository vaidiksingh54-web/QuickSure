import { Router } from 'express'
import { cartController } from '../controllers/cartController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Cart operations require customer authentication
router.use(requireAuth)

router.get('/', asyncHandler(cartController.getCart))
router.post('/items', asyncHandler(cartController.addItem))
router.put('/items/:id', asyncHandler(cartController.updateItemQuantity))
router.delete('/items/:id', asyncHandler(cartController.removeItem))
router.delete('/', asyncHandler(cartController.clearCart))
router.post('/merge', asyncHandler(cartController.mergeCart))
router.post('/quote', asyncHandler(cartController.getQuote))

export default router
