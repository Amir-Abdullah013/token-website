const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Create a test user if it doesn't exist
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
          emailVerified: true,
          role: 'USER'
        }
      });
      
      console.log('✅ Test user created:', user.email);
      
      // Create wallet for test user
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: 'PKR'
        }
      });
      
      console.log('✅ Test wallet created');
    } else {
      console.log('✅ Test user already exists');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your DATABASE_URL is set in .env.local');
    console.log('2. Make sure your database server is running');
    console.log('3. Run "npx prisma db push" to sync the schema');
    console.log('4. Run "npx prisma generate" to generate the client');
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
