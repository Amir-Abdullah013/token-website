import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists first
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's wallet data
    const wallet = await databaseHelpers.wallet.getUserWallet(userId);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await databaseHelpers.wallet.createWallet(userId);
      // Get dynamic price even for new wallets
      let tikiPrice = 0.0035;
      try {
        const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
        tikiPrice = tokenValue.currentTokenValue;
      } catch (error) {
        console.log('⚠️ Using fallback price for new wallet:', error.message);
      }
      
      return NextResponse.json({
        success: true,
        usdBalance: newWallet.balance || 0,
        tikiBalance: newWallet.tikiBalance || 0,
        tikiPrice: tikiPrice
      });
    }

    // Get current TIKI price using supply-based calculation
    let tikiPrice = 0.0035; // Default price
    try {
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      tikiPrice = tokenValue.currentTokenValue;
      console.log('📊 Wallet balance API using supply-based price:', {
        currentPrice: tikiPrice,
        inflationFactor: tokenValue.inflationFactor,
        userSupplyRemaining: tokenValue.userSupplyRemaining
      });
    } catch (priceError) {
      console.log('⚠️ Using default TIKI price due to price calculation error:', priceError.message);
      // Use default price if calculation fails
    }

    return NextResponse.json({
      success: true,
      usdBalance: wallet.balance || 0,
      tikiBalance: wallet.tikiBalance || 0,
      tikiPrice: tikiPrice
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
