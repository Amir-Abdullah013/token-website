require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

/**
 * Fix duplicate referralCode values before applying unique constraint
 * This script should be run before `npx prisma db push`
 */

async function fixReferralCodeDuplicates() {
  console.log('🔧 Fixing duplicate referralCode values...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // Step 1: Find duplicates
    const duplicatesResult = await pool.query(`
      SELECT "referralCode", COUNT(*) as count
      FROM users
      WHERE "referralCode" IS NOT NULL
      GROUP BY "referralCode"
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No duplicate referralCode values found!');
      console.log('✅ Safe to run: npx prisma db push\n');
      return;
    }

    console.log(`⚠️  Found ${duplicatesResult.rows.length} duplicate referralCode value(s):\n`);

    // Step 2: Fix duplicates (keep the oldest one, set others to NULL)
    for (const dup of duplicatesResult.rows) {
      console.log(`   Fixing: "${dup.referralCode}" (${dup.count} duplicates)`);
      
      // Get all users with this referralCode, ordered by creation date
      const usersResult = await pool.query(`
        SELECT id, email, "createdAt", "referralCode"
        FROM users
        WHERE "referralCode" = $1
        ORDER BY "createdAt" ASC
      `, [dup.referralCode]);

      const users = usersResult.rows;
      
      // Keep the first one (oldest), set others to NULL
      if (users.length > 1) {
        const keepUser = users[0];
        const updateUsers = users.slice(1);

        console.log(`      ✅ Keeping for: ${keepUser.email} (created: ${keepUser.createdAt})`);
        
        for (const user of updateUsers) {
          await pool.query(`
            UPDATE users
            SET "referralCode" = NULL, "updatedAt" = NOW()
            WHERE id = $1
          `, [user.id]);
          console.log(`      ❌ Removed from: ${user.email} (created: ${user.createdAt})`);
        }
      }
    }

    // Step 3: Verify no duplicates remain
    const verifyResult = await pool.query(`
      SELECT "referralCode", COUNT(*) as count
      FROM users
      WHERE "referralCode" IS NOT NULL
      GROUP BY "referralCode"
      HAVING COUNT(*) > 1
    `);

    if (verifyResult.rows.length === 0) {
      console.log('\n✅ All duplicates fixed!');
      console.log('✅ Safe to run: npx prisma db push\n');
    } else {
      console.log('\n❌ Some duplicates still remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixReferralCodeDuplicates()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


