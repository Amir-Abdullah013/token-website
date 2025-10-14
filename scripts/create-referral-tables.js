const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Parse DATABASE_URL to handle special characters in password
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

const createReferralTables = async () => {
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

    // Create referrals table
    console.log('📋 Creating referrals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        "referrerId" TEXT NOT NULL,
        "referredId" TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_referrals_referrer FOREIGN KEY ("referrerId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_referrals_referred FOREIGN KEY ("referredId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_referral UNIQUE ("referrerId", "referredId")
      );
    `);
    console.log('✅ Referrals table created');

    // Create referral_earnings table
    console.log('💰 Creating referral_earnings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_earnings (
        id TEXT PRIMARY KEY,
        "referralId" TEXT NOT NULL,
        "stakingId" TEXT,
        amount DECIMAL(15,2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_referral_earnings_referral FOREIGN KEY ("referralId") REFERENCES referrals(id) ON DELETE CASCADE,
        CONSTRAINT fk_referral_earnings_staking FOREIGN KEY ("stakingId") REFERENCES staking(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ Referral earnings table created');

    // Add referrerId column to users table if it doesn't exist
    console.log('👤 Adding referrerId column to users table...');
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "referrerId" TEXT;
      `);
      console.log('✅ ReferrerId column added to users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ ReferrerId column already exists');
      } else {
        throw error;
      }
    }

    // Add foreign key constraint for referrerId
    try {
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_referrer 
        FOREIGN KEY ("referrerId") REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key constraint added for referrerId');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.log('⚠️ Could not add foreign key constraint (may already exist)');
      }
    }

    // Add profit column to staking table if it doesn't exist
    console.log('🏦 Adding profit column to staking table...');
    try {
      await client.query(`
        ALTER TABLE staking ADD COLUMN IF NOT EXISTS profit DECIMAL(15,2);
      `);
      console.log('✅ Profit column added to staking table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Profit column already exists');
      } else {
        throw error;
      }
    }

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals("referrerId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals("referredId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral ON referral_earnings("referralId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_referrer ON users("referrerId");
    `);
    console.log('✅ Indexes created');

    console.log('🎉 All referral system tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating referral tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the script
createReferralTables()
  .then(() => {
    console.log('✅ Database setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
