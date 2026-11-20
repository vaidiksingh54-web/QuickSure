import { z } from 'zod';

const idRegex = /^[a-zA-Z0-9_-]{1,64}$/;

export const checkoutSchema = z.object({
  payment_method: z.enum(['card_sim', 'upi_sim', 'cod_sim'], {
    errorMap: () => ({ message: 'Payment method must be one of: card_sim, upi_sim, cod_sim' }),
  }),
  shipping_address: z.object({
    recipient_name: z.string().min(2, 'Recipient name is required').max(150),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(25),
    street_address: z.string().min(5, 'Street address is required').max(500),
    apartment: z.string().max(100).optional().nullable(),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    postal_code: z.string().min(5, 'Postal code is required').max(20),
    country: z.string().max(100).default('India'),
  }),
  coupon_code: z.string().trim().max(40).optional().nullable(),
  idempotency_key: z.string().min(10, 'Idempotency key must be at least 10 characters').max(100),
});

export const updateSubOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: confirmed, packed, shipped, delivered, cancelled' }),
  }),
  courier_name: z.string().max(100).optional().nullable(),
  tracking_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1).regex(idRegex, 'Order ID must be a valid identifier'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
