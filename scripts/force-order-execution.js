require('dotenv').config();

/**
 * Force Order Execution
 * This script manually triggers order matching and provides detailed debugging
 */

async function forceOrderExecution() {
  console.log('🚀 Force Order Execution - Debug Mode...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('1️⃣ Triggering auto-match orders with detailed logging...');
    
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auto-match response received:');
      console.log(`   Success: ${data.success}`);
      console.log(`   Message: ${data.message}`);
      console.log(`   Executed: ${data.executedCount || 0} orders`);
      console.log(`   Waiting: ${data.skippedCount || 0} orders`);
      console.log(`   Errors: ${data.errorCount || 0} orders`);
      console.log(`   Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
      console.log(`   Execution Time: ${data.executionTime || 0}ms`);
      
      if (data.skippedCount > 0) {
        console.log('\n⚠️ Orders are waiting but not executing. Possible reasons:');
        console.log('   1. Insufficient user balance');
        console.log('   2. Price conditions not met');
        console.log('   3. Database connection issues');
        console.log('   4. Wallet not found for user');
        console.log('   5. Order already processed but status not updated');
        
        console.log('\n🔧 Next steps:');
        console.log('   1. Run: node scripts/debug-limit-orders.js');
        console.log('   2. Check your database for pending orders');
        console.log('   3. Verify user wallet balances');
        console.log('   4. Check server logs for detailed error messages');
      }
      
      if (data.executedCount > 0) {
        console.log('\n🎉 Orders were executed successfully!');
        console.log('   Check your database for updated order statuses');
        console.log('   Check user wallets for updated balances');
      }
      
    } else {
      console.log('❌ Auto-match failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
    console.log('\n2️⃣ Testing manual match endpoint...');
    const manualResponse = await fetch(`${baseUrl}/api/cron/match-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (manualResponse.ok) {
      const manualData = await manualResponse.json();
      console.log('✅ Manual match response:');
      console.log(`   Executed: ${manualData.executedCount || 0} orders`);
      console.log(`   Message: ${manualData.message}`);
    } else {
      console.log('❌ Manual match failed:', manualResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Force execution failed:', error.message);
  }
}

// Run the force execution
forceOrderExecution();
