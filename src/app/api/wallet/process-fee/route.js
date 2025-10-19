import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import walletFeeService from '@/lib/walletFeeService.js';

/**
 * Process wallet fee for the authenticated user
 * User-authenticated endpoint to manually process their wallet fee
 */
export async function GET(request) {
  try {
    // Get session
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.id;
    console.log(`Processing wallet fee for user ${userId}`);

    // Process the wallet fee
    const result = await walletFeeService.processWalletFeeForUser(userId);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error processing wallet fee:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process wallet fee',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Support POST as well
  return GET(request);
}

