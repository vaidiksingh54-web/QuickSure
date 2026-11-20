import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { storageService } from '../services/storageService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

/**
 * POST /api/upload/product-image
 * Protected: Seller/Admin upload endpoint.
 * Accepts JSON with { image_base64, filename, mime_type }
 */
router.post(
  '/product-image',
  requireAuth,
  requireRole('seller', 'admin'),
  asyncHandler(async (req, res) => {
    const { image_base64, filename, mime_type } = req.body;

    if (!image_base64 || !filename) {
      throw new ValidationError('image_base64 and filename are required');
    }

    const mime = mime_type || 'image/jpeg';
    const buffer = Buffer.from(image_base64, 'base64');

    // 5MB limit
    if (buffer.length > 5 * 1024 * 1024) {
      throw new ValidationError('File size exceeds the 5MB limit');
    }

    const uploaded = await storageService.uploadProductImage({
      buffer,
      originalName: filename,
      mimeType: mime,
    });

    return ApiResponse.success(res, {
      statusCode: 201,
      message: 'Product image uploaded successfully',
      data: uploaded,
    });
  })
);

export default router;
