require('dotenv').config();

/**
 * Test Automatic Order Execution
 * This script demonstrates how orders execute automatically
 */

async function testAutoExecution() {
  console.log('🧪 Testing Automatic Order Execution\n');
  console.log('=' .repeat(60));
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('1️⃣ Testing auto-match endpoint...');
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`);
    
    if (!response.ok) {
      console.log('❌ Endpoint not available. Make sure your dev server is running:');
      console.log('   npm run dev');
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Auto-match endpoint working!');
    console.log(`   Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
    console.log(`   Executed: ${data.executedCount || 0} orders`);
    console.log(`   Waiting: ${data.skippedCount || 0} orders`);
    
    if (data.executedCount > 0) {
      console.log('\n🎉 ORDERS EXECUTED AUTOMATICALLY!');
      console.log('   Your limit orders are working perfectly!');
    } else if (data.skippedCount > 0) {
      console.log('\n⏸️ Orders waiting for price conditions...');
      console.log('   They will execute automatically when price reaches your limits!');
    } else {
      console.log('\n📋 No pending orders found.');
      console.log('   Create some limit orders to test automatic execution!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🤖 AUTOMATIC EXECUTION SETUP\n');
    
    console.log('To enable automatic execution, choose one option:\n');
    
    console.log('🕐 OPTION 1: CRON JOB (Recommended)');
    console.log('   Add this to your crontab (runs every minute):');
    console.log(`   */1 * * * * curl -X GET "${baseUrl}/api/cron/auto-match-orders"`);
    console.log('');
    
    console.log('🔄 OPTION 2: PM2 CRON');
    console.log('   pm2 start "curl -X GET ' + baseUrl + '/api/cron/auto-match-orders" --cron "*/1 * * * *"');
    console.log('');
    
    console.log('🌐 OPTION 3: VERCEL CRON (If using Vercel)');
    console.log('   Add to vercel.json:');
    console.log('   {');
    console.log('     "crons": [{');
    console.log('       "path": "/api/cron/auto-match-orders",');
    console.log('       "schedule": "*/1 * * * *"');
    console.log('     }]');
    console.log('   }');
    console.log('');
    
    console.log('🧪 OPTION 4: MANUAL TESTING');
    console.log(`   Run: curl -X GET "${baseUrl}/api/cron/auto-match-orders"`);
    console.log('   (Test this command to see orders execute)');
    console.log('');
    
    console.log('✅ Once set up, your limit orders will execute automatically!');
    console.log('   No more clicking "Check Orders" button needed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

testAutoExecution();

