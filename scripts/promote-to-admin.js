const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function promoteToAdmin(email) {
  try {
    console.log(`🔧 Promoting user ${email} to admin...`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      return false;
    }
    
    if (user.role === 'ADMIN') {
      console.log(`✅ User ${email} is already an admin`);
      return true;
    }
    
    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    });
    
    console.log(`✅ Successfully promoted ${email} to admin!`);
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Role: ${updatedUser.role}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/promote-to-admin.js <email>');
  console.log('Example: node scripts/promote-to-admin.js test@example.com');
  process.exit(1);
}

promoteToAdmin(email);







