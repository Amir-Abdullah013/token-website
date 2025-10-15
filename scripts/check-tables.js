const { databaseHelpers } = require('../src/lib/database');

async function checkTables() {
  try {
    const result = await databaseHelpers.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await databaseHelpers.pool.end();
  }
}

checkTables();



