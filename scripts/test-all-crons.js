require('dotenv').config();

/**
 * Test All CRON Jobs
 * This script tests all CRON endpoints to ensure they're working properly
 */

async function testAllCrons() {
  console.log('🧪 Testing All CRON Jobs...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
  
  const crons = [
    {
      name: 'Auto Match Orders',
      endpoint: '/api/cron/auto-match-orders',
      method: 'GET',
      auth: false,
      description: 'Executes limit orders automatically'
    },
    {
      name: 'Match Orders (Manual)',
      endpoint: '/api/cron/match-orders',
      method: 'GET',
      auth: false,
      description: 'Manual order matching endpoint'
    },
    {
      name: 'Process Wallet Fees',
      endpoint: '/api/cron/process-wallet-fees',
      method: 'GET',
      auth: true,
      description: 'Processes due wallet fees'
    },
    {
      name: 'Process Stakings',
      endpoint: '/api/cron/process-stakings',
      method: 'GET',
      auth: false,
      description: 'Processes completed stakings'
    },
    {
      name: 'Cleanup Reset Tokens',
      endpoint: '/api/cron/cleanup-reset-tokens',
      method: 'GET',
      auth: true,
      description: 'Cleans up expired password reset tokens'
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const cron of crons) {
    console.log(`\n${cron.name}:`);
    console.log(`   Endpoint: ${cron.endpoint}`);
    console.log(`   Description: ${cron.description}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (cron.auth) {
        headers['Authorization'] = `Bearer ${cronSecret}`;
      }
      
      const response = await fetch(`${baseUrl}${cron.endpoint}`, {
        method: cron.method,
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: Success`);
        console.log(`   📊 Response: ${JSON.stringify(data, null, 2)}`);
        successCount++;
      } else {
        console.log(`   ❌ Status: Failed (${response.status})`);
        const errorText = await response.text();
        console.log(`   📊 Error: ${errorText}`);
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Status: Error - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Success Rate: ${((successCount / crons.length) * 100).toFixed(1)}%`);
  
  if (failCount > 0) {
    console.log(`\n🔧 Troubleshooting Tips:`);
    console.log(`   1. Check if all environment variables are set correctly`);
    console.log(`   2. Verify database connection is working`);
    console.log(`   3. Check server logs for detailed error messages`);
    console.log(`   4. Ensure all required services are running`);
  }
}

// Run the test
testAllCrons();
