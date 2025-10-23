require('dotenv').config();

/**
 * CRON Monitoring System
 * This script monitors all CRON jobs and ensures they're working perfectly
 */

async function monitorCrons() {
  console.log('🔍 CRON Monitoring System - Ensuring Perfect Operation...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-in-production';
  
  const crons = [
    {
      name: 'Auto Match Orders',
      endpoint: '/api/cron/auto-match-orders',
      critical: true,
      expectedResponse: ['executedCount', 'skippedCount', 'errorCount', 'currentPrice']
    },
    {
      name: 'Match Orders (Manual)',
      endpoint: '/api/cron/match-orders',
      critical: false,
      expectedResponse: ['executedCount']
    },
    {
      name: 'Process Wallet Fees',
      endpoint: '/api/cron/process-wallet-fees',
      critical: true,
      expectedResponse: ['results'],
      auth: true
    },
    {
      name: 'Process Stakings',
      endpoint: '/api/cron/process-stakings',
      critical: true,
      expectedResponse: ['processed', 'errors']
    },
    {
      name: 'Cleanup Reset Tokens',
      endpoint: '/api/cron/cleanup-reset-tokens',
      critical: false,
      expectedResponse: ['count'],
      auth: true
    }
  ];
  
  let allHealthy = true;
  const results = [];
  
  console.log('📊 Testing All CRON Endpoints...\n');
  
  for (const cron of crons) {
    console.log(`🔍 Testing ${cron.name}...`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (cron.auth) {
        headers['Authorization'] = `Bearer ${cronSecret}`;
      }
      
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${cron.endpoint}`, {
        method: 'GET',
        headers
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if response has expected fields
        const hasExpectedFields = cron.expectedResponse.every(field => 
          data.hasOwnProperty(field)
        );
        
        const isHealthy = data.success !== false && hasExpectedFields;
        
        if (isHealthy) {
          console.log(`   ✅ Status: HEALTHY (${responseTime}ms)`);
          if (cron.name === 'Auto Match Orders') {
            console.log(`   📈 Executed: ${data.executedCount || 0} orders`);
            console.log(`   ⏸️ Waiting: ${data.skippedCount || 0} orders`);
            console.log(`   ❌ Errors: ${data.errorCount || 0} orders`);
            console.log(`   💰 Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
          }
        } else {
          console.log(`   ⚠️ Status: UNHEALTHY - Missing expected fields`);
          allHealthy = false;
        }
        
        results.push({
          name: cron.name,
          status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
          responseTime,
          critical: cron.critical,
          data: cron.name === 'Auto Match Orders' ? {
            executed: data.executedCount || 0,
            waiting: data.skippedCount || 0,
            errors: data.errorCount || 0,
            price: data.currentPrice
          } : null
        });
        
      } else {
        console.log(`   ❌ Status: FAILED (${response.status})`);
        allHealthy = false;
        
        results.push({
          name: cron.name,
          status: 'FAILED',
          responseTime,
          critical: cron.critical,
          error: `HTTP ${response.status}`
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Status: ERROR - ${error.message}`);
      allHealthy = false;
      
      results.push({
        name: cron.name,
        status: 'ERROR',
        responseTime: 0,
        critical: cron.critical,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 CRON Health Summary:');
  console.log('========================\n');
  
  const healthyCount = results.filter(r => r.status === 'HEALTHY').length;
  const criticalIssues = results.filter(r => r.critical && r.status !== 'HEALTHY');
  
  console.log(`✅ Healthy: ${healthyCount}/${results.length}`);
  console.log(`❌ Issues: ${results.length - healthyCount}`);
  
  if (criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES:`);
    criticalIssues.forEach(issue => {
      console.log(`   - ${issue.name}: ${issue.status}`);
      if (issue.error) console.log(`     Error: ${issue.error}`);
    });
  }
  
  // Auto Match Orders specific analysis
  const autoMatchResult = results.find(r => r.name === 'Auto Match Orders');
  if (autoMatchResult && autoMatchResult.data) {
    console.log(`\n🎯 Auto Match Orders Analysis:`);
    console.log(`   Executed: ${autoMatchResult.data.executed} orders`);
    console.log(`   Waiting: ${autoMatchResult.data.waiting} orders`);
    console.log(`   Errors: ${autoMatchResult.data.errors} orders`);
    console.log(`   Current Price: $${autoMatchResult.data.price?.toFixed(6) || 'N/A'}`);
    
    if (autoMatchResult.data.waiting > 0) {
      console.log(`\n⚠️ ${autoMatchResult.data.waiting} order(s) waiting - Possible reasons:`);
      console.log(`   1. Insufficient user balance`);
      console.log(`   2. Price conditions not met`);
      console.log(`   3. Database transaction issues`);
      console.log(`   4. Wallet not found for user`);
    }
    
    if (autoMatchResult.data.errors > 0) {
      console.log(`\n❌ ${autoMatchResult.data.errors} error(s) occurred - Check server logs`);
    }
  }
  
  console.log(`\n🎯 Overall Status: ${allHealthy ? '✅ ALL SYSTEMS HEALTHY' : '⚠️ ISSUES DETECTED'}`);
  
  if (!allHealthy) {
    console.log(`\n🔧 Recommended Actions:`);
    console.log(`   1. Check server logs for detailed error messages`);
    console.log(`   2. Verify database connection is stable`);
    console.log(`   3. Ensure all environment variables are set correctly`);
    console.log(`   4. Check if CRON jobs are actually running on your VPS`);
    console.log(`   5. Monitor the auto-match-order endpoint every minute`);
  }
  
  return allHealthy;
}

// Run the monitoring
monitorCrons();
