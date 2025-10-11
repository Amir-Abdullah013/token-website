const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function makeUserAdmin(email) {
  try {
    console.log('🔍 Making user admin:', email);
    
    // First, check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.log('❌ User not found with email:', email);
      return;
    }

    const user = checkResult.rows[0];
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      currentRole: user.role
    });

    // Update role to admin (using correct enum value)
    const updateResult = await pool.query(
      'UPDATE users SET role = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING *',
      ['ADMIN', email]
    );

    if (updateResult.rows.length > 0) {
      const updatedUser = updateResult.rows[0];
      console.log('✅ User role updated successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        newRole: updatedUser.role
      });
    } else {
      console.log('❌ Failed to update user role');
    }

  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/make-admin.js <email>');
  console.log('Example: node scripts/make-admin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(email);