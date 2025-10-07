#!/usr/bin/env node

/**
 * Final fix for PostgreSQL connection pooling issue
 */

const fs = require('fs');

console.log('🔧 Fixing PostgreSQL connection pooling issue...');

// Read .env.local
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Use regex to find and replace DATABASE_URL
const databaseUrlRegex = /DATABASE_URL=(.+?)(?:\r?\n|$)/;
const match = envContent.match(databaseUrlRegex);

if (!match) {
  console.log('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

let databaseUrl = match[1].trim();
console.log('Found DATABASE_URL:', databaseUrl);

// Remove quotes if present
databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');

// Remove existing pooling parameters
databaseUrl = databaseUrl.replace(/\?.*$/, '');

// Add anti-pooling parameters
databaseUrl += '?connection_limit=1&pool_timeout=0&prepared_statements=false';

// Replace in content
const newContent = envContent.replace(databaseUrlRegex, `DATABASE_URL="${databaseUrl}"`);

// Write back to file
fs.writeFileSync(envPath, newContent);

console.log('✅ Fixed database connection pooling issue');
console.log('Updated DATABASE_URL with anti-pooling parameters');

console.log('\n🚀 Now try:');
console.log('npx prisma db push');









