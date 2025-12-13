import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { requireCronAuth } from '@/lib/cron-auth.js';

/**
 * Cron job to cleanup expired password reset tokens
 * Should be run every hour via Vercel Cron
 * 
 * Security: Protected by Vercel Cron authentication or CRON_SECRET
 */
export async function GET(request) {
  try {
    // Verify cron authentication (Vercel Cron or CRON_SECRET)
    const authError = requireCronAuth(request);
    if (authError) {
      return authError;
    }

    console.log('🧹 Starting password reset token cleanup...');
    
    // Cleanup expired password resets
    const result = await databaseHelpers.passwordReset.cleanupExpiredResets();
    
    const message = result.count > 0 
      ? `Cleaned up ${result.count} expired password reset token(s)`
      : 'No expired tokens to clean up';
    
    console.log(`✅ ${message}`);
    
    return NextResponse.json({
      success: true,
      message,
      count: result.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in cleanup cron job:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup expired tokens',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative POST endpoint for manual triggering or webhook-based crons
 */
export async function POST(request) {
  return GET(request);
}

