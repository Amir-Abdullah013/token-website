/**
 * Script to regenerate missing staking reward entries in admin reserve history
 * 
 * This script:
 * 1. Finds all staking transactions that should have reserve history entries
 * 2. Checks which ones are missing
 * 3. Regenerates the missing entries based on transaction data
 * 
 * Usage: node scripts/regenerate-staking-reward-history.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function regenerateStakingRewardHistory() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting staking reward history regeneration...\n');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_reserve_history'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ admin_reserve_history table does not exist. Please run migration first.');
      process.exit(1);
    }

    // Get all transactions that represent staking rewards
    console.log('📊 Finding staking reward transactions...');
    const transactions = await client.query(`
      SELECT 
        t.id,
        t."userId",
        t.amount,
        t."createdAt",
        t.description,
        u.email as user_email,
        u.name as user_name
      FROM transactions t
      LEFT JOIN users u ON t."userId" = u.id
      WHERE t.type = 'STAKE_REWARD'
      AND t.status = 'COMPLETED'
      ORDER BY t."createdAt" ASC
    `);

    console.log(`✅ Found ${transactions.rows.length} staking reward transactions\n`);

    // Get existing reserve history entries for staking rewards
    const existingHistory = await client.query(`
      SELECT "referenceId", "userId", amount, "createdAt"
      FROM admin_reserve_history
      WHERE "transactionType" = 'STAKING_REWARD'
      AND "referenceId" IS NOT NULL
    `);

    const existingMap = new Map();
    existingHistory.rows.forEach(row => {
      // Use transaction ID as key if available, otherwise use userId + amount + date
      const key = row.referenceId || `${row.userId}_${row.amount}_${row.createdAt.toISOString().split('T')[0]}`;
      existingMap.set(key, true);
    });

    console.log(`📋 Found ${existingHistory.rows.length} existing reserve history entries\n`);

    // Find missing entries
    const missingEntries = [];
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of transactions.rows) {
      // Try to find corresponding staking record
      const stakingResult = await client.query(`
        SELECT id, "amountStaked", "rewardPercent", "durationDays", "startDate", "endDate"
        FROM staking
        WHERE "userId" = $1
        AND ABS(EXTRACT(EPOCH FROM ("createdAt" - $2))) < 3600
        ORDER BY ABS(EXTRACT(EPOCH FROM ("createdAt" - $2)))
        LIMIT 1
      `, [tx.userId, tx.createdAt]);

      const staking = stakingResult.rows[0];
      const referenceId = staking ? staking.id : null;

      // Check if this transaction already has a history entry
      const txKey = referenceId || `${tx.userId}_${tx.amount}_${tx.createdAt.toISOString().split('T')[0]}`;
      
      if (existingMap.has(txKey)) {
        skipped++;
        continue;
      }

      // Get token supply at the time of transaction (approximate)
      const tokenSupplyResult = await client.query(`
        SELECT "adminReserve"
        FROM token_supply
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `);

      if (tokenSupplyResult.rows.length === 0) {
        console.warn(`⚠️  No token supply found for transaction ${tx.id}`);
        errors++;
        continue;
      }

      // Estimate reserve before and after
      // We'll use current reserve as approximation since we don't have historical snapshots
      const currentReserve = Number(tokenSupplyResult.rows[0].adminReserve);
      const reserveBefore = currentReserve + Number(tx.amount); // Add back the reward amount
      const reserveAfter = currentReserve;

      missingEntries.push({
        transactionId: tx.id,
        userId: tx.userId,
        amount: -Number(tx.amount), // Negative for removal
        createdAt: tx.createdAt,
        referenceId: referenceId,
        reserveBefore: reserveBefore,
        reserveAfter: reserveAfter,
        purpose: tx.description || `Staking reward payout${staking ? ` (staking ID: ${staking.id})` : ''}`,
        userEmail: tx.user_email,
        userName: tx.user_name
      });
    }

    console.log(`📝 Found ${missingEntries.length} missing entries to regenerate\n`);

    if (missingEntries.length === 0) {
      console.log('✅ No missing entries found. All staking rewards are already logged!');
      return;
    }

    // Regenerate missing entries
    console.log('🔄 Regenerating missing entries...\n');
    
    await client.query('BEGIN');

    for (const entry of missingEntries) {
      try {
        const { randomUUID } = require('crypto');
        const historyId = randomUUID();

        await client.query(`
          INSERT INTO admin_reserve_history (
            id, "transactionType", amount, purpose, "userId", "adminId",
            "reserveBefore", "reserveAfter", "referenceId", "referenceType", "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          historyId,
          'STAKING_REWARD',
          entry.amount,
          entry.purpose,
          entry.userId,
          'SYSTEM',
          entry.reserveBefore,
          entry.reserveAfter,
          entry.referenceId,
          'STAKING_REWARD',
          entry.createdAt
        ]);

        processed++;
        console.log(`✅ Regenerated entry for transaction ${entry.transactionId} (User: ${entry.userEmail || entry.userId})`);
      } catch (error) {
        errors++;
        console.error(`❌ Error regenerating entry for transaction ${entry.transactionId}:`, error.message);
      }
    }

    await client.query('COMMIT');

    console.log('\n📊 Regeneration Summary:');
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Regeneration complete!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during regeneration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
regenerateStakingRewardHistory()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

