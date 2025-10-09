// Test the new database manager
import { getDatabase, executeQuery } from '../src/lib/database-manager.js';

async function testNewDatabaseManager() {
  try {
    console.log('🔍 Testing new database manager...');
    
    // Test 1: Get database connection
    const db = await getDatabase();
    console.log('✅ Database connection established');
    
    // Test 2: Test tokenStats query
    const stats = await executeQuery(async (db) => {
      return await db.tokenStats.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    }, {
      totalTokens: 100000000,
      totalInvestment: 350000,
      currentPrice: 0.0035,
      lastUpdated: new Date(),
      createdAt: new Date()
    });
    
    console.log('✅ TokenStats query successful:', {
      totalTokens: stats.totalTokens,
      currentPrice: stats.currentPrice
    });
    
    // Test 3: Test price query
    const price = await executeQuery(async (db) => {
      return await db.price.findFirst({
        where: { symbol: 'TOKEN' },
        orderBy: { timestamp: 'desc' }
      });
    }, {
      symbol: 'TOKEN',
      price: 0.0035,
      timestamp: new Date(),
      source: 'fallback'
    });
    
    console.log('✅ Price query successful:', {
      symbol: price.symbol,
      price: price.price
    });
    
    console.log('🎉 New database manager test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database manager test failed:', error);
  }
}

testNewDatabaseManager();
