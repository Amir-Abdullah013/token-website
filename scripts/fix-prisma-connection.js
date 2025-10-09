const { PrismaClient } = require('@prisma/client');

async function fixPrismaConnection() {
  let prisma = null;
  
  try {
    console.log('🔧 Fixing Prisma connection issues...');
    
    // Create a new Prisma client with proper configuration
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Test the connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('🔍 Testing tokenStats query...');
    const stats = await prisma.tokenStats.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (stats) {
      console.log('✅ TokenStats query successful:', {
        totalTokens: stats.totalTokens,
        currentPrice: stats.currentPrice
      });
    } else {
      console.log('⚠️ No tokenStats found, creating initial data...');
      
      const newStats = await prisma.tokenStats.create({
        data: {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035
        }
      });
      
      console.log('✅ Initial tokenStats created:', newStats.id);
    }
    
    console.log('🎉 Prisma connection fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing Prisma connection:', error);
    
    if (error.message?.includes('prepared statement')) {
      console.log('💡 This is a known Prisma connection pooling issue.');
      console.log('💡 Try restarting your development server to clear the connection pool.');
    }
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Prisma client disconnected');
    }
  }
}

fixPrismaConnection();
