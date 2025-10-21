/**
 * Fix Auth Context Imports Script
 * Replaces all @/lib/auth-context imports with correct relative paths
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
    
    // Calculate relative path to auth-context.js
    const relativePath = path.relative(path.dirname(filePath), path.join(projectRoot, 'src', 'lib', 'auth-context.js'));
    const importPath = relativePath.replace(/\\/g, '/').replace(/\.js$/, '');
    
    // Pattern 1: import { useAuth } from '../src/lib/auth-context';
    if (content.includes("import { useAuth } from '@/lib/auth-context'")) {
      content = content.replace(
        /import { useAuth } from '@\/lib\/auth-context';/g,
        `import { useAuth } from '${importPath}';`
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed auth-context import in: ${path.relative(projectRoot, filePath)}`);
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
  console.log('🔧 Fixing auth-context imports...\n');
  
  const files = findFiles(projectRoot);
  console.log(`📁 Found ${files.length} files to check\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('🎉 Auth-context import fixes complete!');
}

// Run the script
main().catch(console.error);






