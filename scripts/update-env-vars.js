#!/usr/bin/env node

/**
 * Script to help update environment variables from Appwrite to Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Environment Variables Migration Helper');
console.log('========================================\n');

// Check if .env.local exists
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('Please create a .env.local file with the following variables:');
  console.log('');
  console.log('DATABASE_URL=your_supabase_project_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  console.log('');
  process.exit(1);
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📋 Current Environment Variables:');
console.log('================================');

// Check for old Appwrite variables
const oldVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'NEXT_PUBLIC_APPWRITE_PROJECT_NAME'
];

const newVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL'
];

let hasOldVars = false;
let hasNewVars = false;

lines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key] = line.split('=');
    if (oldVars.includes(key)) {
      console.log(`⚠️  Found old Appwrite variable: ${key}`);
      hasOldVars = true;
    }
    if (newVars.includes(key)) {
      console.log(`✅ Found new Supabase variable: ${key}`);
      hasNewVars = true;
    }
  }
});

console.log('');

if (hasOldVars) {
  console.log('🔄 Migration needed:');
  console.log('==================');
  console.log('');
  console.log('Remove these old Appwrite variables:');
  oldVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('');
  console.log('Add these new Supabase variables:');
  newVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('');
  console.log('Example .env.local file:');
  console.log('========================');
  console.log('DATABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  console.log('');
} else if (hasNewVars) {
  console.log('✅ Environment variables are already migrated!');
  console.log('');
  console.log('Current Supabase variables:');
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=');
      if (newVars.includes(key)) {
        console.log(`  ✅ ${key}`);
      }
    }
  });
} else {
  console.log('❌ No environment variables found');
  console.log('Please add the required Supabase variables to your .env.local file');
}

console.log('');
console.log('📚 Next Steps:');
console.log('==============');
console.log('1. Update your .env.local file with the new variables');
console.log('2. Run: npm run db:generate');
console.log('3. Run: npm run db:push');
console.log('4. Test your application');
console.log('');
console.log('🎉 Migration helper completed!');
