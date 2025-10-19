/**
 * Initialize Wallet Fees for Existing Users
 * 
 * This script sets walletFeeDueAt for users who were created before
 * the wallet fee system was implemented.
 * 
 * Run with: node scripts/initialize-wallet-fees.js
 */

import dotenv from 'dotenv';
import { databaseHelpers } from '../src/lib/database.js';

dotenv.config();

const FREE_TRIAL_DAYS = 30;

async function initializeWalletFees() {
  console.log('🚀 Starting wallet fee initialization...\n');

  try {
    // Get all users without walletFeeDueAt set
    const result = await databaseHelpers.pool.query(`
      SELECT id, email, "createdAt", "walletFeeDueAt"
      FROM users
      WHERE "walletFeeDueAt" IS NULL
      ORDER BY "createdAt" ASC
    `);

    const users = result.rows;
    console.log(`📋 Found ${users.length} users without wallet fee due date\n`);

    if (users.length === 0) {
      console.log('✅ All users already have wallet fee dates set!');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Calculate due date based on user's creation date
        const createdAt = new Date(user.createdAt);
        const dueDate = new Date(createdAt);
        dueDate.setDate(dueDate.getDate() + FREE_TRIAL_DAYS);

        // Update user
        await databaseHelpers.pool.query(`
          UPDATE users
          SET "walletFeeDueAt" = $1,
              "updatedAt" = NOW()
          WHERE id = $2
        `, [dueDate, user.id]);

        console.log(`✅ ${user.email}: Due date set to ${dueDate.toISOString().split('T')[0]}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total users processed: ${users.length}`);
    console.log(`  Successfully updated: ${updated}`);
    console.log(`  Errors: ${errors}`);

    // Show statistics
    const stats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE "walletFeeDueAt" <= NOW() AND "walletFeeProcessed" = false) as overdue,
        COUNT(*) FILTER (WHERE "walletFeeDueAt" > NOW() AND "walletFeeProcessed" = false) as pending,
        COUNT(*) FILTER (WHERE "walletFeeProcessed" = true AND "walletFeeWaived" = true) as waived,
        COUNT(*) FILTER (WHERE "walletFeeProcessed" = true AND "walletFeeWaived" = false) as charged
      FROM users
    `);

    console.log('\n📈 Current Wallet Fee Status:');
    console.log(`  Overdue (needs processing): ${stats.rows[0].overdue}`);
    console.log(`  Pending (in trial): ${stats.rows[0].pending}`);
    console.log(`  Waived (referral success): ${stats.rows[0].waived}`);
    console.log(`  Charged (fee paid): ${stats.rows[0].charged}`);

    if (stats.rows[0].overdue > 0) {
      console.log('\n⚠️  There are overdue fees that need processing.');
      console.log('   Run the cron job or call /api/cron/process-wallet-fees');
    }

    console.log('\n✅ Wallet fee initialization complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the script
initializeWalletFees().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});


