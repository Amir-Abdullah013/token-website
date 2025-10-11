import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching wallet for user:', session.id);
    
    // Get user's wallet
    const wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      console.log('📝 Creating new wallet for user:', session.id);
      const newWallet = await databaseHelpers.wallet.createWallet(session.id);
      return NextResponse.json({
        success: true,
        wallet: newWallet
      });
    }

    console.log('📊 Wallet found:', {
      id: wallet.id,
      tikiBalance: wallet.tikiBalance,
      usdBalance: wallet.usdBalance
    });

    return NextResponse.json({
      success: true,
      wallet
    });

  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}
