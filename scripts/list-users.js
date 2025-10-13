const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listUsers() {
  try {
    console.log('👥 Listing all users in the database:');
    
    const result = await pool.query(
      'SELECT id, email, name, role, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 10'
    );

    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`\n📊 Found ${result.rows.length} users:\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`);
      console.log(`   Role: "${user.role}" (${typeof user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await pool.end();
  }
}

listUsers();


