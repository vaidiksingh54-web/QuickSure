import { supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';

/**
 * Express Authentication Middleware (requireAuth)
 * Validates Bearer JWT, fetches authoritative profile from PostgreSQL,
 * and attaches user & seller context to the request.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header. Expected "Bearer <token>"');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    // Support deterministic testing tokens in development / test environments
    if (env.NODE_ENV !== 'production' && token.startsWith('mock-')) {
      const mockProfiles = {
        'mock-customer-token': {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'customer@quicksure.local',
          full_name: 'Demo Customer',
          role: 'customer',
          is_active: true,
        },
        'mock-seller-token': {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'seller@quicksure.local',
          full_name: 'Demo Seller',
          role: 'seller',
          is_active: true,
        },
        'mock-admin-token': {
          id: '33333333-3333-3333-3333-333333333333',
          email: 'admin@quicksure.local',
          full_name: 'Platform Admin',
          role: 'admin',
          is_active: true,
        },
        'mock-inactive-token': {
          id: '44444444-4444-4444-4444-444444444444',
          email: 'suspended@quicksure.local',
          full_name: 'Suspended User',
          role: 'customer',
          is_active: false,
        },
      };

      const matchedProfile = mockProfiles[token];
      if (!matchedProfile) {
        throw new UnauthorizedError('Invalid test authentication token');
      }

      if (!matchedProfile.is_active) {
        throw new ForbiddenError('Your account has been suspended. Please contact customer support.');
      }

      req.user = matchedProfile;
      if (matchedProfile.role === 'seller') {
        req.seller = {
          id: 's0000001-0000-0000-0000-000000000001',
          store_name: 'ElectroPrime India',
          status: 'approved',
          commission_rate: 10.00,
        };
      }
      return next();
    }

    // Standard Supabase Auth token validation
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }

    const userId = authData.user.id;

    // Fetch authoritative profile from database (enforces Rule 3: Single Source of Truth)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, avatar_url, phone, role, is_active')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedError('User profile not found. Please sync your account.');
    }

    if (!profile.is_active) {
      throw new ForbiddenError('Your account has been suspended. Please contact customer support.');
    }

    req.user = profile;

    // Attach seller store profile if user is a registered seller
    if (profile.role === 'seller') {
      const { data: sellerProfile } = await supabaseAdmin
        .from('sellers')
        .select('id, store_name, store_slug, status, commission_rate')
        .eq('user_id', userId)
        .single();

      req.seller = sellerProfile || null;
    }

    next();
  } catch (error) {
    next(error);
  }
};
