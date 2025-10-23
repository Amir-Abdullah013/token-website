require('dotenv').config();

/**
 * Setup CRON Monitoring
 * This script helps you set up proper CRON monitoring on your VPS
 */

async function setupCronMonitoring() {
  console.log('🚀 Setting up CRON Monitoring System...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('📋 CRON Monitoring Setup Guide:\n');
  
  console.log('1️⃣ VPS CRON Configuration:');
  console.log('   Add these to your VPS crontab (crontab -e):');
  console.log('');
  console.log('   # Auto Match Orders - Every minute');
  console.log(`   */1 * * * * curl -s "${baseUrl}/api/cron/auto-match-orders" >> /var/log/cron-auto-match.log 2>&1`);
  console.log('');
  console.log('   # Process Wallet Fees - Daily at midnight');
  console.log(`   0 0 * * * curl -s "${baseUrl}/api/cron/process-wallet-fees" >> /var/log/cron-wallet-fees.log 2>&1`);
  console.log('');
  console.log('   # Process Stakings - Every 6 hours');
  console.log(`   0 */6 * * * curl -s "${baseUrl}/api/cron/process-stakings" >> /var/log/cron-stakings.log 2>&1`);
  console.log('');
  console.log('   # Cleanup Reset Tokens - Every hour');
  console.log(`   0 * * * * curl -s "${baseUrl}/api/cron/cleanup-reset-tokens" >> /var/log/cron-cleanup.log 2>&1`);
  console.log('');
  
  console.log('2️⃣ Monitoring Scripts:');
  console.log('   # Run this to monitor all CRONs:');
  console.log('   node scripts/monitor-crons.js');
  console.log('');
  console.log('   # Run this to test order execution:');
  console.log('   node scripts/test-order-execution.js');
  console.log('');
  console.log('   # Run this to force order execution:');
  console.log('   node scripts/force-order-execution.js');
  console.log('');
  
  console.log('3️⃣ Log Monitoring:');
  console.log('   # Check CRON logs:');
  console.log('   tail -f /var/log/cron-auto-match.log');
  console.log('   tail -f /var/log/cron-wallet-fees.log');
  console.log('   tail -f /var/log/cron-stakings.log');
  console.log('   tail -f /var/log/cron-cleanup.log');
  console.log('');
  
  console.log('4️⃣ Database Monitoring:');
  console.log('   # Check pending orders:');
  console.log('   SELECT * FROM orders WHERE status = \'PENDING\' AND "priceType" = \'LIMIT\';');
  console.log('');
  console.log('   # Check order execution history:');
  console.log('   SELECT * FROM orders WHERE status = \'FILLED\' ORDER BY "updatedAt" DESC LIMIT 10;');
  console.log('');
  console.log('   # Check current token price:');
  console.log('   SELECT "currentTokenValue" FROM token_stats ORDER BY "updatedAt" DESC LIMIT 1;');
  console.log('');
  
  console.log('5️⃣ Health Check Endpoints:');
  console.log(`   # Test auto-match orders: GET ${baseUrl}/api/cron/auto-match-orders`);
  console.log(`   # Test manual matching: GET ${baseUrl}/api/cron/match-orders`);
  console.log(`   # Test wallet fees: GET ${baseUrl}/api/cron/process-wallet-fees`);
  console.log(`   # Test stakings: GET ${baseUrl}/api/cron/process-stakings`);
  console.log('');
  
  console.log('6️⃣ Troubleshooting:');
  console.log('   # If orders are not executing:');
  console.log('   1. Check user wallet balances');
  console.log('   2. Verify price conditions are met');
  console.log('   3. Check database connection');
  console.log('   4. Review server logs for errors');
  console.log('   5. Ensure CRON jobs are actually running');
  console.log('');
  
  console.log('🎯 Quick Test Commands:');
  console.log('   # Test all CRONs:');
  console.log('   node scripts/monitor-crons.js');
  console.log('');
  console.log('   # Test auto-match specifically:');
  console.log(`   curl -s "${baseUrl}/api/cron/auto-match-orders" | jq`);
  console.log('');
  console.log('   # Check CRON status on VPS:');
  console.log('   systemctl status cron');
  console.log('   crontab -l');
  console.log('');
  
  console.log('✅ Setup Complete! Your CRON monitoring system is ready.');
}

// Run the setup
setupCronMonitoring();
