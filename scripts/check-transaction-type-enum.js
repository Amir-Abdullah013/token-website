const { databaseHelpers } = require('../src/lib/database');

async function checkTransactionTypeEnum() {
  try {
    // Check valid TransactionType enum values
    const enumResult = await databaseHelpers.pool.query(`
      SELECT unnest(enum_range(NULL::"TransactionType")) as type_value
    `);
    
    console.log('Valid TransactionType enum values:');
    enumResult.rows.forEach(row => {
      console.log(`- ${row.type_value}`);
    });
    
    // Check what transaction types exist in the database
    const transactionTypes = await databaseHelpers.pool.query(`
      SELECT type, COUNT(*) as count
      FROM transactions 
      GROUP BY type
      ORDER BY count DESC
    `);
    
    console.log('\nActual transaction types in database:');
    transactionTypes.rows.forEach(stat => {
      console.log(`- ${stat.type}: ${stat.count} transactions`);
    });
    
    // Check for any invalid transaction types
    const invalidTypes = await databaseHelpers.pool.query(`
      SELECT DISTINCT type
      FROM transactions 
      WHERE type::text NOT IN (
        SELECT unnest(enum_range(NULL::"TransactionType"))::text
      )
    `);
    
    if (invalidTypes.rows.length > 0) {
      console.log('\n❌ Invalid transaction types found:');
      invalidTypes.rows.forEach(row => {
        console.log(`- ${row.type}`);
      });
    } else {
      console.log('\n✅ All transaction types are valid');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await databaseHelpers.pool.end();
  }
}

checkTransactionTypeEnum();
