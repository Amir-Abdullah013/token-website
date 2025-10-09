const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdminSession() {
  try {
    console.log('🔧 Setting up admin session for testing...');
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'amirabdullah2508@gmail.com' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Name: ${adminUser.name}`);
      
      // Update emailVerified to true if it's false
      if (!adminUser.emailVerified) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { emailVerified: true }
        });
        console.log('✅ Email verification status updated to true');
      }
      
      console.log('\n🎉 Admin user is ready for testing!');
      console.log('You can now:');
      console.log('1. Go to /test-admin-session to set up a mock session');
      console.log('2. Or use OAuth with your Google account (amirabdullah2508@gmail.com)');
      console.log('3. The admin dashboard should work at /admin/dashboard');
      
    } else {
      console.log('❌ Admin user not found. Creating one...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'amirabdullah2508@gmail.com',
          name: 'Amir Abdullah',
          password: hashedPassword,
          emailVerified: true,
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Admin user created:', newAdmin.email);
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin session:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminSession();
