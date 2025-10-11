#!/usr/bin/env node

/**
 * Fix database connection by removing pooling parameters
 */

const fs = require('fs');

console.log('🔧 Fixing database connection...');

// Read .env.local
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Find DATABASE_URL
const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
if (!databaseUrlMatch) {
  console.log('❌ DATABASE_URL not found in .env.local');
  console.log('Please add DATABASE_URL=your_connection_string to your .env.local file');
  process.exit(1);
}

let databaseUrl = databaseUrlMatch[1].trim();

// Remove pooling parameters that cause the error
databaseUrl = databaseUrl.replace(/\?pgbouncer=true/g, '');
databaseUrl = databaseUrl.replace(/&pgbouncer=true/g, '');
databaseUrl = databaseUrl.replace(/\?pool_timeout=0/g, '');
databaseUrl = databaseUrl.replace(/&pool_timeout=0/g, '');

// Update the .env.local file
envContent = envContent.replace(/DATABASE_URL=.+/, `DATABASE_URL=${databaseUrl}`);

// Add connection parameters to prevent pooling issues
if (!databaseUrl.includes('?')) {
  databaseUrl += '?connection_limit=1&pool_timeout=0';
} else {
  databaseUrl += '&connection_limit=1&pool_timeout=0';
}

// Update with fixed URL
envContent = envContent.replace(/DATABASE_URL=.+/, `DATABASE_URL=${databaseUrl}`);

fs.writeFileSync(envPath, envContent);

console.log('✅ Fixed database connection');
console.log(`Updated DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);

console.log('\n🚀 Now try:');
console.log('npx prisma db push');
















