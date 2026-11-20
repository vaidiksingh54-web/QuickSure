import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public routes
router.get('/', asyncHandler(categoryController.getAllCategories));
router.get('/:slug', asyncHandler(categoryController.getCategoryBySlug));

// Admin-only management routes
router.post('/', requireAuth, requireRole('admin'), asyncHandler(categoryController.createCategory));
router.put('/:id', requireAuth, requireRole('admin'), asyncHandler(categoryController.updateCategory));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(categoryController.deleteCategory));

export default router;
