require('dotenv').config();

/**
 * Test Limit Orders System
 * This script helps debug limit order execution issues
 */

async function testLimitOrders() {
  console.log('🧪 Testing Limit Orders System...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Test 1: Check if auto-match endpoint is accessible
    console.log('1️⃣ Testing auto-match endpoint...');
    const autoMatchResponse = await fetch(`${baseUrl}/api/cron/auto-match-orders`);
    
    if (autoMatchResponse.ok) {
      const autoMatchData = await autoMatchResponse.json();
      console.log('✅ Auto-match endpoint accessible');
      console.log(`   Current Price: $${autoMatchData.currentPrice?.toFixed(6) || 'N/A'}`);
      console.log(`   Executed: ${autoMatchData.executedCount || 0} orders`);
      console.log(`   Waiting: ${autoMatchData.skippedCount || 0} orders`);
    } else {
      console.log('❌ Auto-match endpoint failed:', autoMatchResponse.status);
    }
    
    console.log('\n2️⃣ Testing manual match endpoint...');
    const matchResponse = await fetch(`${baseUrl}/api/cron/match-orders`);
    
    if (matchResponse.ok) {
      const matchData = await matchResponse.json();
      console.log('✅ Manual match endpoint accessible');
      console.log(`   Executed: ${matchData.executedCount || 0} orders`);
    } else {
      console.log('❌ Manual match endpoint failed:', matchResponse.status);
      const errorText = await matchResponse.text();
      console.log('   Error:', errorText);
    }
    
    console.log('\n3️⃣ Testing order creation...');
    // This would require authentication, so we'll just show the endpoint
    console.log('   Order creation endpoint: POST /api/orders/create');
    console.log('   (Requires authentication)');
    
    console.log('\n📋 Debugging Steps:');
    console.log('1. Check if CRON is running: Look for logs in Vercel dashboard');
    console.log('2. Check database: Verify orders are being created with correct data');
    console.log('3. Check price updates: Ensure token price is being updated');
    console.log('4. Check wallet balances: Ensure users have sufficient funds');
    console.log('5. Check order status: Verify orders are PENDING and not already FILLED');
    
    console.log('\n🔧 Manual Testing Commands:');
    console.log(`curl -X GET "${baseUrl}/api/cron/auto-match-orders"`);
    console.log(`curl -X GET "${baseUrl}/api/cron/match-orders"`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLimitOrders();
