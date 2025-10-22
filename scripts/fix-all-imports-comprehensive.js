/**
 * Comprehensive Import Fix Script
 * Fixes all @/ imports to use correct relative paths
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
    
    // Calculate relative paths
    const libPath = path.relative(path.dirname(filePath), path.join(projectRoot, 'src', 'lib'));
    const componentsPath = path.relative(path.dirname(filePath), path.join(projectRoot, 'src', 'components'));
    
    const libImportPath = libPath.replace(/\\/g, '/');
    const componentsImportPath = componentsPath.replace(/\\/g, '/');
    
    // Fix @/lib/database imports
    if (content.includes("import { databaseHelpers } from '@/lib/database'")) {
      content = content.replace(
        /import { databaseHelpers } from '@\/lib\/database';/g,
        `import { databaseHelpers } from '${libImportPath}/database';`
      );
      modified = true;
    }
    
    // Fix @/lib/session imports
    if (content.includes("import { getServerSession } from '@/lib/session'")) {
      content = content.replace(
        /import { getServerSession } from '@\/lib\/session';/g,
        `import { getServerSession } from '${libImportPath}/session';`
      );
      modified = true;
    }
    
    // Fix @/lib/auth-context imports
    if (content.includes("import { useAuth } from '@/lib/auth-context'")) {
      content = content.replace(
        /import { useAuth } from '@\/lib\/auth-context';/g,
        `import { useAuth } from '${libImportPath}/auth-context';`
      );
      modified = true;
    }
    
    // Fix @/components imports
    if (content.includes("import { Button, Card, Input, Loader, Toast } from '@/components'")) {
      content = content.replace(
        /import { Button, Card, Input, Loader, Toast } from '@\/components';/g,
        `import { Button, Card, Input, Loader, Toast } from '${componentsImportPath}';`
      );
      modified = true;
    }
    
    // Fix @/components imports (other patterns)
    if (content.includes("import { Button, Card, Loader, Toast } from '@/components'")) {
      content = content.replace(
        /import { Button, Card, Loader, Toast } from '@\/components';/g,
        `import { Button, Card, Loader, Toast } from '${componentsImportPath}';`
      );
      modified = true;
    }
    
    // Fix @/components/GmailSwitchButton imports
    if (content.includes("import GmailSwitchButton from '@/components/GmailSwitchButton'")) {
      content = content.replace(
        /import GmailSwitchButton from '@\/components\/GmailSwitchButton';/g,
        `import GmailSwitchButton from '${componentsImportPath}/GmailSwitchButton';`
      );
      modified = true;
    }
    
    // Fix @/lib/session-clear imports
    if (content.includes("import { clearAllSessions } from '@/lib/session-clear'")) {
      content = content.replace(
        /import { clearAllSessions } from '@\/lib\/session-clear';/g,
        `import { clearAllSessions } from '${libImportPath}/session-clear';`
      );
      modified = true;
    }
    
    // Fix @/lib/gmail-switch imports
    if (content.includes("import { switchGmailAccount, forceFreshAuth } from '@/lib/gmail-switch'")) {
      content = content.replace(
        /import { switchGmailAccount, forceFreshAuth } from '@\/lib\/gmail-switch';/g,
        `import { switchGmailAccount, forceFreshAuth } from '${libImportPath}/gmail-switch';`
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
  console.log('🔧 Fixing all import issues...\n');
  
  const files = findFiles(projectRoot);
  console.log(`📁 Found ${files.length} files to check\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('🎉 All import fixes complete!');
}

// Run the script
main().catch(console.error);







