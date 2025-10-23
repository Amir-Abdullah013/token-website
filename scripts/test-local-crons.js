require('dotenv').config();

/**
 * Test Local CRONs
 * This script tests CRON endpoints locally for development
 */

async function testLocalCrons() {
  console.log('🧪 Testing Local CRON Endpoints...\n');
  
  // Test if we're running locally
  const isLocal = process.env.NODE_ENV === 'development' || 
                  process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost') ||
                  !process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!isLocal) {
    console.log('⚠️ This script is designed for local testing.');
    console.log('   For production VPS testing, use: node scripts/monitor-crons.js');
    return;
  }
  
  const baseUrl = 'http://localhost:3000';
  
  console.log('📊 Local CRON Testing:');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  const crons = [
    {
      name: 'Auto Match Orders',
      endpoint: '/api/cron/auto-match-orders',
      critical: true
    },
    {
      name: 'Match Orders (Manual)',
      endpoint: '/api/cron/match-orders',
      critical: false
    },
    {
      name: 'Process Wallet Fees',
      endpoint: '/api/cron/process-wallet-fees',
      critical: true,
      auth: true
    },
    {
      name: 'Process Stakings',
      endpoint: '/api/cron/process-stakings',
      critical: true
    },
    {
      name: 'Cleanup Reset Tokens',
      endpoint: '/api/cron/cleanup-reset-tokens',
      critical: false,
      auth: true
    }
  ];
  
  let healthyCount = 0;
  
  for (const cron of crons) {
    console.log(`🔍 Testing ${cron.name}...`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (cron.auth) {
        const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
        headers['Authorization'] = `Bearer ${cronSecret}`;
      }
      
      const response = await fetch(`${baseUrl}${cron.endpoint}`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: HEALTHY`);
        console.log(`   📊 Response: ${JSON.stringify(data, null, 2)}`);
        healthyCount++;
      } else {
        console.log(`   ❌ Status: FAILED (${response.status})`);
        const errorText = await response.text();
        console.log(`   📊 Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Status: ERROR - ${error.message}`);
      console.log(`   💡 Tip: Make sure your Next.js dev server is running (npm run dev)`);
    }
    
    console.log('');
  }
  
  console.log('📊 Local CRON Health Summary:');
  console.log(`   ✅ Healthy: ${healthyCount}/${crons.length}`);
  console.log(`   ❌ Issues: ${crons.length - healthyCount}`);
  
  if (healthyCount === crons.length) {
    console.log('\n🎉 All local CRONs are working perfectly!');
    console.log('   Your CRON endpoints are ready for production deployment.');
  } else {
    console.log('\n⚠️ Some CRONs have issues. Check the errors above.');
    console.log('   Make sure your Next.js server is running: npm run dev');
  }
  
  console.log('\n🚀 Next Steps for VPS Deployment:');
  console.log('   1. Deploy your code to VPS');
  console.log('   2. Set up CRON jobs on your VPS');
  console.log('   3. Run: node scripts/monitor-crons.js (on VPS)');
  console.log('   4. Monitor logs: tail -f /var/log/cron-auto-match.log');
}

// Run the test
testLocalCrons();
