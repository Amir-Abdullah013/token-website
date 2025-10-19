import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  try {
    const { userId, usdBalance, tikiBalance } = await request.json();
    
    if (!userId || usdBalance === undefined || tikiBalance === undefined) {
      return NextResponse.json(
        { success: false, error: 'User ID, USD balance, and TIKI balance are required' },
        { status: 400 }
      );
    }

    // Update user's wallet balances
    const updatedWallet = await databaseHelpers.wallet.updateBothBalances(
      userId, 
      usdBalance, 
      tikiBalance
    );

    return NextResponse.json({
      success: true,
      wallet: updatedWallet
    });

  } catch (error) {
    console.error('Error updating wallet balances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wallet balances' },
      { status: 500 }
    );
  }
}



