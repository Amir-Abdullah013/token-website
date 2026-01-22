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

const fixConstraint = async () => {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    return;
  }

  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    console.log('🔍 Thoroughly checking for constraint/index...\n');

    // Check all constraints on users table
    const allConstraints = await client.query(`
      SELECT 
        constraint_name, 
        constraint_type,
        table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'users'
        AND (constraint_name LIKE '%referralCode%' OR constraint_name LIKE '%referral%');
    `);

    console.log('📋 All referral-related constraints:');
    if (allConstraints.rows.length > 0) {
      allConstraints.rows.forEach(row => {
        console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
      });
    } else {
      console.log('   None found');
    }

    // Check all indexes on users table
    const allIndexes = await client.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'users'
        AND (indexname LIKE '%referralCode%' OR indexname LIKE '%referral%');
    `);

    console.log('\n📋 All referral-related indexes:');
    if (allIndexes.rows.length > 0) {
      allIndexes.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
        console.log(`     ${row.indexdef}`);
      });
    } else {
      console.log('   None found');
    }

    // Check specifically for users_referralCode_key
    const specificCheck = await client.query(`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'users_referralCode_key';
    `);

    if (specificCheck.rows.length > 0) {
      console.log('\n✅ Found constraint: users_referralCode_key');
      console.log('💡 Solution: Drop and recreate, or mark migration as applied\n');
      
      // Ask if we should drop it
      console.log('🔄 Dropping existing constraint to allow Prisma to recreate it...');
      try {
        await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_referralCode_key";`);
        console.log('✅ Constraint dropped successfully');
        console.log('💡 Now you can run: npx prisma db push --accept-data-loss\n');
      } catch (dropError) {
        if (dropError.message.includes('does not exist')) {
          console.log('⚠️ Constraint already removed or doesn\'t exist');
        } else {
          throw dropError;
        }
      }
    } else {
      // Check if it's an index instead
      const indexCheck = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = 'users_referralCode_key';
      `);

      if (indexCheck.rows.length > 0) {
        console.log('\n✅ Found index: users_referralCode_key');
        console.log('🔄 Dropping index to allow Prisma to create constraint...');
        try {
          await client.query(`DROP INDEX IF EXISTS "users_referralCode_key";`);
          console.log('✅ Index dropped successfully');
          console.log('💡 Now you can run: npx prisma db push --accept-data-loss\n');
        } catch (dropError) {
          console.log('⚠️ Could not drop index:', dropError.message);
        }
      } else {
        console.log('\n⚠️ Constraint/index not found with exact name');
        console.log('💡 This might be a Prisma migration state issue');
        console.log('   Try: npx prisma migrate reset (WARNING: deletes data)');
        console.log('   OR: npx prisma migrate resolve --applied <migration_name>\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

fixConstraint();

