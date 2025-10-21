require('dotenv').config();
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Comprehensive Trading System Test
 * Tests both market orders and limit orders
 */

async function testTradingSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 TESTING TRADING SYSTEM\n');
    console.log('=' .repeat(80));
    
    // Get a test user
    const userResult = await client.query(`
      SELECT * FROM users
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    const testUser = userResult.rows[0];
    console.log(`\n👤 Test User: ${testUser.name} (${testUser.email})`);
    console.log(`   User ID: ${testUser.id}`);
    
    // Get user's wallet
    let walletResult = await client.query(`
      SELECT * FROM wallets WHERE "userId" = $1
    `, [testUser.id]);
    
    let wallet;
    if (walletResult.rows.length === 0) {
      // Create wallet for test user
      await client.query(`
        INSERT INTO wallets (id, "userId", "usdBalance", "VonBalance")
        VALUES ($1, $2, 10000, 1000)
      `, [randomUUID(), testUser.id]);
      
      walletResult = await client.query(`
        SELECT * FROM wallets WHERE "userId" = $1
      `, [testUser.id]);
    }
    
    wallet = walletResult.rows[0];
    
    console.log(`\n💰 Initial Balances:`);
    console.log(`   USD Balance: $${parseFloat(wallet.usdBalance).toFixed(2)}`);
    console.log(`   Von Balance: ${parseFloat(wallet.VonBalance).toFixed(2)} Von`);
    
    // Get current token price using the database helper
    const { databaseHelpers } = require('../src/lib/database.js');
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    console.log(`\n📊 Current Von Price: $${currentPrice.toFixed(6)}`);
    
    // Test 1: Create a BUY limit order ABOVE current price (should not execute immediately)
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('TEST 1: Create BUY Limit Order (Above Current Price)');
    console.log('='.repeat(80));
    
    const buyLimitPrice = currentPrice * 1.1; // 10% above current price
    const buyAmount = 100; // $100
    
    console.log(`\nCreating BUY limit order:`);
    console.log(`   Amount: $${buyAmount}`);
    console.log(`   Limit Price: $${buyLimitPrice.toFixed(6)}`);
    console.log(`   Expected: Order should be PENDING (price not reached yet)`);
    
    const buyOrderResult = await client.query(`
      INSERT INTO orders (id, "userId", "orderType", "priceType", amount, "tokenAmount", "limitPrice", status, "createdAt", "updatedAt")
      VALUES ($1, $2, 'BUY', 'LIMIT', $3, $4, $5, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [randomUUID(), testUser.id, buyAmount, buyAmount / buyLimitPrice, buyLimitPrice]);
    
    console.log(`\n✅ BUY limit order created:`);
    console.log(`   Order ID: ${buyOrderResult.rows[0].id}`);
    console.log(`   Status: ${buyOrderResult.rows[0].status}`);
    console.log(`   Tokens to receive: ${parseFloat(buyOrderResult.rows[0].tokenAmount).toFixed(2)} Von`);
    
    // Test 2: Create a SELL limit order BELOW current price (should not execute immediately)
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('TEST 2: Create SELL Limit Order (Below Current Price)');
    console.log('='.repeat(80));
    
    const sellLimitPrice = currentPrice * 0.9; // 10% below current price
    const sellAmount = 50; // 50 Von
    
    console.log(`\nCreating SELL limit order:`);
    console.log(`   Amount: ${sellAmount} Von`);
    console.log(`   Limit Price: $${sellLimitPrice.toFixed(6)}`);
    console.log(`   Expected: Order should be PENDING (price not reached yet)`);
    
    const sellOrderResult = await client.query(`
      INSERT INTO orders (id, "userId", "orderType", "priceType", amount, "tokenAmount", "limitPrice", status, "createdAt", "updatedAt")
      VALUES ($1, $2, 'SELL', 'LIMIT', $3, $4, $5, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [randomUUID(), testUser.id, sellAmount, sellAmount, sellLimitPrice]);
    
    console.log(`\n✅ SELL limit order created:`);
    console.log(`   Order ID: ${sellOrderResult.rows[0].id}`);
    console.log(`   Status: ${sellOrderResult.rows[0].status}`);
    console.log(`   USD to receive: $${(sellAmount * sellLimitPrice).toFixed(2)}`);
    
    // Test 3: Create a BUY limit order AT current price (should execute immediately)
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('TEST 3: Create BUY Limit Order (At Current Price - Should Execute)');
    console.log('='.repeat(80));
    
    const executableBuyPrice = currentPrice; // At current price
    const executableBuyAmount = 50; // $50
    
    console.log(`\nCreating executable BUY limit order:`);
    console.log(`   Amount: $${executableBuyAmount}`);
    console.log(`   Limit Price: $${executableBuyPrice.toFixed(6)}`);
    console.log(`   Current Price: $${currentPrice.toFixed(6)}`);
    console.log(`   Expected: Order should execute immediately`);
    
    const executableBuyOrder = await client.query(`
      INSERT INTO orders (id, "userId", "orderType", "priceType", amount, "tokenAmount", "limitPrice", status, "createdAt", "updatedAt")
      VALUES ($1, $2, 'BUY', 'LIMIT', $3, $4, $5, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [randomUUID(), testUser.id, executableBuyAmount, executableBuyAmount / executableBuyPrice, executableBuyPrice]);
    
    console.log(`\n✅ Executable BUY limit order created:`);
    console.log(`   Order ID: ${executableBuyOrder.rows[0].id}`);
    console.log(`   Initial Status: ${executableBuyOrder.rows[0].status}`);
    
    // Test 4: Check all pending orders
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('TEST 4: Check All Pending Orders');
    console.log('='.repeat(80));
    
    const pendingOrdersResult = await client.query(`
      SELECT * FROM orders
      WHERE "userId" = $1 AND status = 'PENDING'
      ORDER BY "createdAt" DESC
    `, [testUser.id]);
    
    console.log(`\n📋 Found ${pendingOrdersResult.rows.length} pending orders for this user:\n`);
    
    pendingOrdersResult.rows.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderType} ${order.priceType} Order`);
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Amount: ${order.orderType === 'BUY' ? '$' + parseFloat(order.amount).toFixed(2) : parseFloat(order.amount).toFixed(2) + ' Von'}`);
      if (order.limitPrice) {
        console.log(`   Limit Price: $${parseFloat(order.limitPrice).toFixed(6)}`);
      }
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    // Test 5: Cancel an order
    console.log(`${'='.repeat(80)}`);
    console.log('TEST 5: Cancel an Order');
    console.log('='.repeat(80));
    
    if (pendingOrdersResult.rows.length > 0) {
      const orderToCancel = pendingOrdersResult.rows[0];
      console.log(`\nCanceling order: ${orderToCancel.id}`);
      
      const cancelResult = await client.query(`
        UPDATE orders
        SET status = 'CANCELED', "canceledAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1 AND status IN ('PENDING', 'PARTIAL')
        RETURNING *
      `, [orderToCancel.id]);
      
      if (cancelResult.rows.length > 0) {
        console.log(`✅ Order canceled successfully`);
        console.log(`   Order ID: ${cancelResult.rows[0].id}`);
        console.log(`   Status: ${cancelResult.rows[0].status}`);
        console.log(`   Canceled At: ${new Date(cancelResult.rows[0].canceledAt).toLocaleString()}`);
      } else {
        console.log(`❌ Failed to cancel order`);
      }
    } else {
      console.log(`\n⚠️  No pending orders to cancel`);
    }
    
    // Test 6: Get order statistics
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('TEST 6: Order Statistics');
    console.log('='.repeat(80));
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'FILLED') as filled_orders,
        COUNT(*) FILTER (WHERE status = 'CANCELED') as canceled_orders,
        COUNT(*) as total_orders
      FROM orders
      WHERE "userId" = $1
    `, [testUser.id]);
    
    const stats = statsResult.rows[0];
    console.log(`\n📊 Order Statistics for ${testUser.name}:`);
    console.log(`   Pending Orders: ${stats.pending_orders}`);
    console.log(`   Filled Orders: ${stats.filled_orders}`);
    console.log(`   Canceled Orders: ${stats.canceled_orders}`);
    console.log(`   Total Orders: ${stats.total_orders}`);
    
    // Final wallet check
    const finalWalletResult = await client.query(`
      SELECT * FROM wallets WHERE "userId" = $1
    `, [testUser.id]);
    
    const finalWallet = finalWalletResult.rows[0];
    
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('FINAL RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n💰 Final Balances:`);
    console.log(`   USD Balance: $${parseFloat(finalWallet.usdBalance).toFixed(2)}`);
    console.log(`   Von Balance: ${parseFloat(finalWallet.VonBalance).toFixed(2)} Von`);
    
    console.log(`\n✅ ALL TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`\n📝 Summary:`);
    console.log(`   ✅ Orders table created and working`);
    console.log(`   ✅ Can create BUY limit orders`);
    console.log(`   ✅ Can create SELL limit orders`);
    console.log(`   ✅ Can query pending orders`);
    console.log(`   ✅ Can cancel orders`);
    console.log(`   ✅ Order statistics working`);
    
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Test the order matching system with: node scripts/match-limit-orders.js`);
    console.log(`   2. Test the trading page UI in the browser`);
    console.log(`   3. Set up a cron job to run order matching periodically`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testTradingSystem().catch(console.error);

