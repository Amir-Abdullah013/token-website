require('dotenv').config();

/**
 * Test Order Execution
 * This script tests the order execution with detailed logging
 */

async function testOrderExecution() {
  console.log('🧪 Testing Order Execution...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('📊 Current Status:');
    console.log('   - Auto-match CRON: ✅ Working');
    console.log('   - Current Price: $0.003646');
    console.log('   - Pending Orders: 1 waiting');
    console.log('   - Issue: Order not executing despite conditions being met\n');
    
    console.log('🔍 Possible Issues:');
    console.log('   1. User has insufficient balance');
    console.log('   2. Price condition not met (current vs limit price)');
    console.log('   3. Database transaction failing');
    console.log('   4. Wallet not found for user');
    console.log('   5. Order already processed but status not updated\n');
    
    console.log('🚀 Testing manual execution...');
    
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received:');
      console.log(`   Executed: ${data.executedCount}`);
      console.log(`   Waiting: ${data.skippedCount}`);
      console.log(`   Errors: ${data.errorCount}`);
      console.log(`   Current Price: $${data.currentPrice?.toFixed(6)}`);
      
      if (data.skippedCount > 0) {
        console.log('\n⚠️ DIAGNOSIS: Order is waiting but not executing');
        console.log('\n🔧 SOLUTIONS:');
        console.log('   1. Check your VPS server logs for detailed error messages');
        console.log('   2. Verify the user has sufficient balance in their wallet');
        console.log('   3. Check if the limit price condition is actually met');
        console.log('   4. Ensure the database connection is stable');
        console.log('   5. Check if the order status is already FILLED in the database');
        
        console.log('\n📋 MANUAL DEBUGGING STEPS:');
        console.log('   1. Log into your database and check the orders table:');
        console.log('      SELECT * FROM orders WHERE status = \'PENDING\' AND "priceType" = \'LIMIT\';');
        console.log('   2. Check the user\'s wallet balance:');
        console.log('      SELECT * FROM wallets WHERE "userId" = \'[USER_ID]\';');
        console.log('   3. Check the current token price:');
        console.log('      SELECT "currentTokenValue" FROM token_stats ORDER BY "updatedAt" DESC LIMIT 1;');
        console.log('   4. Check server logs for detailed error messages');
      }
      
      if (data.executedCount > 0) {
        console.log('\n🎉 SUCCESS: Orders were executed!');
        console.log('   Check your database for updated order statuses');
        console.log('   Check user wallets for updated balances');
      }
      
    } else {
      console.log('❌ Test failed:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrderExecution();
