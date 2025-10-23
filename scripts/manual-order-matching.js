require('dotenv').config();

/**
 * Manual Order Matching Script
 * This script manually triggers order matching for testing
 */

async function manualOrderMatching() {
  console.log('🔄 Manual Order Matching...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('🚀 Triggering auto-match orders...');
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Order matching completed!');
      console.log(`📊 Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
      console.log(`✅ Executed: ${data.executedCount || 0} orders`);
      console.log(`⏸️ Waiting: ${data.skippedCount || 0} orders`);
      console.log(`❌ Errors: ${data.errorCount || 0} orders`);
      console.log(`⏱️ Execution Time: ${data.executionTime || 0}ms`);
      
      if (data.executedCount > 0) {
        console.log('\n🎉 Orders were executed successfully!');
      } else if (data.skippedCount > 0) {
        console.log('\n⏸️ Orders are waiting for price conditions to be met');
      } else {
        console.log('\n📭 No pending orders to process');
      }
    } else {
      console.log('❌ Order matching failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Manual order matching failed:', error.message);
  }
}

// Run the manual matching
manualOrderMatching();
