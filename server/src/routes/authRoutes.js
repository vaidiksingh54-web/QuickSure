import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { requireRole, requireApprovedSeller } from '../middlewares/roleMiddleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/apiResponse.js'

const router = Router()

// All auth routes require valid authentication
router.use(requireAuth)

// Profile management
router.get('/me', asyncHandler(authController.getMe))
router.put('/profile', asyncHandler(authController.updateProfile))
router.post('/sync-session', asyncHandler(authController.syncSession))

// RBAC Verification Endpoints
router.get(
  '/admin-check',
  requireRole('admin'),
  asyncHandler((req, res) => {
    return ApiResponse.success(res, {
      message: 'Authorized: Administrative privileges verified',
      data: { user: req.user }
    })
  })
)

router.get(
  '/seller-check',
  requireRole('seller'),
  requireApprovedSeller,
  asyncHandler((req, res) => {
    return ApiResponse.success(res, {
      message: 'Authorized: Approved seller store verified',
      data: { user: req.user, seller: req.seller }
    })
  })
)

export default router
