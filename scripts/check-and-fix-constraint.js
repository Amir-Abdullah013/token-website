require('dotenv').config();
const { Pool } = require('pg');

const parseDatabaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      password: urlObj.password,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

const checkAndFix = async () => {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    return;
  }

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🔍 Checking database state...\n');

    // 1. Check if constraint already exists
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
        AND constraint_name = 'users_referralCode_key'
        AND constraint_type = 'UNIQUE';
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('✅ Constraint "users_referralCode_key" already exists in database');
      console.log('💡 This means Prisma is trying to create an existing constraint\n');
    } else {
      console.log('⚠️ Constraint does not exist - will be created\n');
    }

    // 2. Check for duplicate referralCode values
    const duplicates = await client.query(`
      SELECT "referralCode", COUNT(*) as count
      FROM users
      WHERE "referralCode" IS NOT NULL
      GROUP BY "referralCode"
      HAVING COUNT(*) > 1;
    `);

    if (duplicates.rows.length > 0) {
      console.log('⚠️ Found duplicate referralCode values:');
      duplicates.rows.forEach(row => {
        console.log(`   - "${row.referralCode}": ${row.count} occurrences`);
      });
      console.log('\n💡 These need to be fixed before adding unique constraint\n');
    } else {
      console.log('✅ No duplicate referralCode values found\n');
    }

    // 3. Check null referralCode values
    const nullCount = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE "referralCode" IS NULL OR "referralCode" = '';
    `);
    console.log(`📊 Users with null/empty referralCode: ${nullCount.rows[0].count}`);

    // 4. Check total users
    const totalUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);
    console.log(`📊 Total users: ${totalUsers.rows[0].count}\n`);

    // 5. Solution recommendation
    if (constraintCheck.rows.length > 0) {
      console.log('✅ SOLUTION: The constraint already exists!');
      console.log('   You can safely use: npx prisma db push --accept-data-loss');
      console.log('   OR mark the migration as applied if using migrations\n');
    } else if (duplicates.rows.length === 0) {
      console.log('✅ SOLUTION: No duplicates found, safe to proceed');
      console.log('   Run: npx prisma db push --accept-data-loss\n');
    } else {
      console.log('⚠️ SOLUTION: Fix duplicates first, then run migration');
      console.log('   You may need to update duplicate referralCode values\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

checkAndFix();

