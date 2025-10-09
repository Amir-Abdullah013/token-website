// Test script to verify database connection works
const { getPrisma, retryDatabaseOperation } = require('../src/lib/database-connection.js');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Get Prisma instance
    const prisma = await getPrisma();
    console.log('✅ Prisma instance created successfully');
    
    // Test 2: Test tokenStats query with retry mechanism
    const stats = await retryDatabaseOperation(async (prisma) => {
      return await prisma.tokenStats.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    });
    
    if (stats) {
      console.log('✅ TokenStats query successful:', {
        totalTokens: stats.totalTokens,
        currentPrice: stats.currentPrice
      });
    } else {
      console.log('⚠️ No tokenStats found, creating initial data...');
      
      const newStats = await retryDatabaseOperation(async (prisma) => {
        return await prisma.tokenStats.create({
          data: {
            totalTokens: 100000000,
            totalInvestment: 350000,
            currentPrice: 0.0035
          }
        });
      });
      
      console.log('✅ Initial tokenStats created:', newStats.id);
    }
    
    // Test 3: Test price query
    const price = await retryDatabaseOperation(async (prisma) => {
      return await prisma.price.findFirst({
        where: { symbol: 'TOKEN' },
        orderBy: { timestamp: 'desc' }
      });
    });
    
    if (price) {
      console.log('✅ Price query successful:', {
        symbol: price.symbol,
        price: price.price
      });
    } else {
      console.log('⚠️ No price data found');
    }
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    if (error.message?.includes('prepared statement')) {
      console.log('💡 This is still a Prisma connection pooling issue.');
      console.log('💡 Try restarting your development server completely.');
    }
  }
}

testDatabaseConnection();
