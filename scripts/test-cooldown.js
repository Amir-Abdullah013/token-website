/**
 * Test script to verify cooldown functionality
 * Run with: node scripts/test-cooldown.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Make sure .env.local file exists with DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const COOLDOWN_MINUTES = 30;

async function testCooldown(userId) {
  console.log('\n🔍 Testing Cooldown Functionality\n');
  console.log('User ID:', userId);
  console.log('Cooldown Period:', COOLDOWN_MINUTES, 'minutes\n');

  try {
    // 1. Check last ad
    console.log('1️⃣ Checking last ad watched...');
    const lastAdResult = await pool.query(
      `SELECT "createdAt", 
              NOW() as current_time,
              "createdAt" + INTERVAL '${COOLDOWN_MINUTES} minutes' as next_available,
              EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 as minutes_since,
              EXTRACT(EPOCH FROM ("createdAt" + INTERVAL '${COOLDOWN_MINUTES} minutes' - NOW())) / 60 as minutes_until_next
       FROM ad_rewards 
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC 
       LIMIT 1`,
      [userId]
    );

    if (lastAdResult.rows.length === 0) {
      console.log('✅ No previous ads found - user can watch immediately\n');
      return {
        canWatch: true,
        reason: 'No previous ads',
        nextAvailable: null
      };
    }

    const lastAd = lastAdResult.rows[0];
    console.log('   Last ad watched:', lastAd.createdAt);
    console.log('   Current time:', lastAd.current_time);
    console.log('   Next available:', lastAd.next_available);
    console.log('   Minutes since last ad:', Math.floor(lastAd.minutes_since));
    console.log('   Minutes until next ad:', Math.ceil(lastAd.minutes_until_next));

    // 2. Check if cooldown passed
    console.log('\n2️⃣ Checking cooldown status...');
    const now = new Date();
    const nextAvailable = new Date(lastAd.next_available);

    if (now >= nextAvailable) {
      console.log('✅ Cooldown passed - user can watch ad now');
      console.log('   Time passed:', Math.floor(lastAd.minutes_since), 'minutes');
      return {
        canWatch: true,
        reason: 'Cooldown passed',
        nextAvailable: null,
        lastWatched: lastAd.createdAt
      };
    } else {
      console.log('❌ Cooldown active - user must wait');
      console.log('   Time remaining:', Math.ceil(lastAd.minutes_until_next), 'minutes');
      return {
        canWatch: false,
        reason: 'Cooldown active',
        nextAvailable: lastAd.next_available,
        minutesRemaining: Math.ceil(lastAd.minutes_until_next),
        lastWatched: lastAd.createdAt
      };
    }

  } catch (error) {
    console.error('❌ Error testing cooldown:', error);
    throw error;
  }
}

async function getAllUserAds(userId) {
  console.log('\n📊 User Ad History\n');
  
  const result = await pool.query(
    `SELECT id, reward, status, "createdAt",
            LAG("createdAt") OVER (ORDER BY "createdAt") as previous_ad,
            EXTRACT(EPOCH FROM ("createdAt" - LAG("createdAt") OVER (ORDER BY "createdAt"))) / 60 as minutes_between
     FROM ad_rewards 
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 10`,
    [userId]
  );

  if (result.rows.length === 0) {
    console.log('No ads found for this user');
    return;
  }

  console.log(`Found ${result.rows.length} ad(s):\n`);
  result.rows.forEach((ad, index) => {
    console.log(`${index + 1}. ${ad.createdAt}`);
    console.log(`   Reward: ${ad.reward} points`);
    console.log(`   Status: ${ad.status}`);
    if (ad.minutes_between) {
      console.log(`   Time since previous: ${Math.floor(ad.minutes_between)} minutes`);
      if (ad.minutes_between < COOLDOWN_MINUTES) {
        console.log(`   ⚠️  WARNING: Less than ${COOLDOWN_MINUTES} minute cooldown!`);
      }
    }
    console.log('');
  });
}

async function testCooldownLogic() {
  console.log('═══════════════════════════════════════');
  console.log('   COOLDOWN FUNCTIONALITY TEST');
  console.log('═══════════════════════════════════════\n');

  // Get a user ID to test with
  const userResult = await pool.query(
    `SELECT DISTINCT "userId" 
     FROM ad_rewards 
     ORDER BY "userId" 
     LIMIT 1`
  );

  if (userResult.rows.length === 0) {
    console.log('❌ No ad rewards found in database');
    console.log('   Please watch at least one ad first\n');
    return;
  }

  const userId = userResult.rows[0].userId;

  // Run tests
  await getAllUserAds(userId);
  const result = await testCooldown(userId);

  console.log('\n═══════════════════════════════════════');
  console.log('   TEST RESULT');
  console.log('═══════════════════════════════════════\n');
  console.log('Can watch ad:', result.canWatch ? '✅ YES' : '❌ NO');
  console.log('Reason:', result.reason);
  if (result.nextAvailable) {
    console.log('Next available:', result.nextAvailable);
    console.log('Minutes remaining:', result.minutesRemaining);
  }
  if (result.lastWatched) {
    console.log('Last watched:', result.lastWatched);
  }
  console.log('');
}

// Run the test
testCooldownLogic()
  .then(() => {
    console.log('✅ Test completed successfully\n');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    pool.end();
    process.exit(1);
  });
