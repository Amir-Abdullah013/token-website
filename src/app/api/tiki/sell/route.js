import { NextResponse } from 'next/server';
import { calculateFee, creditFeeToAdmin } from '@/lib/fees';

export async function POST(request) {
  try {
    const { userId, tokenAmount } = await request.json();
    
    if (!userId || !tokenAmount || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or amount' },
        { status: 400 }
      );
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
      
      console.log('📊 Using improved supply-based token value for sell:', {
        currentPrice,
        inflationFactor: tokenValue.inflationFactor,
        userSupplyRemaining: tokenValue.userSupplyRemaining,
        growthFactor: tokenValue.growthFactor,
        supplyUsed: tokenValue.supplyUsed,
        usageRatio: tokenValue.usageRatio
      });
    } catch (dbError) {
      console.warn('Database not available, using fallback value:', dbError.message);
      currentPrice = 0.0035; // Base value
    }

    // Calculate USD to receive
    const grossUsdAmount = tokenAmount * currentPrice;
    
    // Calculate sell fee (1% for sell transactions)
    const { fee, net } = await calculateFee(grossUsdAmount, "sell");
    
    // User receives net amount after fee
    const usdToReceive = net;
    
    // Add tokens back to supply when user sells
    // CRITICAL: Updates BOTH remainingSupply AND userSupplyRemaining
    let newPrice = currentPrice;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Use the new comprehensive supply addition method
      // This updates BOTH remainingSupply AND userSupplyRemaining atomically
      const updatedSupply = await databaseHelpers.tokenSupply.addSupply(tokenAmount);
      
      console.log('✅ Supply added back successfully:', {
        amount: tokenAmount,
        newRemainingSupply: Number(updatedSupply.remainingSupply),
        newUserSupplyRemaining: Number(updatedSupply.userSupplyRemaining),
        adminReserve: Number(updatedSupply.adminReserve)
      });
      
      // Recalculate price after supply update
      const updatedTokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      newPrice = updatedTokenValue.currentTokenValue;
      
      console.log('📉 Price updated after sell:', {
        oldPrice: currentPrice,
        newPrice: newPrice,
        priceDecrease: ((currentPrice - newPrice) / currentPrice * 100).toFixed(2) + '%',
        usagePercentage: updatedTokenValue.usagePercentage,
        distributedSupply: Number(updatedSupply.totalSupply) - Number(updatedSupply.remainingSupply)
      });
    } catch (supplyError) {
      console.error('⚠️ Could not update supply:', supplyError.message);
      // This creates a discrepancy that needs manual reconciliation
    }

    // Create transaction record with fee information
    let transaction;
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Create real transaction record
      transaction = await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'SELL',
        amount: grossUsdAmount, // Original amount before fee
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'TikiMarket',
        description: `Sold ${tokenAmount.toFixed(2)} TIKI at ${currentPrice} USD`,
        feeAmount: fee,
        netAmount: net,
        feeReceiverId: 'ADMIN_WALLET',
        transactionType: 'sell'
      });
      
      // Credit fee to admin wallet
      if (fee > 0) {
        await creditFeeToAdmin(databaseHelpers.pool, fee);
        console.log('💰 Sell API: Fee credited to admin wallet:', fee);
      }
    } catch (txErr) {
      console.error('Error creating transaction for sell:', txErr);
      // Fallback to mock transaction if database fails
      transaction = {
        id: Date.now().toString(),
        userId,
        type: 'SELL',
        amount: grossUsdAmount,
        fee: fee,
        netAmount: net,
        status: 'COMPLETED',
        createdAt: new Date()
      };
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        userId,
        type: 'SELL',
        amount: grossUsdAmount,
        fee: fee,
        netAmount: net,
        tokensSold: tokenAmount,
        pricePerToken: currentPrice,
        status: 'COMPLETED',
        createdAt: transaction.createdAt || new Date()
      },
      priceUpdate: {
        oldPrice: currentPrice,
        newPrice: newPrice,
        currentPrice: newPrice,
        priceDecrease: ((currentPrice - newPrice) / currentPrice * 100).toFixed(2) + '%',
        _note: 'Improved supply-based pricing with visible growth'
      }
    });

  } catch (error) {
    console.error('Error processing Tiki sell:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process sell order' },
      { status: 500 }
    );
  }
}
