import { z } from 'zod';

export const createVariantSchema = z.object({
  sku: z.string().trim().min(3, 'SKU must be at least 3 characters').max(80),
  variant_name: z.string().trim().min(1, 'Variant name is required').max(150),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  attributes: z.record(z.any()).default({}),
  is_active: z.boolean().default(true),
}).refine(
  (data) => !data.compare_at_price || data.compare_at_price >= data.price,
  {
    message: 'Compare at price must be greater than or equal to sale price',
    path: ['compare_at_price'],
  }
);

export const productImageSchema = z.object({
  image_url: z.string().url('Must be a valid image URL'),
  alt_text: z.string().trim().max(200).optional().nullable(),
  is_primary: z.boolean().default(false),
  display_order: z.coerce.number().int().default(0),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  slug: z.string().trim().min(3).max(280).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  brand: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().uuid('Category ID must be a valid UUID'),
  specifications: z.record(z.any()).default({}),
  variants: z.array(createVariantSchema).min(1, 'Product must have at least one variant SKU'),
  images: z.array(productImageSchema).min(1, 'Product must have at least one image'),
});

export const updateProductSchema = z.object({
  title: z.string().trim().min(3).max(255).optional(),
  brand: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().min(10).optional(),
  category_id: z.string().uuid().optional(),
  specifications: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort_by: z.enum(['featured', 'price_asc', 'price_desc', 'rating', 'newest']).default('featured'),
});
