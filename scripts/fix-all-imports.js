const fs = require('fs');
const path = require('path');

// Function to recursively find all route files
function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.js') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix a route file
function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove problematic static imports
    const importPatterns = [
      /import\s*{\s*[^}]*}\s*from\s*['"]@\/lib\/database['"];?\s*/g,
      /import\s*{\s*[^}]*}\s*from\s*['"]@\/lib\/supabase['"];?\s*/g,
      /import\s*{\s*[^}]*}\s*from\s*['"][^'"]*prisma\.js['"];?\s*/g,
      /import\s*{\s*[^}]*}\s*from\s*['"][^'"]*database\.js['"];?\s*/g,
      /import\s*{\s*prisma\s*}\s*from\s*['"][^'"]*['"];?\s*/g,
      /import\s*{\s*databaseHelpers\s*}\s*from\s*['"][^'"]*['"];?\s*/g,
      /import\s*{\s*authHelpers\s*}\s*from\s*['"][^'"]*['"];?\s*/g,
      /import\s*{\s*supabase\s*}\s*from\s*['"][^'"]*['"];?\s*/g
    ];
    
    importPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // Add dynamic import helper if needed
    if (content.includes('databaseHelpers.') || content.includes('authHelpers.') || content.includes('prisma.') || content.includes('supabase.')) {
      // Add dynamic import helper at the beginning of the first function
      const functionMatch = content.match(/export\s+async\s+function\s+(\w+)\s*\(/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const functionStart = content.indexOf(`export async function ${functionName}(`);
        
        // Insert dynamic import helper after the function declaration
        const insertPoint = content.indexOf('{', functionStart) + 1;
        const dynamicImportHelper = `
    // Dynamic import helper
    const loadModules = async () => {
      const modules = {};
      try {
        if (content.includes('databaseHelpers.')) {
          const dbModule = await import('@/lib/database');
          modules.databaseHelpers = dbModule.databaseHelpers;
        }
        if (content.includes('authHelpers.')) {
          // Removed Supabase import - using session-based auth
          modules.// Removed authHelpers - using session-based auth
        }
        if (content.includes('prisma.')) {
          const prismaModule = await import('@/lib/prisma');
          modules.prisma = prismaModule.prisma;
        }
        if (content.includes('supabase.')) {
          const supabaseModule = await import('@/lib/supabase');
          modules.supabase = supabaseModule.supabase;
        }
      } catch (error) {
        console.warn('Modules not available:', error.message);
        throw new Error('Required modules not available');
      }
      return modules;
    };
    
    const { databaseHelpers, authHelpers, prisma, supabase } = await loadModules();
`;
        
        content = content.slice(0, insertPoint) + dynamicImportHelper + content.slice(insertPoint);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Find and fix all route files
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files to check...`);

routeFiles.forEach(fixRouteFile);

console.log('All route files have been processed!');