import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

/**
 * Cron job to cleanup expired password reset tokens
 * Should be run every hour via cron service (e.g., Vercel Cron, node-cron, etc.)
 * 
 * Setup:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/cleanup-reset-tokens",
 *        "schedule": "0 * * * *"
 *      }]
 *    }
 * 
 * 2. Or use node-cron in a background process:
 *    const cron = require('node-cron');
 *    cron.schedule('0 * * * *', async () => {
 *      await fetch('http://localhost:3000/api/cron/cleanup-reset-tokens');
 *    });
 * 
 * Security: This endpoint should be protected with a cron secret
 */
export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secure-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️  Unauthorized cron job access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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

