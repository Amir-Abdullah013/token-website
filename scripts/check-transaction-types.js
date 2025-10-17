#!/usr/bin/env node

const { databaseHelpers } = require('../src/lib/database');

async function checkTransactionTypes() {
  try {
    const result = await databaseHelpers.pool.query(`
      SELECT unnest(enum_range(NULL::"TransactionType")) as type
    `);
    
    console.log('Valid transaction types:', result.rows.map(r => r.type));
    
    // Also check existing transaction types in the database
    const existingTypes = await databaseHelpers.pool.query(`
      SELECT DISTINCT type FROM transactions ORDER BY type
    `);
    
    console.log('Existing transaction types in database:', existingTypes.rows.map(r => r.type));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

checkTransactionTypes();






