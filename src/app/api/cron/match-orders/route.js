import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    // Check if user is admin (optional security)
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔄 Running order matching via API...');
    
    // Get current token price
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    
    console.log(`📊 Current Token Price: $${currentPrice.toFixed(6)}`);
    
    // Get pending limit orders
    const pendingOrders = await databaseHelpers.order.getPendingLimitOrders();
    console.log(`📋 Found ${pendingOrders.length} pending limit orders`);
    
    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders to process',
        executedCount: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    let executedCount = 0;
    
    for (const order of pendingOrders) {
      const limitPrice = parseFloat(order.limitPrice);
      const amount = parseFloat(order.amount);
      const userId = order.userId;
      const orderType = order.orderType;
      
      let shouldExecute = false;
      
      // Check if order should be executed
      if (orderType === 'BUY' && currentPrice <= limitPrice) {
        shouldExecute = true;
      } else if (orderType === 'SELL' && currentPrice >= limitPrice) {
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        console.log(`🎯 Executing ${orderType} order for user ${userId}`);
        
        try {
          // Get user's wallet
          const wallet = await databaseHelpers.wallet.getWalletByUserId(userId);
          if (!wallet) {
            console.log(`   ❌ Wallet not found for user ${userId}`);
            continue;
          }
          
          if (orderType === 'BUY') {
            const tokensToReceive = amount / currentPrice;
            
            if (parseFloat(wallet.balance) < amount) {
              console.log(`   ❌ Insufficient USD balance`);
              await databaseHelpers.order.cancelOrder(order.id);
              continue;
            }
            
            // Update balances
            await databaseHelpers.wallet.updateUsdBalance(userId, -amount);
            await databaseHelpers.wallet.updateTikiBalance(userId, tokensToReceive);
            
            // Create transaction
            await databaseHelpers.transaction.createTransaction({
              userId: userId,
              type: 'BUY',
              amount: amount,
              currency: 'USD',
              status: 'COMPLETED',
              gateway: 'LimitOrder',
              description: `Limit buy order executed: ${tokensToReceive.toFixed(2)} TIKI at $${currentPrice.toFixed(6)}`
            });
            
            console.log(`   ✅ Buy executed: Received ${tokensToReceive.toFixed(2)} TIKI`);
            
          } else {
            const usdToReceive = amount * currentPrice;
            
            if (parseFloat(wallet.tikiBalance) < amount) {
              console.log(`   ❌ Insufficient TIKI balance`);
              await databaseHelpers.order.cancelOrder(order.id);
              continue;
            }
            
            // Update balances
            await databaseHelpers.wallet.updateTikiBalance(userId, -amount);
            await databaseHelpers.wallet.updateUsdBalance(userId, usdToReceive);
            
            // Create transaction
            await databaseHelpers.transaction.createTransaction({
              userId: userId,
              type: 'SELL',
              amount: usdToReceive,
              currency: 'USD',
              status: 'COMPLETED',
              gateway: 'LimitOrder',
              description: `Limit sell order executed: ${amount.toFixed(2)} TIKI at $${currentPrice.toFixed(6)}`
            });
            
            console.log(`   ✅ Sell executed: Received $${usdToReceive.toFixed(2)}`);
          }
          
          // Update order status
          await databaseHelpers.order.updateOrderStatus(order.id, 'FILLED', new Date());
          executedCount++;
          
        } catch (error) {
          console.log(`   ❌ Error executing order:`, error.message);
        }
      }
    }
    
    console.log(`✅ Order matching complete: ${executedCount} orders executed`);
    
    return NextResponse.json({
      success: true,
      message: `Order matching completed successfully. ${executedCount} orders executed.`,
      executedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in order matching API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run order matching', details: error.message },
      { status: 500 }
    );
  }
}

// Allow POST requests too
export async function POST(request) {
  return GET(request);
}
