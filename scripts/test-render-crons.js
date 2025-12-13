require('dotenv').config();

/**
 * Test Render Cron Jobs
 * This script tests all cron endpoints to ensure they work with Render
 * Run this after deploying to Render to verify everything is working
 */

async function testRenderCrons() {
  console.log('🧪 Testing Render Cron Jobs...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
  
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🔐 Using CRON_SECRET: ${cronSecret ? '✅ Set' : '❌ Not set'}\n`);
  
  const crons = [
    {
      name: 'Auto Match Orders',
      endpoint: '/api/cron/auto-match-orders',
      critical: true
    },
    {
      name: 'Process Wallet Fees',
      endpoint: '/api/cron/process-wallet-fees',
      critical: true
    },
    {
      name: 'Process Stakings',
      endpoint: '/api/cron/process-stakings',
      critical: true
    },
    {
      name: 'Cleanup Reset Tokens',
      endpoint: '/api/cron/cleanup-reset-tokens',
      critical: false
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const cron of crons) {
    console.log(`🔍 Testing ${cron.name}...`);
    
    try {
      const response = await fetch(`${baseUrl}${cron.endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS (${response.status})`);
        console.log(`   📊 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED (${response.status})`);
        console.log(`   📊 Error: ${errorText.substring(0, 200)}`);
        failCount++;
        
        if (response.status === 401) {
          console.log(`   ⚠️  Authentication failed - Check CRON_SECRET`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failCount++;
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  Cannot connect to ${baseUrl}`);
        console.log(`   💡 Make sure your Render service is running`);
      }
    }
    
    console.log('');
  }
  
  console.log('📊 Test Summary:');
  console.log(`   ✅ Successful: ${successCount}/${crons.length}`);
  console.log(`   ❌ Failed: ${failCount}/${crons.length}`);
  
  if (successCount === crons.length) {
    console.log('\n🎉 All cron jobs are working perfectly on Render!');
  } else {
    console.log('\n⚠️  Some cron jobs have issues. Check the errors above.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify CRON_SECRET is set correctly in Render');
    console.log('   2. Check that NEXT_PUBLIC_BASE_URL points to your Render service');
    console.log('   3. Ensure your web service is deployed and running');
    console.log('   4. Check Render logs for any errors');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Set up cron jobs in Render dashboard or use render.yaml');
  console.log('   2. Configure the same CRON_SECRET in all cron jobs');
  console.log('   3. Monitor cron job logs in Render dashboard');
}

// Run the tests
testRenderCrons().catch(console.error);

