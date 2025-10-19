require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Order Matching System for Limit Orders
 * This script checks for pending limit orders and executes them if the price matches
 */

async function matchLimitOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for limit orders to execute...\n');
    
    // Get current token price using the database helper
    const { databaseHelpers } = require('../src/lib/database.js');
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    console.log(`📊 Current Token Price: $${currentPrice.toFixed(6)}\n`);
    
    // Get pending limit orders
    const ordersResult = await client.query(`
      SELECT * FROM orders
      WHERE status = 'PENDING'
      AND "priceType" = 'LIMIT'
      ORDER BY "createdAt" ASC
    `);
    
    const pendingOrders = ordersResult.rows;
    console.log(`📋 Found ${pendingOrders.length} pending limit orders\n`);
    
    if (pendingOrders.length === 0) {
      console.log('✅ No pending limit orders to process');
      return;
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
        // Buy order: execute if current price is at or below limit price
        shouldExecute = true;
      } else if (orderType === 'SELL' && currentPrice >= limitPrice) {
        // Sell order: execute if current price is at or above limit price
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        console.log(`\n🎯 Executing ${orderType} order for user ${userId}`);
        console.log(`   Amount: ${amount.toFixed(2)}`);
        console.log(`   Limit Price: $${limitPrice.toFixed(6)}`);
        console.log(`   Current Price: $${currentPrice.toFixed(6)}`);
        
        try {
          await client.query('BEGIN');
          
          // Get user's wallet
          const walletResult = await client.query(`
            SELECT * FROM wallets WHERE "userId" = $1
          `, [userId]);
          
          if (walletResult.rows.length === 0) {
            console.log(`   ❌ Wallet not found for user ${userId}`);
            await client.query('ROLLBACK');
            continue;
          }
          
          const wallet = walletResult.rows[0];
          
          if (orderType === 'BUY') {
            // Execute buy order
            const tokensToReceive = amount / currentPrice;
            
            // Check if user still has sufficient USD balance (note: balance field in DB)
            if (parseFloat(wallet.balance) < amount) {
              console.log(`   ❌ Insufficient USD balance`);
              // Cancel the order
              await client.query(`
                UPDATE orders
                SET status = 'CANCELED', "canceledAt" = NOW(), "updatedAt" = NOW()
                WHERE id = $1
              `, [order.id]);
              await client.query('COMMIT');
              continue;
            }
            
            // Update user's balances
            await client.query(`
              UPDATE wallets
              SET balance = balance - $1,
                  "tikiBalance" = "tikiBalance" + $2,
                  "updatedAt" = NOW()
              WHERE "userId" = $3
            `, [amount, tokensToReceive, userId]);
            
            // Create transaction record
            await client.query(`
              INSERT INTO transactions (id, "userId", type, amount, currency, status, gateway, description, "createdAt", "updatedAt")
              VALUES ($1, $2, 'BUY', $3, 'USD', 'COMPLETED', 'LimitOrder', $4, NOW(), NOW())
            `, [
              require('crypto').randomUUID(),
              userId,
              amount,
              `Limit buy order executed: ${tokensToReceive.toFixed(2)} TIKI at $${currentPrice.toFixed(6)}`
            ]);
            
            console.log(`   ✅ Buy executed: Received ${tokensToReceive.toFixed(2)} TIKI`);
            
          } else {
            // Execute sell order
            const usdToReceive = amount * currentPrice;
            
            // Check if user still has sufficient TIKI balance
            if (parseFloat(wallet.tikiBalance) < amount) {
              console.log(`   ❌ Insufficient TIKI balance`);
              // Cancel the order
              await client.query(`
                UPDATE orders
                SET status = 'CANCELED', "canceledAt" = NOW(), "updatedAt" = NOW()
                WHERE id = $1
              `, [order.id]);
              await client.query('COMMIT');
              continue;
            }
            
            // Update user's balances
            await client.query(`
              UPDATE wallets
              SET "tikiBalance" = "tikiBalance" - $1,
                  balance = balance + $2,
                  "updatedAt" = NOW()
              WHERE "userId" = $3
            `, [amount, usdToReceive, userId]);
            
            // Create transaction record
            await client.query(`
              INSERT INTO transactions (id, "userId", type, amount, currency, status, gateway, description, "createdAt", "updatedAt")
              VALUES ($1, $2, 'SELL', $3, 'USD', 'COMPLETED', 'LimitOrder', $4, NOW(), NOW())
            `, [
              require('crypto').randomUUID(),
              userId,
              usdToReceive,
              `Limit sell order executed: ${amount.toFixed(2)} TIKI at $${currentPrice.toFixed(6)}`
            ]);
            
            console.log(`   ✅ Sell executed: Received $${usdToReceive.toFixed(2)}`);
          }
          
          // Update order status
          await client.query(`
            UPDATE orders
            SET status = 'FILLED',
                "executedAt" = NOW(),
                "updatedAt" = NOW()
            WHERE id = $1
          `, [order.id]);
          
          await client.query('COMMIT');
          executedCount++;
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.log(`   ❌ Error executing order:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Order matching complete: ${executedCount} orders executed`);
    
  } catch (error) {
    console.error('❌ Error in order matching:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  matchLimitOrders().catch(console.error);
}

module.exports = { matchLimitOrders };

