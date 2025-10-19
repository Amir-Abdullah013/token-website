require('dotenv').config();

async function testOrderMatchingAPI() {
  try {
    console.log('🧪 Testing Order Matching API...\n');
    
    const response = await fetch('http://localhost:3000/api/cron/match-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Order Matching API Working!');
      console.log(`   Message: ${data.message}`);
      console.log(`   Timestamp: ${data.timestamp}`);
    } else {
      console.log('❌ API Error:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

testOrderMatchingAPI();

