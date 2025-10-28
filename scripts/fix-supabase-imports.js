/**
 * Fix Supabase Imports Script
 * Replaces all @/lib/supabase imports with proper auth-context imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Files to skip (these are scripts or documentation)
const skipFiles = [
  'scripts/fix-supabase-imports.js',
  'scripts/fix-all-remaining-imports.js',
  'scripts/fix-imports.js',
  'scripts/fix-all-imports.js',
  'MIGRATION_GUIDE.md'
];

// Find all JavaScript/TypeScript files
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        const relativePath = path.relative(projectRoot, fullPath);
        if (!skipFiles.includes(relativePath)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

// Fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: import { useAuth } from '../lib/auth-context';
    if (content.includes("import { authHelpers } from '@/lib/supabase'")) {
      content = content.replace(
        /import { authHelpers } from '@\/lib\/supabase';/g,
        "import { useAuth } from '../lib/auth-context';"
      );
      modified = true;
    }
    
    // Pattern 2: import { useAuth } from '../lib/auth-context';;
    if (content.includes("import { useAuth } from '../lib/auth-context';;")) {
      content = content.replace(
        /import { authHelpers } from '@\/lib\/supabase';;/g,
        "import { useAuth } from '../lib/auth-context';"
      );
      modified = true;
    }
    
    // Pattern 3: Dynamic import from @/lib/supabase
    if (content.includes("import('@/lib/supabase')")) {
      content = content.replace(
        /const authModule = await import\('@\/lib\/supabase'\);/g,
        "// Removed Supabase import - using session-based auth"
      );
      content = content.replace(
        /authHelpers = authModule\.authHelpers;/g,
        "// Removed authHelpers - using session-based auth"
      );
      modified = true;
    }
    
    // Pattern 4: authHelpers.getCurrentUser() calls
    if (content.includes('authHelpers.getCurrentUser()')) {
      content = content.replace(
        /const user = await authHelpers\.getCurrentUser\(\);/g,
        "const session = await getServerSession();\n    const user = session;"
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${path.relative(projectRoot, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Fixing Supabase imports...\n');
  
  const files = findFiles(projectRoot);
  console.log(`📁 Found ${files.length} files to check\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('🎉 Supabase import fixes complete!');
}

// Run the script
main().catch(console.error);















