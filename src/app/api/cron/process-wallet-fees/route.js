import { NextResponse } from 'next/server';
import walletFeeService from '@/lib/walletFeeService.js';

/**
 * Cron endpoint to process all due wallet fees
 * Secured by cron secret key
 * Should run daily via Vercel Cron
 */
export async function GET(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

