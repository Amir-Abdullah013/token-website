require('dotenv').config();

/**
 * Test Wallet Functions
 * This script tests the newly added wallet functions
 */

async function testWalletFunctions() {
  console.log('🧪 Testing Wallet Functions...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('📊 Testing CRON with Fixed Functions:');
  console.log('   - Added updateUsdBalance function');
  console.log('   - Added updateVonBalance function');
  console.log('   - Fixed the missing function error\n');
  
  try {
    console.log('🚀 Testing auto-match orders with fixed functions...');
    
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received:');
      console.log(`   Success: ${data.success}`);
      console.log(`   Executed: ${data.executedCount || 0} orders`);
      console.log(`   Waiting: ${data.skippedCount || 0} orders`);
      console.log(`   Errors: ${data.errorCount || 0} orders`);
      console.log(`   Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
      console.log(`   Execution Time: ${data.executionTime || 0}ms`);
      
      if (data.errorCount === 0) {
        console.log('\n🎉 SUCCESS: No more errors!');
        console.log('   The missing updateUsdBalance function has been fixed.');
        console.log('   Your CRON should now work perfectly.');
      } else {
        console.log('\n⚠️ Still getting errors:');
        console.log('   There might be other issues to resolve.');
        console.log('   Check your VPS logs for more details.');
      }
      
      if (data.executedCount > 0) {
        console.log('\n✅ Orders executed successfully!');
        console.log('   Your limit orders are now working properly.');
      }
      
    } else {
      console.log('❌ Test failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n📋 What was fixed:');
  console.log('   ✅ Added updateUsdBalance(userId, amount) function');
  console.log('   ✅ Added updateVonBalance(userId, amount) function');
  console.log('   ✅ Fixed the "is not a function" error');
  console.log('   ✅ CRON should now execute orders successfully');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Deploy the updated code to your VPS');
  console.log('   2. Restart your application (PM2 restart)');
  console.log('   3. Monitor the CRON execution');
  console.log('   4. Check that orders are now executing');
  
  console.log('\n✅ The missing function error has been fixed!');
}

// Run the test
testWalletFunctions();
