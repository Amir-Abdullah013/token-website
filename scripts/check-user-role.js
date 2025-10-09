const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRole(email) {
  try {
    console.log(`🔍 Checking role for user: ${email}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found in database`);
      return false;
    }
    
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Created: ${user.createdAt}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking user role:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-user-role.js <email>');
  console.log('Example: node scripts/check-user-role.js admin@example.com');
  process.exit(1);
}

checkUserRole(email);





