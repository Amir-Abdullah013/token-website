require('dotenv').config();

/**
 * Setup Automatic Order Matching
 * This script sets up automatic order execution
 */

async function setupAutoOrderMatching() {
  console.log('🤖 Setting up Automatic Order Matching...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Test the auto-match endpoint
    console.log('🧪 Testing auto-match endpoint...');
    const response = await fetch(`${baseUrl}/api/cron/auto-match-orders`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auto-match endpoint is working!');
      console.log(`   Current Price: $${data.currentPrice?.toFixed(6) || 'N/A'}`);
      console.log(`   Executed: ${data.executedCount || 0} orders`);
      console.log(`   Waiting: ${data.skippedCount || 0} orders`);
    } else {
      console.log('❌ Auto-match endpoint failed:', response.status);
    }
    
    console.log('\n📋 Setup Options:\n');
    
    console.log('1. 🕐 CRON JOB (Recommended for Production):');
    console.log('   Add this to your crontab:');
    console.log(`   */1 * * * * curl -X GET "${baseUrl}/api/cron/auto-match-orders"`);
    console.log('   (Runs every minute)\n');
    
    console.log('2. 🔄 PM2 CRON (Alternative):');
    console.log('   pm2 start "curl -X GET ' + baseUrl + '/api/cron/auto-match-orders" --cron "*/1 * * * *"');
    console.log('   (Runs every minute)\n');
    
    console.log('3. 🌐 VERCEL CRON (If using Vercel):');
    console.log('   Add to vercel.json:');
    console.log('   {');
    console.log('     "crons": [{');
    console.log('       "path": "/api/cron/auto-match-orders",');
    console.log('       "schedule": "*/1 * * * *"');
    console.log('     }]');
    console.log('   }');
    console.log('   (Runs every minute)\n');
    
    console.log('4. 🧪 MANUAL TESTING:');
    console.log(`   curl -X GET "${baseUrl}/api/cron/auto-match-orders"`);
    console.log('   (Run this command to test)\n');
    
    console.log('✅ Setup complete! Choose one of the options above.\n');
    
    console.log('💡 How it works:');
    console.log('   • System checks for pending limit orders every minute');
    console.log('   • When price reaches your limit, order executes automatically');
    console.log('   • No manual intervention needed!');
    console.log('   • Orders execute instantly when conditions are met');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

setupAutoOrderMatching();

