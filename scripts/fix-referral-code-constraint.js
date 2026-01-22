require('dotenv').config();
const { Pool } = require('pg');

/**
 * Fix referralCode constraint issue
 * This script safely handles the existing constraint without affecting referral or plan logic
 */

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

const fixReferralCodeConstraint = async () => {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    return;
  }

  const pool = new Pool(dbConfig);

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database successfully');

    // Check if the constraint already exists
    console.log('🔍 Checking for existing referralCode constraint...');
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
        AND constraint_name = 'users_referralCode_key'
        AND constraint_type = 'UNIQUE';
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('✅ Constraint "users_referralCode_key" already exists');
      console.log('📝 This is expected - the constraint is already in the database');
      console.log('💡 You can now run: npx prisma migrate resolve --applied <migration_name>');
      console.log('   OR use: npx prisma db push (which will skip creating existing constraints)');
    } else {
      console.log('⚠️ Constraint does not exist - this is unexpected');
      console.log('📝 Creating constraint...');
      
      // Check if column exists
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'referralCode';
      `);

      if (columnCheck.rows.length === 0) {
        console.log('📝 Adding referralCode column...');
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN "referralCode" TEXT;
        `);
        console.log('✅ referralCode column added');
      }

      // Create unique constraint
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode");
      `);
      console.log('✅ Constraint created successfully');
    }

    // Verify referral system integrity
    console.log('\n🔍 Verifying referral system integrity...');
    
    // Check referrerId column
    const referrerIdCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'referrerId';
    `);
    
    if (referrerIdCheck.rows.length > 0) {
      console.log('✅ referrerId column exists');
    } else {
      console.log('⚠️ referrerId column missing - adding it...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "referrerId" TEXT;
      `);
      console.log('✅ referrerId column added');
    }

    // Check hasReferredOne column
    const hasReferredCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'hasReferredOne';
    `);
    
    if (hasReferredCheck.rows.length > 0) {
      console.log('✅ hasReferredOne column exists');
    } else {
      console.log('⚠️ hasReferredOne column missing - adding it...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "hasReferredOne" BOOLEAN DEFAULT false;
      `);
      console.log('✅ hasReferredOne column added');
    }

    // Check plan_purchases table
    const planPurchasesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'plan_purchases';
    `);
    
    if (planPurchasesCheck.rows.length > 0) {
      console.log('✅ plan_purchases table exists');
    } else {
      console.log('⚠️ plan_purchases table missing - will be created by migration');
    }

    // Check lockedPlanTokensAmount column in wallets
    const lockedTokensCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wallets' 
        AND column_name = 'lockedPlanTokensAmount';
    `);
    
    if (lockedTokensCheck.rows.length > 0) {
      console.log('✅ lockedPlanTokensAmount column exists');
    } else {
      console.log('⚠️ lockedPlanTokensAmount column missing - will be created by migration');
    }

    client.release();
    console.log('\n✅ All checks completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npx prisma db push (recommended - it will skip existing constraints)');
    console.log('   OR');
    console.log('   2. If using migrations: npx prisma migrate resolve --applied <migration_name>');
    console.log('   OR');
    console.log('   3. Create a new migration: npx prisma migrate dev --name fix_constraints');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 The constraint already exists - this is fine!');
      console.log('   You can safely use: npx prisma db push');
    }
  } finally {
    await pool.end();
  }
};

fixReferralCodeConstraint();

