import { databaseHelpers } from './database.js';

/**
 * Wallet Fee Service
 * Handles the 1-month free trial and $2 wallet fee system with referral exemption
 */

const WALLET_FEE_AMOUNT = 2; // $2 fee
const FREE_TRIAL_DAYS = 30; // 30-day free trial
const MINIMUM_REFERRAL_STAKE = 20; // $20 minimum stake for referral exemption

/**
 * Schedule wallet fee for a new user
 * Sets walletFeeDueAt to 30 days after signup
 * @param {Object} user - User object with createdAt date
 * @returns {Date} - The due date for the wallet fee
 */
export async function scheduleWalletFee(user) {
  try {
    const createdAt = new Date(user.createdAt);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + FREE_TRIAL_DAYS);

    await databaseHelpers.pool.query(`
      UPDATE users 
      SET "walletFeeDueAt" = $1, "updatedAt" = NOW()
      WHERE id = $2
    `, [dueDate, user.id]);

    console.log(`✅ Wallet fee scheduled for user ${user.id} on ${dueDate.toISOString()}`);
    return dueDate;
  } catch (error) {
    console.error('Error scheduling wallet fee:', error);
    throw error;
  }
}

/**
 * Check if user has met the referral exemption condition
 * User must have referred someone who staked at least $20 before the due date
 * @param {string} userId - User ID
 * @param {Date} dueDate - Wallet fee due date
 * @returns {boolean} - True if referral condition is met
 */
export async function checkReferralExemption(userId, dueDate) {
  try {
    // Find all users referred by this user
    const referredUsersResult = await databaseHelpers.pool.query(`
      SELECT r."referredId", r."createdAt" as "referralCreatedAt"
      FROM referrals r
      WHERE r."referrerId" = $1
    `, [userId]);

    if (referredUsersResult.rows.length === 0) {
      console.log(`No referrals found for user ${userId}`);
      return false;
    }

    // Check if any referred user has staked at least $20 before the due date
    for (const referral of referredUsersResult.rows) {
      const stakingsResult = await databaseHelpers.pool.query(`
        SELECT "amountStaked", "createdAt"
        FROM staking
        WHERE "userId" = $1 
          AND "amountStaked" >= $2
          AND "createdAt" <= $3
        LIMIT 1
      `, [referral.referredId, MINIMUM_REFERRAL_STAKE, dueDate]);

      if (stakingsResult.rows.length > 0) {
        console.log(`✅ Referral exemption met for user ${userId}: referred user ${referral.referredId} staked $${stakingsResult.rows[0].amountStaked}`);
        return true;
      }
    }

    console.log(`❌ Referral exemption not met for user ${userId}`);
    return false;
  } catch (error) {
    console.error('Error checking referral exemption:', error);
    throw error;
  }
}

/**
 * Process wallet fee for a specific user
 * Handles all logic: checking status, referral exemption, deduction, and locking
 * @param {string} userId - User ID to process
 * @returns {Object} - Result object with status and details
 */
export async function processWalletFeeForUser(userId) {
  let client;
  try {
    client = await databaseHelpers.pool.connect();
    await client.query('BEGIN');

    // Get user details
    const userResult = await client.query(`
      SELECT id, "createdAt", "walletFeeDueAt", "walletFeeProcessed", 
             "walletFeeWaived", "walletFeeLocked"
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const user = userResult.rows[0];
    const now = new Date();

    // Skip if already processed
    if (user.walletFeeProcessed) {
      await client.query('COMMIT');
      return {
        status: user.walletFeeWaived ? 'waived' : 'charged',
        message: 'Wallet fee already processed',
        alreadyProcessed: true
      };
    }

    // Check if due date has passed
    if (!user.walletFeeDueAt || new Date(user.walletFeeDueAt) > now) {
      await client.query('COMMIT');
      return {
        status: 'pending',
        message: 'Wallet fee not yet due',
        dueDate: user.walletFeeDueAt
      };
    }

    // Check referral exemption
    const exemptionMet = await checkReferralExemption(userId, new Date(user.walletFeeDueAt));
    
    if (exemptionMet) {
      // Waive the fee
      await client.query(`
        UPDATE users 
        SET "walletFeeWaived" = true, 
            "walletFeeProcessed" = true,
            "walletFeeLocked" = false,
            "walletFeeProcessedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');
      
      // Create notification
      await databaseHelpers.notifications.createNotification({
        userId,
        title: 'Wallet Fee Waived! 🎉',
        message: 'Congratulations! Your wallet fee has been waived because you referred a user who staked at least $20 within 30 days.',
        type: 'SUCCESS'
      });

      console.log(`✅ Wallet fee waived for user ${userId}`);
      return {
        status: 'waived',
        message: 'Wallet fee waived due to referral exemption',
        exemptionMet: true
      };
    }

    // Get user's wallet balance
    const walletResult = await client.query(`
      SELECT balance FROM wallets WHERE "userId" = $1
    `, [userId]);

    if (walletResult.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const wallet = walletResult.rows[0];
    const currentBalance = parseFloat(wallet.balance);

    // Check if user has sufficient balance
    if (currentBalance < WALLET_FEE_AMOUNT) {
      // Insufficient balance - lock wallet
      await client.query(`
        UPDATE users 
        SET "walletFeeLocked" = true,
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');

      // Create notification
      await databaseHelpers.notifications.createNotification({
        userId,
        title: 'Wallet Locked - Payment Required',
        message: `Your wallet has been locked because the $${WALLET_FEE_AMOUNT} monthly fee is due but you have insufficient balance. Please deposit at least $${WALLET_FEE_AMOUNT} to unlock your wallet.`,
        type: 'WARNING'
      });

      console.log(`⚠️ Wallet locked for user ${userId} - insufficient balance`);
      return {
        status: 'locked',
        message: 'Wallet locked due to insufficient balance',
        requiredAmount: WALLET_FEE_AMOUNT,
        currentBalance
      };
    }

    // Deduct the fee
    const newBalance = currentBalance - WALLET_FEE_AMOUNT;
    
    await client.query(`
      UPDATE wallets 
      SET balance = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
      WHERE "userId" = $2
    `, [newBalance, userId]);

    // Get admin wallet for fee receiver
    const adminWalletResult = await client.query(`
      SELECT w."userId" 
      FROM wallets w
      INNER JOIN users u ON w."userId" = u.id
      WHERE u."isAdmin" = true
      LIMIT 1
    `);

    const feeReceiverId = adminWalletResult.rows.length > 0 
      ? adminWalletResult.rows[0].userId 
      : 'ADMIN_WALLET';

    // Add fee to admin wallet
    if (adminWalletResult.rows.length > 0) {
      await client.query(`
        UPDATE wallets 
        SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
      `, [WALLET_FEE_AMOUNT, feeReceiverId]);
    }

    // Create transaction record
    const { randomUUID } = await import('crypto');
    const transactionId = randomUUID();
    
    await client.query(`
      INSERT INTO transactions (
        id, "userId", type, amount, currency, status, 
        description, "feeAmount", "feeReceiverId", "netAmount",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, 'WALLET_FEE', $3, 'USD', 'COMPLETED', $4, $5, $6, $7, NOW(), NOW())
    `, [
      transactionId,
      userId,
      WALLET_FEE_AMOUNT,
      'One-time wallet fee after 30-day trial period',
      WALLET_FEE_AMOUNT,
      feeReceiverId,
      0 // netAmount is 0 for fee transactions
    ]);

    // Mark fee as processed
    await client.query(`
      UPDATE users 
      SET "walletFeeProcessed" = true,
          "walletFeeLocked" = false,
          "walletFeeProcessedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
    `, [userId]);

    await client.query('COMMIT');

    // Create notification
    await databaseHelpers.notifications.createNotification({
      userId,
      title: 'Wallet Fee Charged',
      message: `A one-time wallet fee of $${WALLET_FEE_AMOUNT} has been deducted from your wallet. Your new balance is $${newBalance.toFixed(2)}.`,
      type: 'INFO'
    });

    console.log(`✅ Wallet fee charged for user ${userId}: $${WALLET_FEE_AMOUNT}`);
    return {
      status: 'charged',
      message: 'Wallet fee successfully charged',
      feeAmount: WALLET_FEE_AMOUNT,
      previousBalance: currentBalance,
      newBalance
    };

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error processing wallet fee:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Process all users whose wallet fee is due
 * Used by cron job for batch processing
 * @returns {Object} - Summary of processed users
 */
export async function processAllDueWalletFees() {
  try {
    const now = new Date();
    
    // Get all users whose wallet fee is due but not yet processed
    const usersResult = await databaseHelpers.pool.query(`
      SELECT id, email, "walletFeeDueAt"
      FROM users
      WHERE "walletFeeDueAt" <= $1
        AND "walletFeeProcessed" = false
    `, [now]);

    const users = usersResult.rows;
    console.log(`📋 Found ${users.length} users with due wallet fees`);

    const results = {
      total: users.length,
      charged: 0,
      waived: 0,
      locked: 0,
      errors: 0,
      details: []
    };

    for (const user of users) {
      try {
        const result = await processWalletFeeForUser(user.id);
        
        if (result.status === 'charged') {
          results.charged++;
        } else if (result.status === 'waived') {
          results.waived++;
        } else if (result.status === 'locked') {
          results.locked++;
        }

        results.details.push({
          userId: user.id,
          email: user.email,
          status: result.status,
          message: result.message
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          message: error.message
        });
        console.error(`Error processing wallet fee for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Wallet fee processing complete:`, results);
    return results;
  } catch (error) {
    console.error('Error processing wallet fees:', error);
    throw error;
  }
}

/**
 * Check if user can perform wallet action
 * Returns false if wallet is locked due to unpaid fee
 * @param {string} userId - User ID
 * @returns {Object} - { allowed: boolean, reason: string }
 */
export async function checkWalletActionAllowed(userId) {
  try {
    const userResult = await databaseHelpers.pool.query(`
      SELECT "walletFeeLocked", "walletFeeProcessed", "walletFeeDueAt"
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return { allowed: false, reason: 'User not found' };
    }

    const user = userResult.rows[0];

    if (user.walletFeeLocked) {
      return {
        allowed: false,
        reason: `Wallet locked - please deposit $${WALLET_FEE_AMOUNT} to unlock`,
        requiredAmount: WALLET_FEE_AMOUNT
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking wallet action:', error);
    throw error;
  }
}

/**
 * Handle wallet fee waiver when referral condition is met
 * Called when a referred user stakes >= $20
 * @param {string} referrerId - ID of the user who made the referral
 * @returns {boolean} - True if fee was waived, false if already processed
 */
export async function handleReferralFeeWaiver(referrerId) {
  try {
    const userResult = await databaseHelpers.pool.query(`
      SELECT "walletFeeProcessed", "walletFeeDueAt"
      FROM users
      WHERE id = $1
    `, [referrerId]);

    if (userResult.rows.length === 0) {
      console.log(`User ${referrerId} not found`);
      return false;
    }

    const user = userResult.rows[0];
    const now = new Date();

    // Only waive if not already processed and still within the trial period
    if (!user.walletFeeProcessed && user.walletFeeDueAt && new Date(user.walletFeeDueAt) > now) {
      await databaseHelpers.pool.query(`
        UPDATE users 
        SET "walletFeeWaived" = true,
            "walletFeeProcessed" = true,
            "walletFeeLocked" = false,
            "walletFeeProcessedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `, [referrerId]);

      // Create notification
      await databaseHelpers.notifications.createNotification({
        userId: referrerId,
        title: 'Wallet Fee Waived! 🎉',
        message: 'Congratulations! Your wallet fee has been waived because your referral staked at least $20.',
        type: 'SUCCESS'
      });

      console.log(`✅ Wallet fee waived for referrer ${referrerId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error handling referral fee waiver:', error);
    throw error;
  }
}

export default {
  scheduleWalletFee,
  checkReferralExemption,
  processWalletFeeForUser,
  processAllDueWalletFees,
  checkWalletActionAllowed,
  handleReferralFeeWaiver,
  WALLET_FEE_AMOUNT,
  FREE_TRIAL_DAYS,
  MINIMUM_REFERRAL_STAKE
};


