import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { calculateFee, creditFeeToAdmin } from '../../../../lib/fees';

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

    // Get current price from SUPPLY-BASED calculation (buy-based inflation removed)
    let currentPrice;
    
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      currentPrice = tokenValue.currentTokenValue;
      
      console.log('📊 Using supply-based token value:', {
        currentPrice,
        inflationFactor: tokenValue.inflationFactor,
        userSupplyRemaining: tokenValue.userSupplyRemaining,
        usagePercentage: tokenValue.usagePercentage
      });
    } catch (dbError) {
      console.warn('Database not available, using fallback value:', dbError.message);
      currentPrice = 0.0035; // Base value
    }

    // Calculate buy fee (1% for buy transactions)
    const { fee, net } = await calculateFee(usdAmount, "buy");
    
    // Calculate tokens to buy (based on net amount after fee)
    const tokensToBuy = net / currentPrice;
    
    // Check if user supply has enough tokens
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
      
      if (tokenSupply && Number(tokenSupply.userSupplyRemaining) < tokensToBuy) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient user supply available',
          details: {
            requested: tokensToBuy,
            available: Number(tokenSupply.userSupplyRemaining),
            message: 'User supply limit reached. Admin needs to unlock more tokens from reserve.'
          }
        }, { status: 400 });
      }
    } catch (supplyError) {
      console.warn('Could not check supply limits:', supplyError.message);
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
      // Create transaction record (BUY, USD amount) with fee information
      await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'TikiMarket',
        description: `Bought ${tokensToBuy.toFixed(2)} TIKI at ${currentPrice} USD`,
        feeAmount: fee,
        netAmount: net,
        feeReceiverId: 'ADMIN_WALLET',
        transactionType: 'buy'
      });
      
      // Credit fee to admin wallet
      if (fee > 0) {
        await creditFeeToAdmin(databaseHelpers.pool, fee);
        console.log('💰 Buy API: Fee credited to admin wallet:', fee);
      }
    } catch (txErr) {
      console.error('Error updating wallet/creating transaction for buy:', txErr);
      return NextResponse.json({ success: false, error: 'Failed to update wallet for buy' }, { status: 500 });
    }

    // Deduct from user supply after successful transaction (supply-based economy)
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      await databaseHelpers.pool.query(`
        UPDATE token_supply 
        SET "userSupplyRemaining" = "userSupplyRemaining" - $1,
            "updatedAt" = NOW()
      `, [tokensToBuy]);
      
      console.log('✅ User supply deducted:', tokensToBuy, 'TIKI');
    } catch (supplyError) {
      console.error('⚠️ Could not deduct from user supply:', supplyError.message);
    }

    return NextResponse.json({
      success: true,
      transaction: {
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        fee: fee,
        netAmount: net,
        tokensReceived: tokensToBuy,
        pricePerToken: currentPrice,
        status: 'COMPLETED',
        createdAt: new Date()
      },
      newWallet: {
        tikiBalance: updatedWallet?.tikiBalance ?? null
      },
      priceUpdate: {
        currentPrice: currentPrice,
        _note: 'Supply-based pricing active. Buy-based inflation removed.'
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
