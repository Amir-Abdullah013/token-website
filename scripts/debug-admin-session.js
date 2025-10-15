const { databaseHelpers } = require('../src/lib/database');

/**
 * Debug admin session and authentication issues
 */
async function debugAdminSession() {
  console.log('🔍 Debugging Admin Session Issues');
  console.log('================================\n');

  try {
    // Check if we have any admin users
    console.log('📋 Checking for admin users...');
    const adminUsers = await databaseHelpers.pool.query(`
      SELECT id, name, email, role, "emailVerified", "createdAt"
      FROM users 
      WHERE role = 'ADMIN'
      ORDER BY "createdAt" DESC
    `);

    if (adminUsers.rows.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('   This could be the cause of the 403 error');
      console.log('   The API requires an admin user to be authenticated');
      return;
    }

    console.log(`✅ Found ${adminUsers.rows.length} admin user(s):`);
    adminUsers.rows.forEach((admin, i) => {
      console.log(`   ${i+1}. ${admin.name} (${admin.email})`);
      console.log(`      Role: ${admin.role}`);
      console.log(`      Email Verified: ${admin.emailVerified}`);
      console.log(`      Created: ${new Date(admin.createdAt).toLocaleString()}`);
      console.log(`      ID: ${admin.id}\n`);
    });

    // Check user roles distribution
    console.log('📊 User roles distribution:');
    const roleStats = await databaseHelpers.pool.query(`
      SELECT role, COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY count DESC
    `);

    roleStats.rows.forEach(stat => {
      console.log(`   ${stat.role}: ${stat.count} users`);
    });

    console.log('\n🔧 Potential Solutions:');
    console.log('======================');
    console.log('1. Make sure you are logged in as an admin user');
    console.log('2. Check if the session is properly maintained');
    console.log('3. Verify the admin user has emailVerified = true');
    console.log('4. Check if cookies are being sent with requests');

    // Test the session API directly
    console.log('\n🧪 Testing session API...');
    try {
      const sessionTest = await databaseHelpers.pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u."emailVerified"
        FROM users u
        WHERE u.role = 'ADMIN'
        LIMIT 1
      `);

      if (sessionTest.rows.length > 0) {
        const testAdmin = sessionTest.rows[0];
        console.log(`✅ Test admin user found: ${testAdmin.name} (${testAdmin.email})`);
        console.log(`   Role: ${testAdmin.role}`);
        console.log(`   Email Verified: ${testAdmin.emailVerified}`);
        
        if (!testAdmin.emailVerified) {
          console.log('⚠️  WARNING: Admin user email is not verified!');
          console.log('   This might cause authentication issues');
        }
      }
    } catch (sessionError) {
      console.error('❌ Error testing session:', sessionError.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

debugAdminSession();