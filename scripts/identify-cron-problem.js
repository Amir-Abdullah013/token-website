require('dotenv').config();

/**
 * Identify CRON Problem
 * This script helps identify the exact source of CRON execution errors
 */

async function identifyCronProblem() {
  console.log('🔍 Identifying CRON Execution Problem...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('📊 Current Error Analysis:');
  console.log('   ✅ CRON is running (every minute)');
  console.log('   ✅ Current Price: $0.0036939686');
  console.log('   ⏸️ Orders waiting: 1');
  console.log('   ❌ Errors: 1 (persistent)');
  console.log('   ⏱️ Execution time: 773ms\n');
  
  console.log('🔍 Problem Identification Steps:\n');
  
  console.log('1️⃣ CHECK YOUR VPS SERVER LOGS:');
  console.log('   Run these commands on your VPS:');
  console.log('');
  console.log('   # Check application logs');
  console.log('   journalctl -u your-app-service -f');
  console.log('   # OR if using PM2:');
  console.log('   pm2 logs your-app-name');
  console.log('');
  console.log('   # Check CRON execution logs');
  console.log('   tail -f /var/log/cron-auto-match.log');
  console.log('');
  console.log('   # Check system logs');
  console.log('   tail -f /var/log/syslog | grep cron');
  console.log('');
  
  console.log('2️⃣ CHECK DATABASE CONNECTION:');
  console.log('   # Test database connection');
  console.log('   psql $DATABASE_URL -c "SELECT NOW();"');
  console.log('');
  console.log('   # Check database logs');
  console.log('   tail -f /var/log/postgresql/postgresql.log');
  console.log('');
  
  console.log('3️⃣ CHECK THE PROBLEMATIC ORDER:');
  console.log('   Run this SQL query on your VPS:');
  console.log('');
  console.log('   SELECT o.*, u.email, u.name, w."usdBalance", w."VonBalance"');
  console.log('   FROM orders o');
  console.log('   LEFT JOIN users u ON o."userId" = u.id');
  console.log('   LEFT JOIN wallets w ON o."userId" = w."userId"');
  console.log('   WHERE o.status = \'PENDING\' AND o."priceType" = \'LIMIT\';');
  console.log('');
  
  console.log('4️⃣ CHECK USER WALLET BALANCE:');
  console.log('   # Get the user ID from the order above, then run:');
  console.log('   SELECT "userId", "usdBalance", "VonBalance", "lastUpdated"');
  console.log('   FROM wallets WHERE "userId" = \'[USER_ID_FROM_ORDER]\';');
  console.log('');
  
  console.log('5️⃣ CHECK CURRENT TOKEN PRICE:');
  console.log('   SELECT "currentTokenValue", "updatedAt"');
  console.log('   FROM token_stats ORDER BY "updatedAt" DESC LIMIT 1;');
  console.log('');
  
  console.log('6️⃣ TEST CRON ENDPOINT MANUALLY:');
  console.log('   # Test the endpoint directly');
  console.log(`   curl -v "${baseUrl}/api/cron/auto-match-orders"`);
  console.log('');
  console.log('   # Test with detailed output');
  console.log(`   curl -s "${baseUrl}/api/cron/auto-match-orders" | jq`);
  console.log('');
  
  console.log('7️⃣ CHECK ENVIRONMENT VARIABLES:');
  console.log('   # Verify all required env vars are set');
  console.log('   echo $DATABASE_URL');
  console.log('   echo $NEXT_PUBLIC_BASE_URL');
  console.log('   echo $CRON_SECRET');
  console.log('');
  
  console.log('8️⃣ COMMON ERROR PATTERNS TO LOOK FOR:');
  console.log('   ❌ "Insufficient balance" - User needs more funds');
  console.log('   ❌ "Wallet not found" - User wallet missing');
  console.log('   ❌ "Database connection timeout" - DB issues');
  console.log('   ❌ "Invalid order data" - Corrupted order');
  console.log('   ❌ "Transaction failed" - DB transaction error');
  console.log('   ❌ "User not found" - User account issues');
  console.log('');
  
  console.log('9️⃣ QUICK FIXES TO TRY:');
  console.log('   # Cancel the problematic order');
  console.log('   UPDATE orders SET status = \'CANCELED\', "canceledAt" = NOW()');
  console.log('   WHERE status = \'PENDING\' AND "priceType" = \'LIMIT\';');
  console.log('');
  console.log('   # Check if user has wallet');
  console.log('   INSERT INTO wallets ("userId", balance, "VonBalance")');
  console.log('   VALUES (\'[USER_ID]\', 0, 0) ON CONFLICT DO NOTHING;');
  console.log('');
  
  console.log('🔟 DEBUGGING COMMANDS:');
  console.log('   # Check CRON is actually running');
  console.log('   crontab -l');
  console.log('   systemctl status cron');
  console.log('');
  console.log('   # Check if your app is running');
  console.log('   ps aux | grep node');
  console.log('   netstat -tlnp | grep :3000');
  console.log('');
  console.log('   # Check disk space');
  console.log('   df -h');
  console.log('');
  console.log('   # Check memory usage');
  console.log('   free -h');
  console.log('');
  
  console.log('🎯 MOST LIKELY CAUSES:');
  console.log('   1. User has insufficient balance for the order');
  console.log('   2. User wallet is missing or corrupted');
  console.log('   3. Database transaction is timing out');
  console.log('   4. Invalid order data (negative amounts, etc.)');
  console.log('   5. Database connection issues');
  console.log('');
  
  console.log('📋 IMMEDIATE ACTION PLAN:');
  console.log('   1. Check VPS logs first (most important)');
  console.log('   2. Run the database queries above');
  console.log('   3. Test the endpoint manually');
  console.log('   4. Check user wallet balance');
  console.log('   5. If all else fails, cancel the problematic order');
  console.log('');
  
  console.log('🚀 NEXT STEPS:');
  console.log('   1. SSH into your VPS');
  console.log('   2. Run: journalctl -u your-app-service -f');
  console.log('   3. Wait for the next CRON execution (every minute)');
  console.log('   4. Look for the specific error message');
  console.log('   5. Fix the underlying issue');
  console.log('');
  
  console.log('✅ Once you identify the specific error, the order should execute successfully!');
}

// Run the identification
identifyCronProblem();
