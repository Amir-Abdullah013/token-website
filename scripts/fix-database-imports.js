/**
 * Fix Database Imports Script
 * Replaces all @/lib/database imports with correct relative paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

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
        files.push(fullPath);
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
    
    // Calculate relative path to database.js
    const relativePath = path.relative(path.dirname(filePath), path.join(projectRoot, 'src', 'lib', 'database.js'));
    const importPath = relativePath.replace(/\\/g, '/').replace(/\.js$/, '');
    
    // Pattern 1: import { databaseHelpers } from '../src/lib/database';
    if (content.includes("import { databaseHelpers } from '@/lib/database'")) {
      content = content.replace(
        /import { databaseHelpers } from '@\/lib\/database';/g,
        `import { databaseHelpers } from '${importPath}';`
      );
      modified = true;
    }
    
    // Pattern 2: import { databaseHelpers } from '../src/lib/database';
    if (content.includes("import { databaseHelpers } from '@/lib/database'")) {
      content = content.replace(
        /import { databaseHelpers } from '@\/lib\/database';/g,
        `import { databaseHelpers } from '${importPath}';`
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed database import in: ${path.relative(projectRoot, filePath)}`);
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
  console.log('🔧 Fixing database imports...\n');
  
  const files = findFiles(projectRoot);
  console.log(`📁 Found ${files.length} files to check\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('🎉 Database import fixes complete!');
}

// Run the script
main().catch(console.error);


