/**
 * Script to check and fix staking table integer columns
 * 
 * This script:
 * 1. Checks if daysRewarded and durationDays columns are INT type
 * 2. Fixes any decimal values in those columns
 * 3. Ensures all values are proper integers
 * 
 * Usage: node scripts/fix-staking-integer-columns.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixStakingIntegerColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking staking table column types...\n');

    // Check column types
    const columnCheck = await client.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'staking'
      AND column_name IN ('daysRewarded', 'durationDays')
      ORDER BY column_name
    `);

    console.log('📊 Column types found:');
    columnCheck.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}${col.numeric_precision ? `(${col.numeric_precision}, ${col.numeric_scale})` : ''}`);
    });

    // Check for any decimal values in integer columns
    console.log('\n🔍 Checking for invalid decimal values...');
    const decimalCheck = await client.query(`
      SELECT 
        id,
        "daysRewarded",
        "durationDays",
        "userId"
      FROM staking
      WHERE 
        ("daysRewarded"::text LIKE '%.%' OR "daysRewarded" IS NULL)
        OR ("durationDays"::text LIKE '%.%' OR "durationDays" IS NULL)
      ORDER BY "createdAt" DESC
    `);

    console.log(`📋 Found ${decimalCheck.rows.length} records with potential decimal/invalid values\n`);

    if (decimalCheck.rows.length > 0) {
      console.log('🔄 Fixing invalid values...\n');
      
      await client.query('BEGIN');

      let fixed = 0;
      for (const row of decimalCheck.rows) {
        try {
          // Fix daysRewarded - convert to integer
          let daysRewardedFixed = 0;
          if (row.daysRewarded !== null && row.daysRewarded !== undefined) {
            daysRewardedFixed = Math.floor(Math.abs(Number(row.daysRewarded) || 0));
          }

          // Fix durationDays - convert to integer
          let durationDaysFixed = 0;
          if (row.durationDays !== null && row.durationDays !== undefined) {
            durationDaysFixed = Math.floor(Math.abs(Number(row.durationDays) || 0));
          }

          await client.query(`
            UPDATE staking
            SET 
              "daysRewarded" = $1,
              "durationDays" = $2,
              "updatedAt" = NOW()
            WHERE id = $3
          `, [daysRewardedFixed, durationDaysFixed, row.id]);

          console.log(`✅ Fixed staking ${row.id}: daysRewarded=${row.daysRewarded} → ${daysRewardedFixed}, durationDays=${row.durationDays} → ${durationDaysFixed}`);
          fixed++;
        } catch (error) {
          console.error(`❌ Error fixing staking ${row.id}:`, error.message);
        }
      }

      await client.query('COMMIT');
      console.log(`\n✅ Fixed ${fixed} staking records\n`);
    } else {
      console.log('✅ No invalid values found. All integer columns contain valid integers.\n');
    }

    // Verify all values are now integers
    console.log('🔍 Verifying all values are integers...');
    const verifyCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "daysRewarded" = FLOOR("daysRewarded") THEN 1 END) as valid_days_rewarded,
        COUNT(CASE WHEN "durationDays" = FLOOR("durationDays") THEN 1 END) as valid_duration_days
      FROM staking
    `);

    const verify = verifyCheck.rows[0];
    console.log(`📊 Verification results:`);
    console.log(`   Total records: ${verify.total}`);
    console.log(`   Valid daysRewarded: ${verify.valid_days_rewarded}`);
    console.log(`   Valid durationDays: ${verify.valid_duration_days}`);

    if (parseInt(verify.valid_days_rewarded) === parseInt(verify.total) && 
        parseInt(verify.valid_duration_days) === parseInt(verify.total)) {
      console.log('\n✅ All values are valid integers!');
    } else {
      console.log('\n⚠️  Some values still need fixing. Consider running this script again.');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixStakingIntegerColumns()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

