require('dotenv').config();

/**
 * Monitor VPS Status
 * This script helps monitor the current status of your VPS deployment
 */

async function monitorVpsStatus() {
  console.log('🔍 Monitoring VPS Status...\n');
  
  console.log('📊 Current Status:');
  console.log('   ✅ updateUsdBalance function deployed (line 444)');
  console.log('   ❌ Still getting 500 errors');
  console.log('   🔧 Need to investigate further\n');
  
  console.log('🚀 VPS MONITORING COMMANDS:');
  console.log('');
  console.log('1️⃣ CHECK APPLICATION STATUS:');
  console.log('   pm2 status');
  console.log('   pm2 logs token-website --lines 10');
  console.log('');
  console.log('2️⃣ CHECK FOR RUNTIME ERRORS:');
  console.log('   pm2 logs token-website --err --lines 20');
  console.log('');
  console.log('3️⃣ TEST CRON ENDPOINT DIRECTLY:');
  console.log('   curl -v "https://your-domain.com/api/cron/auto-match-orders"');
  console.log('');
  console.log('4️⃣ CHECK DATABASE CONNECTION:');
  console.log('   # Test if database is accessible');
  console.log('   psql $DATABASE_URL -c "SELECT NOW();"');
  console.log('');
  console.log('5️⃣ VERIFY ENVIRONMENT VARIABLES:');
  console.log('   echo $DATABASE_URL');
  console.log('   echo $NEXT_PUBLIC_BASE_URL');
  console.log('');
  console.log('6️⃣ CHECK APPLICATION LOGS:');
  console.log('   # Monitor logs in real-time');
  console.log('   pm2 logs token-website -f');
  console.log('');
  
  console.log('🔧 POSSIBLE ISSUES:');
  console.log('   1. Application not restarted properly');
  console.log('   2. Database connection issues');
  console.log('   3. Environment variables not set');
  console.log('   4. Build/compilation errors');
  console.log('   5. Port conflicts or server issues');
  console.log('');
  
  console.log('🎯 TROUBLESHOOTING STEPS:');
  console.log('');
  console.log('STEP 1 - Check Application Status:');
  console.log('   pm2 status');
  console.log('   # Should show token-website as "online"');
  console.log('');
  console.log('STEP 2 - Check Recent Logs:');
  console.log('   pm2 logs token-website --lines 20');
  console.log('   # Look for any new error messages');
  console.log('');
  console.log('STEP 3 - Force Restart:');
  console.log('   pm2 stop token-website');
  console.log('   pm2 start token-website');
  console.log('   # Or: pm2 restart token-website');
  console.log('');
  console.log('STEP 4 - Test Endpoint:');
  console.log('   curl -s "https://your-domain.com/api/cron/auto-match-orders"');
  console.log('   # Should return JSON response, not 500 error');
  console.log('');
  console.log('STEP 5 - Check Database:');
  console.log('   # Verify database connection');
  console.log('   psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"');
  console.log('');
  
  console.log('📋 EXPECTED RESULTS:');
  console.log('   ✅ PM2 status shows "online"');
  console.log('   ✅ No more "updateUsdBalance is not a function" errors');
  console.log('   ✅ CRON endpoint returns JSON (not 500 error)');
  console.log('   ✅ Database connection successful');
  console.log('   ✅ Orders executing when conditions are met');
  console.log('');
  
  console.log('🚨 IF STILL GETTING 500 ERRORS:');
  console.log('   1. Check if the application is actually running');
  console.log('   2. Verify all environment variables are set');
  console.log('   3. Check for any build/compilation errors');
  console.log('   4. Ensure database connection is working');
  console.log('   5. Check if there are any other missing functions');
  console.log('');
  
  console.log('✅ The updateUsdBalance function is deployed!');
  console.log('   Now we need to ensure the application is running properly.');
  console.log('   Run the monitoring commands above to identify any remaining issues.');
}

// Run the monitoring
monitorVpsStatus();
