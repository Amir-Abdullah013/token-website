import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * PRODUCTION-READY Automatic Order Matching System
 * This endpoint runs automatically via Vercel CRON to execute limit orders
 * Runs every minute in production
 */

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Production logging
    console.log(`[${new Date().toISOString()}] 🤖 PRODUCTION Auto Order Matching Started`);
    
    // Get current token price
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    
    console.log(`[${new Date().toISOString()}] 📊 Current Price: $${currentPrice.toFixed(6)}`);
    
    // Get pending limit orders
    const pendingOrders = await databaseHelpers.order.getPendingLimitOrders();
    console.log(`[${new Date().toISOString()}] 📋 Found ${pendingOrders.length} pending orders`);
    
    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders to process',
        executedCount: 0,
        currentPrice: currentPrice,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
    
    let executedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process orders in batches to avoid timeout
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < pendingOrders.length; i += batchSize) {
      batches.push(pendingOrders.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      for (const order of batch) {
        const limitPrice = parseFloat(order.limitPrice);
        const amount = parseFloat(order.amount);
        const userId = order.userId;
        const orderType = order.orderType;
        
        console.log(`[${new Date().toISOString()}] 🔍 Checking order ${order.id}: ${orderType} ${amount} at $${limitPrice.toFixed(6)} (Current: $${currentPrice.toFixed(6)})`);
        
        let shouldExecute = false;
        
        // Check execution conditions
        if (orderType === 'BUY' && currentPrice <= limitPrice) {
          shouldExecute = true;
          console.log(`[${new Date().toISOString()}] ✅ BUY ready: $${currentPrice.toFixed(6)} <= $${limitPrice.toFixed(6)}`);
        } else if (orderType === 'SELL' && currentPrice >= limitPrice) {
          shouldExecute = true;
          console.log(`[${new Date().toISOString()}] ✅ SELL ready: $${currentPrice.toFixed(6)} >= $${limitPrice.toFixed(6)}`);
        } else {
          console.log(`[${new Date().toISOString()}] ⏸️ Order waiting: ${orderType} - Current: $${currentPrice.toFixed(6)}, Limit: $${limitPrice.toFixed(6)}`);
          skippedCount++;
          continue;
        }
        
        if (shouldExecute) {
          try {
            // Get user's wallet with timeout
            const wallet = await Promise.race([
              databaseHelpers.wallet.getWalletByUserId(userId),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            if (!wallet) {
              console.log(`[${new Date().toISOString()}] ❌ Wallet not found: ${userId}`);
              await databaseHelpers.order.cancelOrder(order.id);
              errorCount++;
              continue;
            }
            
            console.log(`[${new Date().toISOString()}] 💰 Wallet found: USD=${wallet.usdBalance}, Von=${wallet.VonBalance}`);
            
            // Execute order based on type
            if (orderType === 'BUY') {
              const tokensToReceive = amount / currentPrice;
              console.log(`[${new Date().toISOString()}] 💱 BUY calculation: ${amount} USD / ${currentPrice} = ${tokensToReceive.toFixed(6)} Von`);
              
              if (parseFloat(wallet.usdBalance) < amount) {
                console.log(`[${new Date().toISOString()}] ❌ Insufficient USD: ${userId} has $${wallet.usdBalance}, needs $${amount}`);
                await databaseHelpers.order.cancelOrder(order.id);
                errorCount++;
                continue;
              }
              
              // Atomic balance update
              await databaseHelpers.wallet.updateUsdBalance(userId, -amount);
              await databaseHelpers.wallet.updateVonBalance(userId, tokensToReceive);
              
              // Create transaction record
              await databaseHelpers.transaction.createTransaction({
                userId: userId,
                type: 'BUY',
                amount: amount,
                currency: 'USD',
                status: 'COMPLETED',
                gateway: 'AutoLimitOrder',
                description: `Auto-executed limit buy: ${tokensToReceive.toFixed(2)} Von at $${currentPrice.toFixed(6)}`
              });
              
              console.log(`[${new Date().toISOString()}] ✅ BUY executed: ${tokensToReceive.toFixed(2)} Von for ${userId}`);
              
            } else {
              const usdToReceive = amount * currentPrice;
              console.log(`[${new Date().toISOString()}] 💱 SELL calculation: ${amount} Von * ${currentPrice} = $${usdToReceive.toFixed(6)}`);
              
              if (parseFloat(wallet.VonBalance) < amount) {
                console.log(`[${new Date().toISOString()}] ❌ Insufficient Von: ${userId} has ${wallet.VonBalance} Von, needs ${amount} Von`);
                await databaseHelpers.order.cancelOrder(order.id);
                errorCount++;
                continue;
              }
              
              // Atomic balance update
              await databaseHelpers.wallet.updateVonBalance(userId, -amount);
              await databaseHelpers.wallet.updateUsdBalance(userId, usdToReceive);
              
              // Create transaction record
              await databaseHelpers.transaction.createTransaction({
                userId: userId,
                type: 'SELL',
                amount: usdToReceive,
                currency: 'USD',
                status: 'COMPLETED',
                gateway: 'AutoLimitOrder',
                description: `Auto-executed limit sell: ${amount.toFixed(2)} Von at $${currentPrice.toFixed(6)}`
              });
              
              console.log(`[${new Date().toISOString()}] ✅ SELL executed: $${usdToReceive.toFixed(2)} for ${userId}`);
            }
            
            // Mark order as filled
            await databaseHelpers.order.updateOrderStatus(order.id, 'FILLED', new Date());
            executedCount++;
            
          } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Order execution error:`, error.message);
            errorCount++;
          }
        }
      }
      
      // Small delay between batches to prevent overwhelming the database
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] ✅ PRODUCTION Auto Order Matching Complete:`);
    console.log(`[${new Date().toISOString()}] 📈 Executed: ${executedCount} orders`);
    console.log(`[${new Date().toISOString()}] ⏸️ Waiting: ${skippedCount} orders`);
    console.log(`[${new Date().toISOString()}] ❌ Errors: ${errorCount} orders`);
    console.log(`[${new Date().toISOString()}] ⏱️ Execution time: ${executionTime}ms`);
    
    return NextResponse.json({
      success: true,
      message: `Production auto order matching completed. ${executedCount} executed, ${skippedCount} waiting, ${errorCount} errors.`,
      executedCount,
      skippedCount,
      errorCount,
      currentPrice: currentPrice,
      executionTime: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ❌ PRODUCTION Auto Order Matching Error:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Production auto order matching failed', 
        details: error.message,
        executionTime: executionTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow POST requests for manual testing
export async function POST(request) {
  return GET(request);
}