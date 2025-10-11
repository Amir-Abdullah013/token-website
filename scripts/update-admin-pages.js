const fs = require('fs');
const path = require('path');

// List of admin pages to update
const adminPages = [
  'src/app/admin/403/page.js',
  'src/app/admin/transfers/page.js',
  'src/app/admin/stakings/page.js',
  'src/app/admin/transactions/page.js',
  'src/app/admin/notifications/page.js',
  'src/app/admin/users/page.js',
  'src/app/admin/users/[id]/edit/page.js',
  'src/app/admin/users/create/page.js',
  'src/app/admin/profile/page.js'
];

function updateAdminPage(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update import statement
    if (content.includes("import { useAuth } from")) {
      content = content.replace(
        /import { useAuth } from ['"][^'"]*['"];?/g,
        "import { useAdminAuth } from '../../../lib/admin-auth';"
      );
      updated = true;
    }

    // Update useAuth() calls
    if (content.includes('useAuth()')) {
      content = content.replace(
        /const { ([^}]+) } = useAuth\(\);?/g,
        (match, destructured) => {
          // Replace common variable names
          let newDestructured = destructured
            .replace(/\buser\b/g, 'adminUser')
            .replace(/\bloading\b/g, 'isLoading')
            .replace(/\bisAuthenticated\b/g, 'isAuthenticated')
            .replace(/\bisAdmin\b/g, 'isAdmin');
          
          return `const { ${newDestructured} } = useAdminAuth();`;
        }
      );
      updated = true;
    }

    // Update variable references
    if (content.includes('user.')) {
      content = content.replace(/\buser\./g, 'adminUser.');
      updated = true;
    }

    if (content.includes('!loading')) {
      content = content.replace(/\b!loading\b/g, '!isLoading');
      updated = true;
    }

    if (content.includes('|| loading')) {
      content = content.replace(/\|\| loading\b/g, '|| isLoading');
      updated = true;
    }

    if (content.includes('&& loading')) {
      content = content.replace(/&& loading\b/g, '&& isLoading');
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

console.log('🔄 Updating admin pages to use admin authentication...\n');

adminPages.forEach(updateAdminPage);

console.log('\n✅ Admin pages update completed!');

