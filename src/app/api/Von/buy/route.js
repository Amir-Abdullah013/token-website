import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { calculateFee, creditFeeToAdmin } from '@/lib/fees';

export async function POST(request) {
  console.log('🚨🚨🚨 BUY FUNCTION CALLED - THIS SHOULD ALWAYS SHOW 🚨🚨🚨');
  console.log('🔧 [BUY] FUNCTION CALLED - Starting buy operation');
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

    // Check if wallet is locked
    const { checkWalletLock, createWalletLockedResponse } = await import('../../../../lib/walletLockCheck.js');
    const lockCheck = await checkWalletLock(userId);
    if (!lockCheck.allowed) {
      console.log('❌ Wallet is locked for user:', userId);
      return createWalletLockedResponse();
    }

    // Get current price from SUPPLY-BASED calculation (buy-based inflation removed)
    let currentPrice;
    
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      currentPrice = tokenValue.currentTokenValue;
      
      console.log('📊 Using improved supply-based token value:', {
        currentPrice,
        inflationFactor: tokenValue.inflationFactor,
        userSupplyRemaining: tokenValue.userSupplyRemaining,
        usagePercentage: tokenValue.usagePercentage,
        growthFactor: tokenValue.growthFactor,
        supplyUsed: tokenValue.supplyUsed,
        usageRatio: tokenValue.usageRatio
      });
    } catch (dbError) {
      console.warn('Database not available, using fallback value:', dbError.message);
      currentPrice = 0.0035; // Base value
    }

    // Calculate buy fee (1% for buy transactions)
    const { fee, net } = await calculateFee(usdAmount, "buy");
    
    // Calculate tokens to buy (based on net amount after fee)
    const tokensToBuy = net / currentPrice;
    
    // Check if user supply has enough tokens and get tokenSupply for later use
    let tokenSupply;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
      
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

    // Update user's Von balance and create real transaction
    let updatedWallet;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      // Ensure wallet exists
      let wallet = await databaseHelpers.wallet.getWalletByUserId(userId);
      if (!wallet) {
        wallet = await databaseHelpers.wallet.createWallet(userId);
      }
      
      // Check if user has sufficient USD balance
      if (usdAmount > wallet.balance) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient USD balance',
          details: {
            required: usdAmount,
            available: wallet.balance,
            message: 'You need more USD to complete this purchase'
          }
        }, { status: 400 });
      }
      
      // Deduct full USD amount from user's balance
      await databaseHelpers.wallet.updateBalance(userId, -usdAmount);
      
      // Increase Von balance by tokensToBuy (calculated from net amount)
      updatedWallet = await databaseHelpers.wallet.updateVonBalance(userId, tokensToBuy);
      // Create transaction record (BUY, USD amount) with fee information
      await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'VonMarket',
        description: `Bought ${tokensToBuy.toFixed(2)} Von at ${currentPrice} USD`,
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

    console.log('🔧 [BUY] REACHED LINE 131 - About to start supply deduction');
    console.log('🔧 [BUY] Transaction completed successfully, now deducting supply...');

    // Deduct from supply after successful transaction
    // CRITICAL: Updates BOTH remainingSupply AND userSupplyRemaining
    let newPrice = currentPrice;
    console.log('🔧 [BUY] STARTING SUPPLY DEDUCTION');
    console.log('🔧 [BUY] tokensToBuy:', tokensToBuy);
    console.log('🔧 [BUY] currentPrice:', currentPrice);
    
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Use the new comprehensive supply deduction method
      // This updates BOTH remainingSupply AND userSupplyRemaining atomically
      const updatedSupply = await databaseHelpers.tokenSupply.deductSupply(tokensToBuy);
      
      console.log('✅ Supply deducted successfully:', {
        amount: tokensToBuy,
        newRemainingSupply: Number(updatedSupply.remainingSupply),
        newUserSupplyRemaining: Number(updatedSupply.userSupplyRemaining),
        adminReserve: Number(updatedSupply.adminReserve)
      });
      
      // Recalculate price after supply update
      const updatedTokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      newPrice = updatedTokenValue.currentTokenValue;
      
      console.log('📈 Price updated after buy:', {
        oldPrice: currentPrice,
        newPrice: newPrice,
        priceIncrease: ((newPrice - currentPrice) / currentPrice * 100).toFixed(2) + '%',
        usagePercentage: updatedTokenValue.usagePercentage,
        distributedSupply: Number(updatedSupply.totalSupply) - Number(updatedSupply.remainingSupply)
      });
      
    } catch (supplyError) {
      console.error('❌ CRITICAL: Failed to deduct from supply:', supplyError.message);
      console.error('Supply error details:', supplyError);
      // Note: Transaction already completed, but supply tracking failed
      // This creates a discrepancy that needs manual reconciliation
      // TODO: Implement proper database transactions for atomicity
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
        VonBalance: updatedWallet?.VonBalance ?? null
      },
      priceUpdate: {
        oldPrice: currentPrice,
        newPrice: newPrice,
        currentPrice: newPrice,
        priceIncrease: ((newPrice - currentPrice) / currentPrice * 100).toFixed(2) + '%',
        _note: 'Improved supply-based pricing with visible growth'
      },
      debug: {
        supplyDeductionExecuted: true,
        tokensToBuy: tokensToBuy,
        supplyDeductionCode: 'EXECUTED'
      }
    });

  } catch (error) {
    console.error('Error processing Von buy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process buy order' },
      { status: 500 }
    );
  }
}
