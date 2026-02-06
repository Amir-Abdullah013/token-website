// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);

const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=UTC' // Force UTC timezone
});

async function clearOldAds() {
  try {
    const userId = 'be6fcb2a-afa5-4866-b2d1-49e6d2df3d72';
    
    console.log('🗑️  Clearing old ad records for user:', userId);
    
    // Check current records first
    const checkResult = await pool.query(
      'SELECT COUNT(*), MAX("createdAt") as last_ad FROM ad_rewards WHERE "userId" = $1',
      [userId]
    );
    
    console.log('Current ad records:', checkResult.rows[0].count);
    console.log('Last ad timestamp:', checkResult.rows[0].last_ad);
    console.log('Database NOW():', new Date().toISOString());
    
    // Delete all old ad rewards
    const result = await pool.query(
      'DELETE FROM ad_rewards WHERE "userId" = $1 RETURNING id',
      [userId]
    );
    
    console.log('✅ Deleted', result.rowCount, 'old ad records');
    console.log('🎯 Next ad will have a fresh, correct timestamp!');
    console.log('⚠️  Note: Your locked points (160) are safe - only clearing cooldown!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

clearOldAds();
