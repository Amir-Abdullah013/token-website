#!/usr/bin/env node

/**
 * Script to check if all environment variables have been migrated from Appwrite to Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Migration Check');
console.log('=====================================\n');

// Files to check for old Appwrite variables
const filesToCheck = [
  'setup-db.js',
  'setup-helper.js',
  'README.md',
  'DATABASE_SETUP_INSTRUCTIONS.md',
  'ENVIRONMENT_SETUP.md',
  'src/lib/config.js',
  'src/lib/session.js',
  'src/lib/supabase.js',
  'middleware.js',
  'src/app/debug-env/page.js',
  'src/app/test-oauth/page.js',
  'src/app/api/auth/logout/route.js'
];

// Old Appwrite variables to check for
const oldVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'NEXT_PUBLIC_APPWRITE_PROJECT_NAME'
];

// New Supabase variables
const newVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let totalFiles = 0;
let migratedFiles = 0;
let filesWithOldVars = 0;

console.log('📋 Checking files for environment variable migration...\n');

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf8');
    
    let hasOldVars = false;
    let hasNewVars = false;
    
    // Check for old variables
    oldVars.forEach(varName => {
      if (content.includes(varName)) {
        hasOldVars = true;
      }
    });
    
    // Check for new variables
    newVars.forEach(varName => {
      if (content.includes(varName)) {
        hasNewVars = true;
      }
    });
    
    if (hasOldVars) {
      filesWithOldVars++;
      console.log(`❌ ${filePath} - Still contains old Appwrite variables`);
    } else if (hasNewVars) {
      migratedFiles++;
      console.log(`✅ ${filePath} - Successfully migrated to Supabase variables`);
    } else {
      console.log(`⚪ ${filePath} - No environment variables found`);
    }
  } else {
    console.log(`⚠️  ${filePath} - File not found`);
  }
});

console.log('\n📊 Migration Summary:');
console.log('====================');
console.log(`Total files checked: ${totalFiles}`);
console.log(`Successfully migrated: ${migratedFiles}`);
console.log(`Files with old variables: ${filesWithOldVars}`);
console.log(`Migration progress: ${Math.round((migratedFiles / totalFiles) * 100)}%`);

if (filesWithOldVars === 0) {
  console.log('\n🎉 All files have been successfully migrated!');
  console.log('✅ No old Appwrite environment variables found');
  console.log('✅ All files are using the new Supabase variables');
} else {
  console.log('\n⚠️  Some files still contain old Appwrite variables');
  console.log('Please update the remaining files to use the new Supabase variables');
}

console.log('\n📝 Required Environment Variables:');
console.log('==================================');
console.log('DATABASE_URL=https://your-project.supabase.co');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID');

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Update your .env.local file with the new variables');
console.log('2. Run: npm run db:generate');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run db:seed (optional)');
console.log('5. Test your application');

console.log('\n✨ Migration check completed!');














