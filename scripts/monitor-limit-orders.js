require('dotenv').config();

/**
 * REAL-TIME LIMIT ORDER MONITORING
 * This script monitors limit orders in real-time to verify automatic execution
 */

async function monitorLimitOrders() {
  console.log('🔍 REAL-TIME LIMIT ORDER MONITORING\n');
  console.log('=' .repeat(60));
  console.log('Monitoring automatic order execution...\n');
  console.log('Press Ctrl+C to stop monitoring\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let monitoringCount = 0;
  
  const monitor = async () => {
    monitoringCount++;
    const timestamp = new Date().toLocaleString();
    
    try {
      console.log(`[${timestamp}] 🔄 Check #${monitoringCount} - Monitoring orders...`);
      
      // Call the production auto-match endpoint
      const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.log(`[${timestamp}] ❌ API Error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`[${timestamp}] ✅ Auto-matching completed:`);
        console.log(`   📊 Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
        console.log(`   📈 Executed: ${data.executedCount || 0} orders`);
        console.log(`   ⏸️ Waiting: ${data.skippedCount || 0} orders`);
        console.log(`   ❌ Errors: ${data.errorCount || 0} orders`);
        console.log(`   ⏱️ Execution Time: ${data.executionTime || 0}ms`);
        
        if (data.executedCount > 0) {
          console.log(`\n🎉 ORDERS EXECUTED AUTOMATICALLY!`);
          console.log(`   ${data.executedCount} orders were executed automatically`);
          console.log(`   This proves the system is working correctly!\n`);
        }
        
        if (data.skippedCount > 0) {
          console.log(`   ⏸️ ${data.skippedCount} orders are waiting for price conditions\n`);
        }
        
      } else {
        console.log(`[${timestamp}] ❌ Auto-matching failed: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`[${timestamp}] ❌ Monitoring error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  };
  
  // Run immediately
  await monitor();
  
  // Then run every 30 seconds
  const interval = setInterval(monitor, 30000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping monitoring...');
    clearInterval(interval);
    console.log('✅ Monitoring stopped');
    process.exit(0);
  });
  
  console.log('📡 Monitoring started. Orders will be checked every 30 seconds.');
  console.log('💡 Create some limit orders in your browser to see them execute automatically!');
}

monitorLimitOrders().catch(console.error);
