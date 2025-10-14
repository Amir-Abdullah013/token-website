import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { usdAmount } = await request.json();
    
    if (!usdAmount || usdAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Ensure a real DB user exists; resolve by id or email, else create
    let userId = session.id;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      let dbUser = await databaseHelpers.user.getUserById(session.id);
      if (!dbUser && session.email) {
        dbUser = await databaseHelpers.user.getUserByEmail(session.email);
      }
      if (!dbUser) {
        const name = session.name || (session.email ? session.email.split('@')[0] : 'User');
        const password = `oauth_${Date.now()}`;
        dbUser = await databaseHelpers.user.createUser({
          email: session.email || `user_${Date.now()}@example.com`,
          password,
          name,
          emailVerified: true,
          role: 'USER'
        });
      }
      userId = dbUser.id;
    } catch (resolveErr) {
      console.error('Error resolving/creating DB user for buy:', resolveErr);
      return NextResponse.json({ success: false, error: 'Failed to resolve user for buy' }, { status: 500 });
    }

    // Get current price and stats
    let currentPrice, totalTokens, totalInvestment;
    
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const stats = await databaseHelpers.tokenStats.getTokenStats();
      currentPrice = stats.currentPrice;
      totalTokens = stats.totalTokens;
      totalInvestment = stats.totalInvestment;
    } catch (dbError) {
      console.warn('Database not available, using fallback values:', dbError.message);
      currentPrice = 0.0035;
      totalTokens = 100000000;
      totalInvestment = 350000;
    }

    // Calculate tokens to buy
    const tokensToBuy = usdAmount / currentPrice;
    
    // Update token stats with new investment
    let updatedStats;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      updatedStats = await databaseHelpers.tokenStats.updateTokenStats(usdAmount);
    } catch (dbError) {
      console.warn('Database update failed, using fallback calculation:', dbError.message);
      // Fallback calculation
      const newTotalInvestment = totalInvestment + usdAmount;
      const newPrice = newTotalInvestment / totalTokens;
      updatedStats = {
        currentPrice: newPrice,
        totalTokens: totalTokens,
        totalInvestment: newTotalInvestment,
        lastUpdated: new Date()
      };
    }

    // Update user's TIKI balance and create real transaction
    let updatedWallet;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      // Ensure wallet exists
      let wallet = await databaseHelpers.wallet.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await databaseHelpers.wallet.createWallet(userId);
      }
      // Increase tiki balance by tokensToBuy
      updatedWallet = await databaseHelpers.wallet.updateTikiBalance(userId, tokensToBuy);
      // Create transaction record (BUY, USD amount)
      await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'TikiMarket',
        description: `Bought ${tokensToBuy.toFixed(2)} TIKI at ${currentPrice} USD`
      });
    } catch (txErr) {
      console.error('Error updating wallet/creating transaction for buy:', txErr);
      return NextResponse.json({ success: false, error: 'Failed to update wallet for buy' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        tokensReceived: tokensToBuy,
        pricePerToken: currentPrice,
        newPrice: updatedStats.currentPrice,
        status: 'COMPLETED',
        createdAt: new Date()
      },
      newWallet: {
        tikiBalance: updatedWallet?.tikiBalance ?? null
      },
      priceUpdate: {
        oldPrice: currentPrice,
        newPrice: updatedStats.currentPrice,
        totalInvestment: updatedStats.totalInvestment,
        totalTokens: updatedStats.totalTokens,
        lastUpdated: updatedStats.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error processing Tiki buy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process buy order' },
      { status: 500 }
    );
  }
}
