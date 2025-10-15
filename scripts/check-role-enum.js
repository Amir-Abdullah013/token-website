const { databaseHelpers } = require('../src/lib/database');

async function checkRoleEnum() {
  try {
    const result = await databaseHelpers.pool.query(`
      SELECT unnest(enum_range(NULL::"Role")) as role_value
    `);
    
    console.log('Valid Role enum values:');
    result.rows.forEach(row => {
      console.log(`- ${row.role_value}`);
    });
    
    // Also check what roles exist in the users table
    const userRoles = await databaseHelpers.pool.query(`
      SELECT role, COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY count DESC
    `);
    
    console.log('\nActual roles in users table:');
    userRoles.rows.forEach(stat => {
      console.log(`- ${stat.role}: ${stat.count} users`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await databaseHelpers.pool.end();
  }
}

checkRoleEnum();
