#!/usr/bin/env node

/**
 * Migration script to help transition from Appwrite to Supabase + Prisma
 * This script provides guidance and checks for the migration process
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase + Prisma Migration Helper');
console.log('=====================================\n');

// Check if required files exist
const requiredFiles = [
  'prisma/schema.prisma',
  'src/lib/supabase.js',
  'src/lib/prisma.js',
  'src/lib/database.js'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all migration files are in place.');
  process.exit(1);
}

// Check package.json for required dependencies
console.log('\n📦 Checking package.json dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredDeps = [
  '@supabase/supabase-js',
  '@prisma/client',
  'prisma'
];

const missingDeps = requiredDeps.filter(dep => {
  if (dep === 'prisma') {
    return !packageJson.devDependencies?.[dep];
  }
  return !packageJson.dependencies?.[dep];
});

if (missingDeps.length > 0) {
  console.log('❌ Missing dependencies:', missingDeps.join(', '));
  console.log('Run: npm install');
} else {
  console.log('✅ All required dependencies are present');
}

// Check for environment variables
console.log('\n🔧 Environment Variables Setup:');
console.log('Create a .env.local file with the following variables:');
console.log('');
console.log('DATABASE_URL=your_supabase_project_url');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
console.log('');

// Migration steps
console.log('📝 Migration Steps:');
console.log('1. Set up Supabase project at https://supabase.com');
console.log('2. Create a new PostgreSQL database');
console.log('3. Add environment variables to .env.local');
console.log('4. Run: npm run db:generate');
console.log('5. Run: npm run db:push');
console.log('6. Run: npm run db:seed (optional)');
console.log('7. Test your application');
console.log('');

// API route updates needed
console.log('🔄 API Routes that need updating:');
const apiRoutes = [
  'src/app/api/notifications/route.js',
  'src/app/api/notifications/read-all/route.js',
  'src/app/api/notifications/[id]/read/route.js'
];

apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    const content = fs.readFileSync(route, 'utf8');
    if (content.includes('@/lib/appwrite')) {
      console.log(`⚠️  ${route} - Still imports from appwrite`);
    } else {
      console.log(`✅ ${route} - Updated`);
    }
  }
});

console.log('\n🎉 Migration helper completed!');
console.log('Check the SUPABASE_SETUP.md file for detailed instructions.');

