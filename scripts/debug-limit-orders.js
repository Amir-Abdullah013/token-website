require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Debug Limit Orders System
 * This script helps identify why limit orders are not executing
 */

async function debugLimitOrders() {
  console.log('🔍 Debugging Limit Orders System...\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Check current token price
    console.log('1️⃣ Checking current token price...');
    const priceResult = await client.query(`
      SELECT "currentTokenValue" FROM token_stats 
      ORDER BY "updatedAt" DESC 
      LIMIT 1
    `);
    
    const currentPrice = priceResult.rows[0]?.currentTokenValue || 0;
    console.log(`   Current Price: $${currentPrice.toFixed(6)}\n`);
    
    // 2. Check pending limit orders
    console.log('2️⃣ Checking pending limit orders...');
    const ordersResult = await client.query(`
      SELECT o.*, u.email, w."usdBalance", w."VonBalance"
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      LEFT JOIN wallets w ON o."userId" = w."userId"
      WHERE o.status = 'PENDING' 
      AND o."priceType" = 'LIMIT'
      ORDER BY o."createdAt" ASC
    `);
    
    const pendingOrders = ordersResult.rows;
    console.log(`   Found ${pendingOrders.length} pending orders\n`);
    
    if (pendingOrders.length === 0) {
      console.log('✅ No pending orders found');
      return;
    }
    
    // 3. Analyze each order
    for (const order of pendingOrders) {
      console.log(`📋 Order ${order.id}:`);
      console.log(`   User: ${order.email || order.userId}`);
      console.log(`   Type: ${order.orderType}`);
      console.log(`   Amount: ${order.amount}`);
      console.log(`   Limit Price: $${order.limitPrice}`);
      console.log(`   Current Price: $${currentPrice.toFixed(6)}`);
      console.log(`   USD Balance: $${order.usdBalance || 0}`);
      console.log(`   Von Balance: ${order.VonBalance || 0}`);
      
      // Check execution conditions
      let shouldExecute = false;
      let reason = '';
      
      if (order.orderType === 'BUY') {
        if (currentPrice <= order.limitPrice) {
          shouldExecute = true;
          reason = `Current price ($${currentPrice.toFixed(6)}) <= Limit price ($${order.limitPrice})`;
        } else {
          reason = `Current price ($${currentPrice.toFixed(6)}) > Limit price ($${order.limitPrice})`;
        }
        
        // Check balance
        if (shouldExecute && parseFloat(order.usdBalance) < parseFloat(order.amount)) {
          shouldExecute = false;
          reason = `Insufficient USD balance: $${order.usdBalance} < $${order.amount}`;
        }
      } else if (order.orderType === 'SELL') {
        if (currentPrice >= order.limitPrice) {
          shouldExecute = true;
          reason = `Current price ($${currentPrice.toFixed(6)}) >= Limit price ($${order.limitPrice})`;
        } else {
          reason = `Current price ($${currentPrice.toFixed(6)}) < Limit price ($${order.limitPrice})`;
        }
        
        // Check balance
        if (shouldExecute && parseFloat(order.VonBalance) < parseFloat(order.amount)) {
          shouldExecute = false;
          reason = `Insufficient Von balance: ${order.VonBalance} < ${order.amount}`;
        }
      }
      
      console.log(`   Should Execute: ${shouldExecute ? '✅ YES' : '❌ NO'}`);
      console.log(`   Reason: ${reason}`);
      console.log('');
    }
    
    // 4. Test the auto-match endpoint
    console.log('3️⃣ Testing auto-match endpoint...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`);
      const data = await response.json();
      
      console.log(`   Response: ${data.success ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Executed: ${data.executedCount || 0}`);
      console.log(`   Waiting: ${data.skippedCount || 0}`);
      console.log(`   Errors: ${data.errorCount || 0}`);
      
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Endpoint test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    client.release();
  }
}

// Run the debug
debugLimitOrders();
