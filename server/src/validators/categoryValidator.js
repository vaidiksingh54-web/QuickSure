import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional().nullable(),
  icon_url: z.string().url('Must be a valid URL').optional().nullable(),
  parent_id: z.string().uuid('Parent ID must be a valid UUID').optional().nullable(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
