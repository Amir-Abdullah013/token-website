import { NextResponse } from 'next/server';

/**
 * Cron Authentication Helper
 * Verifies requests from Vercel Cron or manual cron triggers
 * 
 * Vercel Cron automatically sends requests with special headers.
 * This helper supports both Vercel Cron and manual triggers with CRON_SECRET.
 */

/**
 * Verify if a request is authorized to run as a cron job
 * @param {Request} request - The incoming request
 * @returns {boolean} - True if authorized, false otherwise
 */
export function verifyCronRequest(request) {
  // Check for Vercel Cron signature (Vercel automatically adds this header)
  const vercelSignature = request.headers.get('x-vercel-signature');
  if (vercelSignature) {
    // Vercel Cron requests are automatically authenticated
    return true;
  }

  // Check for CRON_SECRET in authorization header (for manual testing or other cron services)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
  
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // In development, allow requests without auth for easier testing
  if (process.env.NODE_ENV === 'development' && !authHeader) {
    console.warn('⚠️  Development mode: Allowing cron request without authentication');
    return true;
  }

  return false;
}

/**
 * Middleware function to protect cron endpoints
 * Returns an error response if unauthorized, or null if authorized
 * @param {Request} request - The incoming request
 * @returns {NextResponse|null} - Error response if unauthorized, null if authorized
 */
export function requireCronAuth(request) {
  if (!verifyCronRequest(request)) {
    console.warn('⚠️  Unauthorized cron job access attempt');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

