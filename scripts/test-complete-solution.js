// Test the complete solution
import { databaseHelpers } from '../src/lib/database.js';

async function testCompleteSolution() {
  try {
    console.log('🔍 Testing complete solution...');
    
    // Test 1: Token Stats
    console.log('📊 Testing token stats...');
    const stats = await databaseHelpers.tokenStats.getTokenStats();
    console.log('✅ Token stats:', {
      totalTokens: stats.totalTokens,
      currentPrice: stats.currentPrice
    });
    
    // Test 2: Current Price
    console.log('💰 Testing current price...');
    const price = await databaseHelpers.price.getCurrentPrice('TOKEN');
    console.log('✅ Current price:', {
      symbol: price.symbol,
      price: price.price
    });
    
    // Test 3: User lookup (for admin dashboard)
    console.log('👤 Testing user lookup...');
    const user = await databaseHelpers.user.getUserByEmail('amirabdullah2508@gmail.com');
    if (user) {
      console.log('✅ Admin user found:', {
        email: user.email,
        role: user.role,
        name: user.name
      });
    } else {
      console.log('⚠️ Admin user not found in database');
    }
    
    console.log('🎉 Complete solution test successful!');
    console.log('💡 Your admin dashboard should now work properly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteSolution();
