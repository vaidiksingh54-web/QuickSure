import { Router } from 'express';
import { sellerController } from '../controllers/sellerController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Strict RBAC Invariant: ALL seller routes require authentication and 'seller' or 'admin' role
router.use(requireAuth);
router.use(requireRole('seller', 'admin'));

// Store Onboarding & Profile
router.get('/profile', asyncHandler(sellerController.getProfile));
router.post('/onboard', asyncHandler(sellerController.upsertProfile));

// Catalog & Inventory
router.get('/products', asyncHandler(sellerController.getProducts));
router.put('/variants/:id/stock', asyncHandler(sellerController.updateStock));

// Fulfillment & Dispatch
router.get('/orders', asyncHandler(sellerController.getFulfillmentOrders));
router.put('/orders/sub/:id/dispatch', asyncHandler(sellerController.dispatchOrder));

export default router;
