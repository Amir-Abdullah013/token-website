import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🧪 Testing wallet creation for user:', session.id);

    // Test 1: Check if user exists
    try {
      const user = await databaseHelpers.user.getUserById(session.id);
      console.log('✅ User exists:', { id: user.id, email: user.email });
    } catch (error) {
      console.error('❌ User check failed:', error);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: error.message
      }, { status: 400 });
    }

    // Test 2: Check if wallet exists
    let wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    console.log('🔍 Existing wallet:', wallet ? { id: wallet.id, balance: wallet.balance } : 'No wallet found');

    // Test 3: Create wallet if it doesn't exist
    if (!wallet) {
      try {
        wallet = await databaseHelpers.wallet.createWallet(session.id, 'USD');
        console.log('✅ Wallet created:', { id: wallet.id, userId: wallet.userId });
      } catch (error) {
        console.error('❌ Wallet creation failed:', error);
        return NextResponse.json({
          success: false,
          error: 'Wallet creation failed',
          details: error.message,
          constraint: error.constraint
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet test completed successfully',
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        currency: wallet.currency
      }
    });

  } catch (error) {
    console.error('❌ Wallet test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Wallet test failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}






