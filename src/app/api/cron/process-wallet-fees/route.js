import { NextResponse } from 'next/server';
import walletFeeService from '@/lib/walletFeeService.js';
import { requireCronAuth } from '@/lib/cron-auth.js';

/**
 * Cron endpoint to process all due wallet fees
 * Secured by Vercel Cron or cron secret key
 * Should run daily via Vercel Cron
 */
export async function GET(request) {
  try {
    // Verify cron authentication (Vercel Cron or CRON_SECRET)
    const authError = requireCronAuth(request);
    if (authError) {
      return authError;
    }

    console.log('🔄 Starting wallet fee batch processing...');
    
    // Process all due wallet fees
    const results = await walletFeeService.processAllDueWalletFees();

    console.log('✅ Wallet fee batch processing complete');
    
    return NextResponse.json({
      success: true,
      message: 'Wallet fee processing completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in wallet fee cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process wallet fees',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

