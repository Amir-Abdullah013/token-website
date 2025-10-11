const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUserRole(email) {
  try {
    console.log('🔍 Checking user role for:', email);
    
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleType: typeof user.role,
      roleLength: user.role?.length
    });

    // Update role to admin if it's not already
    if (user.role !== 'admin') {
      console.log('🔄 Updating role to admin...');
      await pool.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        ['admin', email]
      );
      console.log('✅ Role updated to admin');
    } else {
      console.log('✅ User already has admin role');
    }

  } catch (error) {
    console.error('❌ Error checking user role:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/check-user-role.js <email>');
  process.exit(1);
}

checkUserRole(email);