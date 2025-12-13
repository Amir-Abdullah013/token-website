require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { execSync } = require('child_process');

/**
 * Complete fix for Prisma db push issues
 * Handles constraint errors and shadow database issues
 */

async function fixPrismaIssues() {
  console.log('🔧 Fixing Prisma database push issues...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // Step 1: Fix duplicate referralCode values
    console.log('📋 Step 1: Checking for duplicate referralCode values...');
    const duplicatesResult = await pool.query(`
      SELECT "referralCode", COUNT(*) as count
      FROM users
      WHERE "referralCode" IS NOT NULL
      GROUP BY "referralCode"
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length > 0) {
      console.log(`⚠️  Found ${duplicatesResult.rows.length} duplicate(s), fixing...`);
      
      for (const dup of duplicatesResult.rows) {
        const usersResult = await pool.query(`
          SELECT id, email, "createdAt"
          FROM users
          WHERE "referralCode" = $1
          ORDER BY "createdAt" ASC
        `, [dup.referralCode]);

        const users = usersResult.rows;
        if (users.length > 1) {
          const keepUser = users[0];
          for (const user of users.slice(1)) {
            await pool.query(`
              UPDATE users
              SET "referralCode" = NULL, "updatedAt" = NOW()
              WHERE id = $1
            `, [user.id]);
          }
        }
      }
      console.log('✅ Duplicates fixed\n');
    } else {
      console.log('✅ No duplicates found\n');
    }

    // Step 2: Drop existing constraint
    console.log('📋 Step 2: Dropping existing referralCode constraint...');
    try {
      await pool.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS "users_referralCode_key"
      `);
      console.log('✅ Constraint dropped (if it existed)\n');
    } catch (error) {
      console.log(`ℹ️  Constraint drop: ${error.message}\n`);
    }

    // Step 3: Check for other referralCode constraints
    console.log('📋 Step 3: Checking for other referralCode constraints...');
    const allConstraints = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
        AND conname LIKE '%referralCode%'
    `);
    
    if (allConstraints.rows.length > 0) {
      console.log(`Found ${allConstraints.rows.length} constraint(s):`);
      for (const constraint of allConstraints.rows) {
        try {
          await pool.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS "${constraint.conname}"
          `);
          console.log(`   ✅ Dropped: ${constraint.conname}`);
        } catch (e) {
          console.log(`   ⚠️  Could not drop ${constraint.conname}`);
        }
      }
      console.log('');
    } else {
      console.log('✅ No other constraints found\n');
    }

    console.log('✅ Database is ready for Prisma db push!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx prisma db push');
    console.log('   2. Run: npx prisma generate\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixPrismaIssues()
  .then(() => {
    console.log('✅ All fixes applied successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });





