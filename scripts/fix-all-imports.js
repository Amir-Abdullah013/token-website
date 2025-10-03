#!/usr/bin/env node

/**
 * Script to fix all imports from old appwrite file to new database/supabase files
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing All Import Statements');
console.log('================================\n');

// List of files that need to be updated
const filesToUpdate = [
  'src/app/test-admin-logs/page.js',
  'src/app/test-notifications/page.js',
  'src/app/test-security/page.js',
  'src/app/test-system-settings/page.js',
  'src/app/user/notifications/[id]/page.js',
  'src/app/user/notifications/page.js',
  'src/app/user/security/page.js',
  'src/app/user/support/create/page.js',
  'src/app/user/support/page.js',
  'src/app/user/deposit/confirm/page.js',
  'src/app/user/withdraw/confirm/page.js',
  'src/app/admin/deposits/page.js',
  'src/app/admin/profile/page.js',
  'src/app/admin/withdrawals/page.js',
  'src/app/auth/callback/page.js',
  'src/app/auth/reset-password/page.js',
  'src/app/user/profile/page.js',
  'src/app/user/transactions/page.js',
  'src/app/user/withdraw/page.js',
  'src/app/test-oauth-flow/page.js',
  'src/app/admin/logs/page.js',
  'src/app/admin/notifications/create/page.js',
  'src/app/admin/notifications/page.js',
  'src/app/admin/settings/page.js'
];

let totalFiles = 0;
let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    totalFiles++;
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix imports from @/lib/appwrite
    if (content.includes("from '@/lib/appwrite'")) {
      // Replace the import statement
      content = content.replace(
        /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/appwrite['"]/g,
        (match, imports) => {
          const importList = imports.split(',').map(imp => imp.trim());
          let newImports = [];
          
          // Categorize imports
          const databaseImports = [];
          const authImports = [];
          
          importList.forEach(imp => {
            if (imp.includes('database') || imp.includes('Database') || 
                imp.includes('notification') || imp.includes('wallet') || 
                imp.includes('transaction') || imp.includes('admin') || 
                imp.includes('support') || imp.includes('price') || 
                imp.includes('setting') || imp.includes('system')) {
              databaseImports.push(imp);
            } else {
              authImports.push(imp);
            }
          });
          
          // Create new import statements
          if (databaseImports.length > 0) {
            newImports.push(`import { ${databaseImports.join(', ')} } from '@/lib/database';`);
          }
          if (authImports.length > 0) {
            newImports.push(`import { ${authImports.join(', ')} } from '@/lib/supabase';`);
          }
          
          return newImports.join('\n');
        }
      );
      
      hasChanges = true;
    }
    
    // Fix usage of old helper functions
    if (content.includes('notificationHelpers.') || content.includes('walletHelpers.') || 
        content.includes('transactionHelpers.') || content.includes('adminHelpers.') ||
        content.includes('supportTicketHelpers.') || content.includes('systemSettingsHelpers.')) {
      
      // Replace helper function calls
      content = content.replace(/notificationHelpers\./g, 'databaseHelpers.notifications.');
      content = content.replace(/walletHelpers\./g, 'databaseHelpers.wallets.');
      content = content.replace(/transactionHelpers\./g, 'databaseHelpers.transactions.');
      content = content.replace(/adminHelpers\./g, 'databaseHelpers.admin.');
      content = content.replace(/supportTicketHelpers\./g, 'databaseHelpers.support.');
      content = content.replace(/systemSettingsHelpers\./g, 'databaseHelpers.settings.');
      
      hasChanges = true;
    }
    
    // Fix user ID references (from $id to id)
    if (content.includes('user.$id') || content.includes('currentUser.$id')) {
      content = content.replace(/user\.\$id/g, 'user.id');
      content = content.replace(/currentUser\.\$id/g, 'currentUser.id');
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      updatedFiles++;
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⚪ No changes needed: ${filePath}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Total files processed: ${totalFiles}`);
console.log(`Files updated: ${updatedFiles}`);
console.log(`\n✨ Import fixes completed!`);


