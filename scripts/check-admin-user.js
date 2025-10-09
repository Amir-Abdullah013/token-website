const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Checking for admin user: amirabdullah2508@gmail.com');
    
    const user = await prisma.user.findUnique({
      where: { email: 'amirabdullah2508@gmail.com' }
    });
    
    if (user) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
    } else {
      console.log('❌ Admin user not found in database');
      console.log('Creating admin user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'amirabdullah2508@gmail.com',
          name: 'Amir Abdullah',
          password: hashedPassword,
          emailVerified: true,
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Admin user created:', newUser.email);
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
