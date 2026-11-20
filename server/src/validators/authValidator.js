import { z } from 'zod';

/**
 * Validation schema for updating user profile.
 * STRICT ENFORCEMENT OF RULE 3 (Zero Role Tampering):
 * 'role', 'id', 'email', and 'is_active' cannot be modified by user requests.
 */
export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150).optional(),
  avatar_url: z.string().url('Must be a valid URL').optional().nullable(),
  phone: z.string().trim().regex(/^[+0-9\s-]{7,20}$/, 'Must be a valid phone number').optional().nullable(),
}).strict({
  message: 'Unexpected fields detected. Role, email, and account status cannot be modified.',
});
