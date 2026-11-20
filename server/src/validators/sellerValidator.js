import { z } from 'zod';

const idRegex = /^[a-zA-Z0-9_-]{1,64}$/;

export const sellerOnboardingSchema = z.object({
  store_name: z.string().trim().min(3, 'Store name must be at least 3 characters').max(150),
  store_slug: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'Store slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).optional().nullable(),
  logo_url: z.string().url('Invalid logo URL').optional().nullable(),
  banner_url: z.string().url('Invalid banner URL').optional().nullable(),
});

export const updateStockSchema = z.object({
  stock_quantity: z.coerce
    .number()
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative'),
});

export const dispatchSubOrderSchema = z.object({
  courier_name: z.string().trim().min(2, 'Courier name is required').max(100),
  tracking_number: z.string().trim().min(3, 'Tracking number is required').max(100),
  notes: z.string().max(500).optional().nullable(),
});

export const sellerParamIdSchema = z.object({
  id: z.string().min(1).regex(idRegex, 'ID must be a valid identifier'),
});
