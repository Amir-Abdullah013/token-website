const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminAccess() {
  try {
    console.log('🔧 Fixing admin access...');
    
    // First, let's see what users exist
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('📋 Current users in database:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Please create a user account first by signing up at http://localhost:3000/auth/signup');
      return false;
    }
    
    // Find the first user and promote them to admin
    const firstUser = users[0];
    console.log(`\n🔧 Promoting ${firstUser.email} to admin...`);
    
    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'ADMIN' }
    });
    
    console.log(`✅ Successfully promoted ${updatedUser.email} to admin!`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Role: ${updatedUser.role}`);
    
    console.log('\n🎉 Admin access fixed!');
    console.log('📝 You can now access the admin panel at: http://localhost:3000/admin/dashboard');
    console.log(`🔑 Login with: ${updatedUser.email}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing admin access:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccess();












