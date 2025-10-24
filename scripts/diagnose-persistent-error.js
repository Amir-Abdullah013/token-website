require('dotenv').config();

/**
 * Diagnose Persistent Error
 * This script helps identify why the error is still occurring after restart
 */

async function diagnosePersistentError() {
  console.log('🚨 CRITICAL: Error Still Persisting After Restart!');
  console.log('   ❌ updateUsdBalance is not a function error still occurring');
  console.log('   ❌ Error happening every minute');
  console.log('   🔧 Need to identify the root cause\n');
  
  console.log('🔍 POSSIBLE CAUSES:');
  console.log('   1. Code not actually deployed to VPS');
  console.log('   2. Application not using the updated code');
  console.log('   3. Function exists but not properly exported');
  console.log('   4. Multiple application instances running');
  console.log('   5. Caching issues preventing code update');
  console.log('   6. Database helpers not properly loaded');
  console.log('');
  
  console.log('🚀 COMPREHENSIVE DIAGNOSTIC COMMANDS:');
  console.log('');
  console.log('1️⃣ VERIFY CODE IS ACTUALLY DEPLOYED:');
  console.log('   # Check if the function exists in the file');
  console.log('   grep -n "updateUsdBalance" src/lib/database.js');
  console.log('   # Should show line 444: async updateUsdBalance(userId, amount) {');
  console.log('');
  console.log('2️⃣ CHECK GIT STATUS:');
  console.log('   git status');
  console.log('   git log --oneline -3');
  console.log('   # Verify latest commit is deployed');
  console.log('');
  console.log('3️⃣ VERIFY APPLICATION IS USING UPDATED CODE:');
  console.log('   # Check if there are multiple instances');
  console.log('   ps aux | grep node');
  console.log('   netstat -tlnp | grep :3000');
  console.log('');
  console.log('4️⃣ CHECK DATABASE HELPERS EXPORT:');
  console.log('   # Verify the function is properly exported');
  console.log('   grep -A 10 -B 5 "updateUsdBalance" src/lib/database.js');
  console.log('');
  console.log('5️⃣ FORCE CLEAR ALL CACHES:');
  console.log('   rm -rf .next');
  console.log('   rm -rf node_modules/.cache');
  console.log('   rm -rf node_modules/.next');
  console.log('');
  console.log('6️⃣ COMPLETE APPLICATION RESET:');
  console.log('   pm2 stop all');
  console.log('   pm2 delete all');
  console.log('   pm2 kill');
  console.log('   pm2 start npm --name "token-website" -- start');
  console.log('');
  
  console.log('🎯 ALTERNATIVE FIXES TO TRY:');
  console.log('');
  console.log('FIX 1 - Verify Function Export:');
  console.log('   # Check if the function is properly exported');
  console.log('   grep -A 15 "wallet: {" src/lib/database.js');
  console.log('');
  console.log('FIX 2 - Check for Syntax Errors:');
  console.log('   # Verify there are no syntax errors');
  console.log('   node -c src/lib/database.js');
  console.log('');
  console.log('FIX 3 - Manual Function Test:');
  console.log('   # Create a test script to verify the function');
  console.log('   echo "const { databaseHelpers } = require(\'./src/lib/database.js\');');
  console.log('   echo "console.log(typeof databaseHelpers.wallet.updateUsdBalance);" > test-function.js');
  console.log('   node test-function.js');
  console.log('');
  console.log('FIX 4 - Check Import/Export Issues:');
  console.log('   # Verify the database helpers are properly imported');
  console.log('   grep -n "databaseHelpers" src/app/api/cron/auto-match-orders/route.js');
  console.log('');
  
  console.log('🔧 EMERGENCY FIX - Direct Function Replacement:');
  console.log('');
  console.log('If the function still doesn\'t exist, manually add it:');
  console.log('   # Edit the database.js file directly');
  console.log('   nano src/lib/database.js');
  console.log('   # Add the function after line 442 (after updateBothBalances)');
  console.log('');
  console.log('   # Or use sed to add it automatically:');
  console.log('   sed -i \'442a\\');
  console.log('   \\');
  console.log('   async updateUsdBalance(userId, amount) {\\');
  console.log('   \\');
  console.log('     try {\\');
  console.log('   \\');
  console.log('       const result = await pool.query(`\\');
  console.log('   \\');
  console.log('         UPDATE wallets \\');
  console.log('   \\');
  console.log('         SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()\\');
  console.log('   \\');
  console.log('         WHERE "userId" = $2\\');
  console.log('   \\');
  console.log('         RETURNING *\\');
  console.log('   \\');
  console.log('       `, [amount, userId]);\\');
  console.log('   \\');
  console.log('       console.log(\'✅ USD balance updated:\', { userId, amount });\\');
  console.log('   \\');
  console.log('       return result.rows[0];\\');
  console.log('   \\');
  console.log('     } catch (error) {\\');
  console.log('   \\');
  console.log('       console.error(\'Error updating USD balance:\', error);\\');
  console.log('   \\');
  console.log('       throw error;\\');
  console.log('   \\');
  console.log('     }\\');
  console.log('   \\');
  console.log('   },\' src/lib/database.js');
  console.log('');
  
  console.log('📊 EXPECTED RESULTS AFTER FIX:');
  console.log('   ✅ No more "updateUsdBalance is not a function" errors');
  console.log('   ✅ CRON should show "0 errors" instead of "1 error"');
  console.log('   ✅ Orders should execute successfully');
  console.log('   ✅ Limit orders should work automatically');
  console.log('');
  
  console.log('🚨 URGENT: The error is still persisting!');
  console.log('   Run the diagnostic commands above to identify the exact issue.');
  console.log('   The function may not be properly exported or there may be multiple instances.');
}

// Run the diagnosis
diagnosePersistentError();
