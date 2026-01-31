const { Pool } = require('pg');
const { config } = require('dotenv');
const { randomUUID } = require('crypto');
const path = require('path');

// Load env
config({ path: path.join(__dirname, '../.env.local') });

// Parse DATABASE_URL
const urlObj = new URL(process.env.DATABASE_URL);
const dbConfig = {
  host: urlObj.hostname,
  port: parseInt(urlObj.port) || 5432,
  database: urlObj.pathname.slice(1),
  user: urlObj.username,
  password: urlObj.password,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(dbConfig);

async function testPlanPurchase() {
  const userId = 'be6fcb2a-afa5-4866-b2d1-49e6d2df3d72'; // The user ID from logs
  const planAmount = 10;
  const client = await pool.connect();

  try {
    console.log('--- STARTING MANUAL TEST TRANSACTION ---');
    console.log('User ID:', userId);
    console.log('Plan Amount:', planAmount);

    // Check Initial State
    const initialWallet = await client.query('SELECT balance, "stakingTokensAmount" FROM wallets WHERE "userId" = $1', [userId]);
    console.log('Initial Wallet State:', initialWallet.rows[0]);

    if (!initialWallet.rows[0]) {
        console.error('Wallet not found for user!');
        return;
    }

    const currentBalance = parseFloat(initialWallet.rows[0].balance);
    if (currentBalance < planAmount) {
        console.error('Insufficient balance for test!');
        // We will force update balance for test purposes
        console.log('Forcing balance update to 100 for test...');
        await client.query('UPDATE wallets SET balance = 100 WHERE "userId" = $1', [userId]);
    }

    await client.query('BEGIN');
    console.log('BEGIN Transaction');

    // 1. Deduct USD from User
    const deductResult = await client.query(
      'UPDATE wallets SET balance = (balance::numeric - $1), "updatedAt" = NOW() WHERE "userId" = $2 RETURNING balance',
      [planAmount, userId]
    );
    console.log('Deduct Result:', deductResult.rows[0]);
    console.log('RowCount:', deductResult.rowCount);

    // 2. Add Tokens
    const tokensBought = 100; // Mock amount
    const tokenAddResult = await client.query(
      'UPDATE wallets SET "stakingTokensAmount" = (COALESCE("stakingTokensAmount"::numeric, 0) + $1), "updatedAt" = NOW() WHERE "userId" = $2 RETURNING "stakingTokensAmount"',
      [tokensBought, userId]
    );
    console.log('Token Add Result:', tokenAddResult.rows[0]);

    // 3. Insert Transaction
    const txId = randomUUID();
    const insertTx = await client.query(`
        INSERT INTO transactions (
          id, "userId", type, amount, currency, status, gateway, 
          description, "feeAmount", "netAmount", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, 'BUY', $3, 'USD', 'COMPLETED', 'PLAN_PURCHASE', 
          'Manual Test Purchase', 0, $3, NOW(), NOW()
        ) RETURNING id
      `, [txId, userId, planAmount]);
    console.log('Transaction Inserted:', insertTx.rows[0]);

    await client.query('COMMIT');
    console.log('✅ COMMIT Successful');

    // Verify
    const verifyWallet = await client.query('SELECT balance, "stakingTokensAmount" FROM wallets WHERE "userId" = $1', [userId]);
    console.log('Final Wallet State:', verifyWallet.rows[0]);

    const verifyTx = await client.query('SELECT * FROM transactions WHERE id = $1', [txId]);
    console.log('Final Transaction Found:', verifyTx.rows.length > 0);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ ROLLBACK ERROR:', e);
  } finally {
    client.release();
    pool.end();
  }
}

testPlanPurchase();
