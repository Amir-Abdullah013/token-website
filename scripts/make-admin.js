const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

async function makeUserAdmin(email) {
  try {
    console.log(`🔧 Making user admin: ${email}`);
    
    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found in database`);
      console.log(`💡 Creating new user with ADMIN role...`);
      
      // Create new user with ADMIN role
      const newUser = await prisma.user.create({
        data: {
          email: email,
          name: email.split('@')[0], // Use email prefix as name
          role: 'ADMIN',
          emailVerified: true
        }
      });
      
      console.log(`✅ New admin user created:`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   ID: ${newUser.id}`);
      
    } else {
      console.log(`📋 Current user info:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Current Role: ${user.role}`);
      
      // Update user to ADMIN
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: { role: 'ADMIN' }
      });
      
      console.log(`✅ User role updated to ADMIN!`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   New Role: ${updatedUser.role}`);
    }
    
    console.log(`\n🎉 SUCCESS! User ${email} now has ADMIN access`);
    console.log(`🌐 You can now access: http://localhost:3000/admin/dashboard`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js admin@example.com');
  console.log('Example: node scripts/make-admin.js your-email@gmail.com');
  process.exit(1);
}

makeUserAdmin(email);
