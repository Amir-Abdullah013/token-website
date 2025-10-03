const fs = require('fs');
const path = require('path');

// List of API routes that need to be fixed
const routesToFix = [
  'src/app/api/notifications/unread-count/route.js',
  'src/app/api/notifications/read-all/route.js',
  'src/app/api/notifications/[id]/read/route.js',
  'src/app/api/transactions/route.js',
  'src/app/api/wallet/route.js',
  'src/app/api/wallet/overview/route.js',
  'src/app/api/test-database/route.js',
  'src/app/api/setup-database/route.js'
];

// Function to fix a route file
function fixRoute(routePath) {
  try {
    if (!fs.existsSync(routePath)) {
      console.log(`Route not found: ${routePath}`);
      return;
    }

    let content = fs.readFileSync(routePath, 'utf8');
    
    // Remove direct prisma imports
    content = content.replace(/import\s*{\s*prisma\s*}\s*from\s*['"][^'"]*prisma\.js['"];?\s*/g, '');
    content = content.replace(/import\s*{\s*databaseHelpers\s*}\s*from\s*['"][^'"]*database\.js['"];?\s*/g, '');
    
    // Add dynamic import pattern
    if (content.includes('await prisma.') || content.includes('prisma.')) {
      // Add dynamic import at the beginning of the function
      content = content.replace(
        /export\s+async\s+function\s+(\w+)\s*\(/g,
        `export async function $1(`
      );
      
      // Add dynamic prisma loading
      content = content.replace(
        /(\s+try\s*{)/g,
        `$1
    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }`
      );
    }
    
    fs.writeFileSync(routePath, content);
    console.log(`Fixed: ${routePath}`);
  } catch (error) {
    console.error(`Error fixing ${routePath}:`, error.message);
  }
}

// Fix all routes
routesToFix.forEach(fixRoute);

console.log('Vercel build fixes applied!');
