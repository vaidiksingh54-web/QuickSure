import { ApiResponse } from '../utils/apiResponse.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { updateProfileSchema } from '../validators/authValidator.js';

export const authController = {
  /**
   * GET /api/auth/me
   * Returns current authenticated user profile and merchant status
   */
  getMe: async (req, res) => {
    return ApiResponse.success(res, {
      message: 'Authenticated profile retrieved successfully',
      data: {
        profile: req.user,
        seller: req.seller || null,
      },
    });
  },

  /**
   * PUT /api/auth/profile
   * Updates user profile fields (full_name, avatar_url, phone)
   * Enforces Rule 3: Zero Role Tampering
   */
  updateProfile: async (req, res) => {
    // Validate request body strictly with Zod
    const validatedData = updateProfileSchema.parse(req.body);

    // In mock/test environment
    if (env.NODE_ENV !== 'production' && req.headers.authorization?.includes('mock-')) {
      const updatedProfile = {
        ...req.user,
        ...validatedData,
        updated_at: new Date().toISOString(),
      };
      return ApiResponse.success(res, {
        message: 'Profile updated successfully (test mode)',
        data: { profile: updatedProfile },
      });
    }

    // Production database update via Supabase
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(validatedData)
      .eq('id', req.user.id)
      .select('id, email, full_name, avatar_url, phone, role, is_active, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return ApiResponse.success(res, {
      message: 'Profile updated successfully',
      data: { profile: updatedProfile },
    });
  },

  /**
   * POST /api/auth/sync-session
   * Ensures profile, cart, and wishlist containers exist post-signup
   */
  syncSession: async (req, res) => {
    const { id, email, full_name, avatar_url } = req.user;

    // In mock/test environment
    if (env.NODE_ENV !== 'production' && req.headers.authorization?.includes('mock-')) {
      return ApiResponse.success(res, {
        message: 'Session synchronized (test mode)',
        data: { profile: req.user },
      });
    }

    // Upsert profile in PostgreSQL
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          email,
          full_name: full_name || email.split('@')[0],
          avatar_url: avatar_url || null,
          role: 'customer', // strictly defaults to customer
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, role, is_active')
      .single();

    if (error) {
      throw error;
    }

    // Ensure cart container exists
    await supabaseAdmin.from('carts').upsert({ user_id: id }, { onConflict: 'user_id' });

    // Ensure wishlist container exists
    await supabaseAdmin.from('wishlists').upsert({ user_id: id }, { onConflict: 'user_id' });

    return ApiResponse.success(res, {
      message: 'User session synchronized successfully',
      data: { profile },
    });
  },
};
