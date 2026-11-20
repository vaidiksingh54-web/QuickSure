import { z } from 'zod';

const idRegex = /^[a-zA-Z0-9_-]{1,64}$/;

export const addToCartSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID is required').regex(idRegex, 'Variant ID must be a valid ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per item'),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 units per item'),
});

export const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      variant_id: z.string().min(1).regex(idRegex, 'Variant ID must be a valid ID'),
      quantity: z.coerce.number().int().min(1).max(10),
    })
  ).min(1, 'Items array cannot be empty'),
});

export const quoteCartSchema = z.object({
  coupon_code: z.string().trim().max(40).optional().nullable(),
  shipping_address_id: z.string().regex(idRegex, 'Shipping address ID must be a valid ID').optional().nullable(),
});
