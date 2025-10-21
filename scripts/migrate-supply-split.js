const { databaseHelpers } = require('../src/lib/database');

const migrateSupplySplit = async () => {
  try {
    console.log('🔄 Starting Supply Split Migration...');
    console.log('=====================================\n');

    // Step 1: Add new columns to token_supply
    console.log('📊 Step 1: Adding new columns to token_supply...');
    await databaseHelpers.pool.query(`
      ALTER TABLE token_supply 
      ADD COLUMN IF NOT EXISTS "userSupplyRemaining" BIGINT DEFAULT 2000000,
      ADD COLUMN IF NOT EXISTS "adminReserve" BIGINT DEFAULT 8000000
    `);
    console.log('✅ Columns added successfully');

    // Step 2: Update existing records
    console.log('\n📊 Step 2: Splitting existing supply (20% user, 80% admin)...');
    const updateResult = await databaseHelpers.pool.query(`
      UPDATE token_supply 
      SET 
        "userSupplyRemaining" = CAST("totalSupply" * 0.20 AS BIGINT),
        "adminReserve" = CAST("totalSupply" * 0.80 AS BIGINT),
        "updatedAt" = NOW()
      RETURNING *
    `);
    
    if (updateResult.rows.length > 0) {
      const supply = updateResult.rows[0];
      console.log('✅ Supply split completed:');
      console.log(`   Total Supply: ${supply.totalSupply}`);
      console.log(`   User Supply (20%): ${supply.userSupplyRemaining}`);
      console.log(`   Admin Reserve (80%): ${supply.adminReserve}`);
    }

    // Step 3: Create admin_supply_transfers table
    console.log('\n📊 Step 3: Creating admin_supply_transfers table...');
    await databaseHelpers.pool.query(`
      CREATE TABLE IF NOT EXISTS admin_supply_transfers (
        id TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "tokenSupplyId" INTEGER NOT NULL REFERENCES token_supply(id) ON DELETE CASCADE,
        amount BIGINT NOT NULL,
        "fromReserve" BIGINT NOT NULL,
        "toUserSupply" BIGINT NOT NULL,
        reason TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table created successfully');

    // Step 4: Create indexes
    console.log('\n📊 Step 4: Creating indexes...');
    await databaseHelpers.pool.query(`
      CREATE INDEX IF NOT EXISTS admin_supply_transfers_admin_id_idx 
      ON admin_supply_transfers("adminId")
    `);
    await databaseHelpers.pool.query(`
      CREATE INDEX IF NOT EXISTS admin_supply_transfers_created_at_idx 
      ON admin_supply_transfers("createdAt")
    `);
    console.log('✅ Indexes created successfully');

    // Step 5: Verify the migration
    console.log('\n📊 Step 5: Verifying migration...');
    const verifyResult = await databaseHelpers.pool.query(`
      SELECT * FROM token_supply ORDER BY id DESC LIMIT 1
    `);
    
    if (verifyResult.rows.length > 0) {
      const supply = verifyResult.rows[0];
      console.log('✅ Migration verified successfully:');
      console.log(`   Total Supply: ${supply.totalSupply} Von`);
      console.log(`   User Supply Remaining: ${supply.userSupplyRemaining} Von`);
      console.log(`   Admin Reserve: ${supply.adminReserve} Von`);
      console.log(`   Legacy Remaining Supply: ${supply.remainingSupply} Von`);
      
      // Validate the split
      const expectedUser = Number(supply.totalSupply) * 0.20;
      const expectedAdmin = Number(supply.totalSupply) * 0.80;
      
      if (Number(supply.userSupplyRemaining) === Math.floor(expectedUser) &&
          Number(supply.adminReserve) === Math.floor(expectedAdmin)) {
        console.log('\n✅ Supply split is correct (20% user, 80% admin)');
      } else {
        console.log('\n⚠️ Warning: Supply split may need adjustment');
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('=====================================');
    console.log('New token economy active:');
    console.log('  - User supply: 20% (for staking, referrals, buying)');
    console.log('  - Admin reserve: 80% (locked, requires admin unlock)');
    console.log('  - Buy-based inflation: REMOVED');
    console.log('  - Supply-based inflation: ACTIVE');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

migrateSupplySplit();



