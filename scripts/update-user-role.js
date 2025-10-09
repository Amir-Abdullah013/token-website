const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole(email, newRole) {
  try {
    console.log(`🔧 Updating role for user: ${email} to ${newRole}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found in database`);
      return false;
    }
    
    console.log(`📋 Current user info:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    
    // Update user role
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: newRole }
    });
    
    console.log(`✅ User role updated successfully!`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   New Role: ${updatedUser.role}`);
    console.log(`   Updated: ${updatedUser.updatedAt}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get parameters from command line arguments
const email = process.argv[2];
const newRole = process.argv[3];

if (!email || !newRole) {
  console.log('Usage: node scripts/update-user-role.js <email> <role>');
  console.log('Example: node scripts/update-user-role.js admin@example.com ADMIN');
  console.log('Valid roles: USER, ADMIN');
  process.exit(1);
}

if (!['USER', 'ADMIN'].includes(newRole)) {
  console.log('❌ Invalid role. Valid roles are: USER, ADMIN');
  process.exit(1);
}

updateUserRole(email, newRole);





