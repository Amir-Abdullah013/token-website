const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser(email, password, name) {
  try {
    console.log(`🔧 Creating admin user: ${email}...`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`);
      return false;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        emailVerified: true,
        role: 'ADMIN'
      }
    });
    
    // Create wallet for the admin user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: 'PKR'
      }
    });
    
    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`User ID: ${user.id}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get parameters from command line arguments
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];

if (!email || !password || !name) {
  console.log('Usage: node scripts/create-admin-user.js <email> <password> <name>');
  console.log('Example: node scripts/create-admin-user.js admin@example.com admin123 "Admin User"');
  process.exit(1);
}

createAdminUser(email, password, name);







