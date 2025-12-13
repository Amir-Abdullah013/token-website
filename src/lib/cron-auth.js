import { NextResponse } from 'next/server';

/**
 * Cron Authentication Helper
 * Verifies requests from Vercel Cron, Render Cron, or manual cron triggers
 * 
 * Supports:
 * - Vercel Cron: Automatically sends x-vercel-signature header
 * - Render Cron: Uses CRON_SECRET in Authorization header
 * - Manual triggers: Uses CRON_SECRET in Authorization header
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

  // Check for Render Cron or other services using CRON_SECRET
  // Render cron jobs will send Authorization header with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
  
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check for Render-specific headers (if Render adds any in the future)
  const renderCronId = request.headers.get('x-render-cron-id');
  if (renderCronId && process.env.RENDER) {
    // If running on Render and has Render cron header, allow it
    // You can add additional validation here if needed
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

