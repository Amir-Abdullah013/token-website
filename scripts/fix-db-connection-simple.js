#!/usr/bin/env node

/**
 * Simple fix for PostgreSQL connection pooling issue
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

// Find and replace DATABASE_URL
const lines = envContent.split('\n');
let updated = false;

console.log('Debug: Lines found:');
lines.forEach((line, index) => {
  if (line.includes('DATABASE_URL')) {
    console.log(`Line ${index}: "${line}"`);
  }
});

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('DATABASE_URL=')) {
    let databaseUrl = lines[i].substring('DATABASE_URL='.length).trim();
    
    // Remove quotes if present
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '');
    
    // Remove existing pooling parameters
    databaseUrl = databaseUrl.replace(/\?.*$/, '');
    
    // Add anti-pooling parameters
    databaseUrl += '?connection_limit=1&pool_timeout=0&prepared_statements=false';
    
    // Update the line
    lines[i] = `DATABASE_URL="${databaseUrl}"`;
    updated = true;
    break;
  }
}

if (!updated) {
  console.log('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Write back to file
const newContent = lines.join('\n');
fs.writeFileSync(envPath, newContent);

console.log('✅ Fixed database connection pooling issue');
console.log('Updated DATABASE_URL with anti-pooling parameters');

console.log('\n🚀 Now try:');
console.log('npx prisma db push');
