import { z } from 'zod';

const idRegex = /^[a-zA-Z0-9_-]{1,64}$/;

export const updateSellerStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'suspended', 'rejected'], {
    errorMap: () => ({ message: 'Status must be one of: pending, approved, suspended, rejected' }),
  }),
  reason: z.string().max(500).optional().nullable(),
});

export const updateCommissionSchema = z.object({
  commission_rate: z.coerce
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%'),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional().nullable(),
  parent_id: z.string().regex(idRegex, 'Parent ID must be a valid ID').optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const sellerIdParamSchema = z.object({
  id: z.string().min(1).regex(idRegex, 'Seller ID must be a valid identifier'),
});
