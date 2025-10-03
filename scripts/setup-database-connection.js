#!/usr/bin/env node

/**
 * Setup database connection for Prisma
 * Handles connection pooling issues
 */

const fs = require('fs');

console.log('🔧 Setting up database connection...');

// Check if .env.local exists
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if DATABASE_URL exists
if (!envContent.includes('DATABASE_URL=')) {
  console.log('❌ DATABASE_URL not found in .env.local');
  console.log('Please add your database connection string to .env.local');
  process.exit(1);
}

// Extract DATABASE_URL
const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
if (!databaseUrlMatch) {
  console.log('❌ Could not parse DATABASE_URL');
  process.exit(1);
}

const databaseUrl = databaseUrlMatch[1].trim();

// Create DIRECT_URL (remove pooling parameters)
let directUrl = databaseUrl;
if (directUrl.includes('?pgbouncer=true')) {
  directUrl = directUrl.replace('?pgbouncer=true', '');
}
if (directUrl.includes('&pgbouncer=true')) {
  directUrl = directUrl.replace('&pgbouncer=true', '');
}

// Add DIRECT_URL if not exists
if (!envContent.includes('DIRECT_URL=')) {
  envContent += `\n# Direct database connection (for migrations)\nDIRECT_URL=${directUrl}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added DIRECT_URL to .env.local');
} else {
  console.log('✅ DIRECT_URL already exists');
}

console.log('\n📋 Your environment variables:');
console.log(`DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);
console.log(`DIRECT_URL: ${directUrl.substring(0, 50)}...`);

console.log('\n🚀 Now you can run:');
console.log('npx prisma db push');
console.log('npx prisma generate');


