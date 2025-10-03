#!/usr/bin/env node

/**
 * Fix environment setup for database connection
 */

const fs = require('fs');

console.log('🔧 Fixing environment setup...');

// Check if .env.local exists
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('Creating .env.local file...');
  
  const envTemplate = `# Database Configuration
DATABASE_URL=your_database_connection_string_here


# Optional - Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file exists');
}

// Read current content
let envContent = fs.readFileSync(envPath, 'utf8');

// Check what's missing
const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
const hasDirectUrl = envContent.includes('DIRECT_URL=');

console.log('\n📊 Current status:');
console.log(`DATABASE_URL: ${hasDatabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`DIRECT_URL: ${hasDirectUrl ? '✅ Set' : '❌ Missing'}`);

if (!hasDatabaseUrl) {
  console.log('\n⚠️  You need to add DATABASE_URL to your .env.local file');
  console.log('Example:');
  console.log('DATABASE_URL=postgresql://username:password@host:port/database');
}

if (!hasDirectUrl) {
  console.log('\n⚠️  You need to add DIRECT_URL to your .env.local file');
  console.log('Example:');
  console.log('DIRECT_URL=postgresql://username:password@host:port/database');
}

console.log('\n📝 Complete .env.local template:');
console.log('==================================');
console.log(`# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database

# Optional - Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID`);

console.log('\n🚀 After updating .env.local, run:');
console.log('npx prisma generate');
console.log('npx prisma db push');


