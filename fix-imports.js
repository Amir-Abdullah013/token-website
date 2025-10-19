#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing import paths...');

// Find all JavaScript files in src directory
const findFiles = (dir, files = []) => {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (item.endsWith('.js') && !item.includes('node_modules')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const files = findFiles('./src');

let fixedCount = 0;

for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix relative imports to lib directory
    const libImportRegex = /from\s+['"]\.\.\/.*?lib\/([^'"]+)['"]/g;
    const libMatches = content.match(libImportRegex);
    
    if (libMatches) {
      for (const match of libMatches) {
        const newImport = match.replace(/from\s+['"]\.\.\/.*?lib\/([^'"]+)['"]/, "from '@/lib/$1'");
        content = content.replace(match, newImport);
        modified = true;
      }
    }
    
    // Fix relative imports to components directory
    const componentImportRegex = /from\s+['"]\.\.\/.*?components\/([^'"]+)['"]/g;
    const componentMatches = content.match(componentImportRegex);
    
    if (componentMatches) {
      for (const match of componentMatches) {
        const newImport = match.replace(/from\s+['"]\.\.\/.*?components\/([^'"]+)['"]/, "from '@/components/$1'");
        content = content.replace(match, newImport);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✅ Fixed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
console.log('🔧 Running build to check for remaining issues...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build still has issues. Check the output above.');
}
