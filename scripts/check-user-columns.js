const { databaseHelpers } = require('../src/lib/database');

const checkUserColumns = async () => {
  try {
    console.log('🔍 Checking user table columns...');
    
    // Get table structure
    const result = await databaseHelpers.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 User table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if notification columns exist
    const notificationColumns = [
      'emailnotifications', 'smsnotifications', 'loginalerts',
      'pricealerts', 'tradenotifications', 'depositnotifications',
      'withdrawalnotifications', 'marketingemails', 'securityalerts',
      'twofactorenabled'
    ];
    
    console.log('\n🔍 Checking notification columns:');
    const existingColumns = result.rows.map(row => row.column_name.toLowerCase());
    
    notificationColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`  - ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking user columns:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
};

checkUserColumns();



