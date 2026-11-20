import { Router } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  // If using placeholder in local development, avoid hanging DNS requests
  if (env.SUPABASE_URL.includes('placeholder.supabase.co')) {
    dbStatus = 'placeholder_configured';
    dbLatencyMs = Date.now() - startTime;
  } else {
    try {
      // Race Supabase call against a 2000ms timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), 2000)
      );

      const dbCheckPromise = supabaseAdmin.from('profiles').select('id').limit(1);

      const result = await Promise.race([dbCheckPromise, timeoutPromise]);
      dbLatencyMs = Date.now() - startTime;

      if (result?.error) {
        // Table might not exist yet before migration
        dbStatus = result.error.message.includes('relation') ? 'pending_migration' : 'error';
      }
    } catch (err) {
      dbLatencyMs = Date.now() - startTime;
      dbStatus = err.message === 'DATABASE_TIMEOUT' ? 'timeout' : 'unreachable';
    }
  }

  return ApiResponse.success(res, {
    message: 'QuickSure API Gateway is operational',
    data: {
      service: 'quicksure-api',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  });
});

export default router;
