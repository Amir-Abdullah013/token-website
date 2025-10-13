const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeTokenStats() {
  try {
    console.log('🔧 Initializing Tiki token statistics...');
    
    // Check if token stats already exist
    const existingStats = await prisma.tokenStats.findFirst();
    
    if (existingStats) {
      console.log('✅ Token stats already exist:');
      console.log(`   Total Tokens: ${existingStats.totalTokens.toLocaleString()}`);
      console.log(`   Total Investment: $${existingStats.totalInvestment.toLocaleString()}`);
      console.log(`   Current Price: $${existingStats.currentPrice.toFixed(6)}`);
      console.log(`   Last Updated: ${existingStats.lastUpdated}`);
      return true;
    }
    
    // Create initial token stats
    const initialStats = await prisma.tokenStats.create({
      data: {
        totalTokens: 100000000,    // 100M TIKI tokens
        totalInvestment: 350000,    // Initial investment: 350,000 USD
        currentPrice: 0.0035       // Initial price: 0.0035 USD
      }
    });
    
    console.log('✅ Token stats initialized successfully!');
    console.log(`   Total Tokens: ${initialStats.totalTokens.toLocaleString()}`);
    console.log(`   Total Investment: $${initialStats.totalInvestment.toLocaleString()}`);
    console.log(`   Current Price: $${initialStats.currentPrice.toFixed(6)}`);
    console.log(`   Price Formula: $${initialStats.totalInvestment.toLocaleString()} ÷ ${initialStats.totalTokens.toLocaleString()} = $${initialStats.currentPrice.toFixed(6)}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing token stats:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeTokenStats();












