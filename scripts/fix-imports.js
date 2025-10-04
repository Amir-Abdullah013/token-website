#!/usr/bin/env node

/**
 * Script to fix all imports from old appwrite file to new database/supabase files
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Import Statements');
console.log('==========================\n');

// Files to update (excluding documentation files)
const filesToUpdate = [
  'src/app/**/*.js',
  'src/components/**/*.js',
  'src/lib/**/*.js',
  'src/middleware.js'
];

let totalFiles = 0;
let updatedFiles = 0;

filesToUpdate.forEach(pattern => {
  const files = glob.sync(pattern);
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath) && !filePath.includes('node_modules')) {
      totalFiles++;
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Fix imports from lib/appwrite
      if (content.includes("from '../lib/appwrite'") || content.includes("from '@/lib/appwrite'")) {
        content = content.replace(
          /import\s*{\s*([^}]+)\s*}\s*from\s*['"]\.\.\/lib\/appwrite['"]/g,
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
                  imp.includes('setting')) {
                databaseImports.push(imp);
              } else {
                authImports.push(imp);
              }
            });
            
            // Create new import statements
            if (databaseImports.length > 0) {
              newImports.push(`import { ${databaseImports.join(', ')} } from '../lib/database';`);
            }
            if (authImports.length > 0) {
              newImports.push(`import { ${authImports.join(', ')} } from '../lib/supabase';`);
            }
            
            return newImports.join('\n');
          }
        );
        
        // Fix @/lib/appwrite imports
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
                  imp.includes('setting')) {
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
          content.includes('transactionHelpers.') || content.includes('adminHelpers.')) {
        
        // Replace notificationHelpers with databaseHelpers.notifications
        content = content.replace(/notificationHelpers\./g, 'databaseHelpers.notifications.');
        content = content.replace(/walletHelpers\./g, 'databaseHelpers.wallets.');
        content = content.replace(/transactionHelpers\./g, 'databaseHelpers.transactions.');
        content = content.replace(/adminHelpers\./g, 'databaseHelpers.admin.');
        
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
      }
    }
  });
});

console.log(`\n📊 Summary:`);
console.log(`Total files checked: ${totalFiles}`);
console.log(`Files updated: ${updatedFiles}`);
console.log(`\n✨ Import fixes completed!`);






