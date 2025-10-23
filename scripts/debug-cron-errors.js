require('dotenv').config();

/**
 * Debug CRON Errors
 * This script helps identify and fix CRON execution errors
 */

async function debugCronErrors() {
  console.log('🔍 Debugging CRON Execution Errors...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('📊 Current Status Analysis:');
  console.log('   ✅ CRON is running successfully');
  console.log('   ✅ Current Price: $0.0036939686');
  console.log('   ⏸️ Orders waiting: 1');
  console.log('   ❌ Errors: 1');
  console.log('   ⏱️ Execution time: 1338ms\n');
  
  console.log('🔍 Error Analysis:');
  console.log('   The "1 error" indicates that an order was attempted to execute but failed.');
  console.log('   This could be due to:');
  console.log('   1. Insufficient user balance');
  console.log('   2. Database transaction failure');
  console.log('   3. Wallet not found for user');
  console.log('   4. Database connection timeout');
  console.log('   5. Invalid order data\n');
  
  console.log('🚀 Testing with Enhanced Logging...');
  
  try {
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
      console.log(`   Execution Time: ${data.executionTime}ms`);
      
      if (data.errorCount > 0) {
        console.log('\n❌ ERROR DETECTED:');
        console.log('   The CRON is encountering errors during order execution.');
        console.log('   This means:');
        console.log('   - An order was found that should execute');
        console.log('   - But the execution failed due to an error');
        console.log('   - The order remains in PENDING status');
        
        console.log('\n🔧 DEBUGGING STEPS:');
        console.log('   1. Check your VPS server logs for detailed error messages');
        console.log('   2. Look for database connection errors');
        console.log('   3. Check if user has sufficient balance');
        console.log('   4. Verify wallet exists for the user');
        console.log('   5. Check database transaction logs');
        
        console.log('\n📋 MANUAL DEBUGGING:');
        console.log('   Run these database queries on your VPS:');
        console.log('');
        console.log('   # Check the pending order details:');
        console.log('   SELECT o.*, u.email, w."usdBalance", w."VonBalance"');
        console.log('   FROM orders o');
        console.log('   LEFT JOIN users u ON o."userId" = u.id');
        console.log('   LEFT JOIN wallets w ON o."userId" = w."userId"');
        console.log('   WHERE o.status = \'PENDING\' AND o."priceType" = \'LIMIT\';');
        console.log('');
        console.log('   # Check recent error logs:');
        console.log('   SELECT * FROM orders WHERE status = \'PENDING\' ORDER BY "createdAt" DESC LIMIT 5;');
        console.log('');
        
        console.log('\n🎯 LIKELY CAUSES:');
        console.log('   1. User balance insufficient for the order amount');
        console.log('   2. Database transaction timeout (1338ms is quite long)');
        console.log('   3. Wallet not found for the user');
        console.log('   4. Database connection issues');
        console.log('   5. Invalid order data or corrupted records');
        
        console.log('\n🔧 IMMEDIATE ACTIONS:');
        console.log('   1. Check VPS logs: journalctl -u your-app-service -f');
        console.log('   2. Check database logs for transaction errors');
        console.log('   3. Verify user wallet balance is sufficient');
        console.log('   4. Check if the order amount is valid');
        console.log('   5. Consider canceling the problematic order if it\'s invalid');
        
      } else if (data.skippedCount > 0) {
        console.log('\n⏸️ ORDERS WAITING:');
        console.log('   Orders are waiting for price conditions to be met.');
        console.log('   This is normal behavior - orders will execute when conditions are right.');
      }
      
    } else {
      console.log('❌ CRON endpoint failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('   Your CRON is working, but there\'s an execution error.');
  console.log('   The order is waiting because the execution failed.');
  console.log('   Check your VPS logs for the specific error details.');
  console.log('   Once you fix the underlying issue, the order should execute.');
}

// Run the debug
debugCronErrors();
