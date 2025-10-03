#!/usr/bin/env node

/**
 * Fix PostgreSQL connection pooling issue
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

// Find DATABASE_URL (handle both quoted and unquoted)
const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+?)(?:\r?\n|$)/);
if (!databaseUrlMatch) {
  console.log('❌ DATABASE_URL not found in .env.local');
  console.log('Please add DATABASE_URL=your_connection_string to your .env.local file');
  process.exit(1);
}

let databaseUrl = databaseUrlMatch[1].trim();
// Remove quotes if present
databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');

// Remove pooling parameters that cause the error
databaseUrl = databaseUrl.replace(/\?pgbouncer=true/g, '');
databaseUrl = databaseUrl.replace(/&pgbouncer=true/g, '');
databaseUrl = databaseUrl.replace(/\?pool_timeout=0/g, '');
databaseUrl = databaseUrl.replace(/&pool_timeout=0/g, '');

// Add parameters to prevent pooling issues
if (!databaseUrl.includes('?')) {
  databaseUrl += '?connection_limit=1&pool_timeout=0&prepared_statements=false';
} else {
  databaseUrl += '&connection_limit=1&pool_timeout=0&prepared_statements=false';
}

// Update the .env.local file (preserve quotes if they were there)
const originalLine = envContent.match(/DATABASE_URL=.+/)[0];
const hadQuotes = originalLine.includes('"') || originalLine.includes("'");
const newLine = hadQuotes ? `DATABASE_URL="${databaseUrl}"` : `DATABASE_URL=${databaseUrl}`;
envContent = envContent.replace(/DATABASE_URL=.+/, newLine);

fs.writeFileSync(envPath, envContent);

console.log('✅ Fixed database connection pooling issue');
console.log(`Updated DATABASE_URL with anti-pooling parameters`);

console.log('\n🚀 Now try:');
console.log('npx prisma db push');
