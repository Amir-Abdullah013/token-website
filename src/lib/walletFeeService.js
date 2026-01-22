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
 * User must have referred at least 1 person within 30 days of account creation
 * AND the referred user must have made a deposit OR created a staking
 * @param {string} userId - User ID
 * @param {Date} accountCreatedAt - Account creation date
 * @param {Object} client - Optional database client for transaction support
 * @returns {boolean} - True if referral condition is met
 */
export async function checkReferralExemption(userId, accountCreatedAt, client = null) {
  try {
    // Calculate 30-day window from account creation
    const thirtyDaysLater = new Date(accountCreatedAt);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + FREE_TRIAL_DAYS);

    // Use provided client or get new connection
    const queryClient = client || databaseHelpers.pool;

    // Check if user has referred at least 1 person within 30 days
    // AND the referred user has made a completed deposit OR created a staking
    const referralResult = await queryClient.query(`
      SELECT COUNT(DISTINCT r.id) as referral_count
      FROM referrals r
      WHERE r."referrerId" = $1
        AND r."createdAt" >= $2
        AND r."createdAt" <= $3
        AND (
          -- Check if referred user has made a completed deposit
          EXISTS (
            SELECT 1 
            FROM transactions t
            WHERE t."userId" = r."referredId"
              AND t.type = 'DEPOSIT'
              AND t.status = 'COMPLETED'
              AND t."createdAt" <= $3
          )
          OR
          -- Check if referred user has created a staking
          EXISTS (
            SELECT 1
            FROM staking s
            WHERE s."userId" = r."referredId"
              AND s."createdAt" <= $3
          )
        )
    `, [userId, accountCreatedAt, thirtyDaysLater]);

    const referralCount = parseInt(referralResult.rows[0]?.referral_count || 0);

    if (referralCount >= 1) {
      console.log(`✅ Referral exemption met for user ${userId}: referred ${referralCount} user(s) with valid deposits/stakes within 30 days`);
      return true;
    }

    console.log(`❌ Referral exemption not met for user ${userId}: only ${referralCount} valid referral(s) within 30 days`);
    return false;
  } catch (error) {
    console.error('Error checking referral exemption:', error);
    throw error;
  }
}

/**
 * Process wallet fee for a specific user
 * Handles all logic: first deposit check, referral exemption, deduction, and locking
 * @param {string} userId - User ID to process
 * @returns {Object} - Result object with status and details
 */
export async function processWalletFeeForUser(userId) {
  let client;
  try {
    client = await databaseHelpers.pool.connect();
    await client.query('BEGIN');

    // Get user details with FOR UPDATE lock to prevent race conditions
    const userResult = await client.query(`
      SELECT id, "createdAt", "walletFeeDueAt", "walletFeeProcessed", 
             "walletFeeWaived", "walletFeeLocked", "walletFeeApplied", "firstDepositAmount"
      FROM users
      WHERE id = $1
      FOR UPDATE
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const user = userResult.rows[0];
    const now = new Date();
    const accountCreatedAt = new Date(user.createdAt);

    // Skip if already processed
    if (user.walletFeeProcessed || user.walletFeeApplied) {
      await client.query('COMMIT');
      return {
        status: user.walletFeeWaived ? 'waived' : 'charged',
        message: 'Wallet fee already processed',
        alreadyProcessed: true
      };
    }

    // RULE A: Check if first deposit > $10 → permanently exempt
    if (user.firstDepositAmount !== null && user.firstDepositAmount !== undefined && user.firstDepositAmount > 10) {
      // User is permanently exempt - mark as waived
      await client.query(`
        UPDATE users 
        SET "walletFeeWaived" = true, 
            "walletFeeProcessed" = true,
            "walletFeeApplied" = false,
            "walletFeeLocked" = false,
            "walletFeeProcessedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');
      
      console.log(`✅ User ${userId} permanently exempt from wallet fee (first deposit: $${user.firstDepositAmount})`);
      return {
        status: 'waived',
        message: 'Permanently exempt from wallet fee (first deposit > $10)',
        exemptionReason: 'first_deposit_over_10'
      };
    }

    // RULE B: First deposit < $10 - apply 30-day timer and referral check
    // Calculate 30 days from account creation
    const thirtyDaysLater = new Date(accountCreatedAt);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + FREE_TRIAL_DAYS);

    // Check if 30 days have passed
    if (now < thirtyDaysLater) {
      await client.query('COMMIT');
      return {
        status: 'pending',
        message: 'Wallet fee not yet due (30-day period not completed)',
        dueDate: thirtyDaysLater
      };
    }

    // 30 days have passed - check referral exemption (use same transaction)
    const exemptionMet = await checkReferralExemption(userId, accountCreatedAt, client);
    
    if (exemptionMet) {
      // Waive the fee - user referred at least 1 person within 30 days
      await client.query(`
        UPDATE users 
        SET "walletFeeWaived" = true, 
            "walletFeeProcessed" = true,
            "walletFeeApplied" = false,
            "walletFeeLocked" = false,
            "walletFeeProcessedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');
      
      // Create notification (non-blocking)
      try {
        await databaseHelpers.notification.createNotification({
          userId,
          title: 'Wallet Fee Waived! 🎉',
          message: 'Congratulations! Your wallet fee has been waived because you referred at least 1 person within your first month.',
          type: 'SUCCESS'
        });
      } catch (notifError) {
        console.warn(`⚠️ Failed to create notification for user ${userId}:`, notifError.message);
        // Don't fail the whole process if notification fails
      }

      console.log(`✅ Wallet fee waived for user ${userId} (referral exemption)`);
      return {
        status: 'waived',
        message: 'Wallet fee waived due to referral exemption',
        exemptionMet: true
      };
    }

    // User did NOT refer anyone within 30 days - deduct $2 fee
    // Get user's wallet balance and VON balance
    const walletResult = await client.query(`
      SELECT balance, "VonBalance" FROM wallets WHERE "userId" = $1
    `, [userId]);

    if (walletResult.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const wallet = walletResult.rows[0];
    const currentBalance = parseFloat(wallet.balance || 0);
    const currentVonBalance = parseFloat(wallet.VonBalance || 0);

    // Get current VON price to convert VON to USD
    let vonPrice = 0.0035; // Default fallback price
    try {
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      vonPrice = tokenValue.currentTokenValue;
    } catch (error) {
      console.warn('Could not get current token price, using default:', error.message);
    }

    // Calculate total available balance (USD + VON in USD)
    const vonValueInUsd = currentVonBalance * vonPrice;
    const totalAvailableBalance = currentBalance + vonValueInUsd;

    // Check if user has sufficient balance (USD or VON)
    if (totalAvailableBalance < WALLET_FEE_AMOUNT) {
      // Insufficient balance in both USD and VON - lock wallet
      await client.query(`
        UPDATE users 
        SET "walletFeeLocked" = true,
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');

      // Create notification only if one doesn't already exist (non-blocking)
      try {
        // Check if a notification with this title already exists for this user
        const existingNotification = await databaseHelpers.pool.query(`
          SELECT id FROM notifications 
          WHERE "userId" = $1 
            AND title = $2 
            AND type = 'WARNING'
            AND "createdAt" >= NOW() - INTERVAL '1 day'
          ORDER BY "createdAt" DESC
          LIMIT 1
        `, [userId, 'Wallet Locked - Payment Required']);

        // Only create notification if one doesn't exist in the last 24 hours
        if (existingNotification.rows.length === 0) {
          await databaseHelpers.notification.createNotification({
            userId,
            title: 'Wallet Locked - Payment Required',
            message: `Your wallet has been locked because the $${WALLET_FEE_AMOUNT} wallet fee is due but you have insufficient balance. Please deposit at least $${WALLET_FEE_AMOUNT} to unlock your wallet and resume all features.`,
            type: 'WARNING'
          });
          console.log(`📧 Wallet locked notification sent to user ${userId}`);
        } else {
          console.log(`ℹ️ Wallet locked notification already exists for user ${userId}, skipping duplicate`);
        }
      } catch (notifError) {
        console.warn(`⚠️ Failed to create notification for user ${userId}:`, notifError.message);
        // Don't fail the whole process if notification fails
      }

      console.log(`⚠️ Wallet locked for user ${userId} - insufficient balance (USD: $${currentBalance}, VON: ${currentVonBalance}, VON Value: $${vonValueInUsd.toFixed(2)})`);
      return {
        status: 'locked',
        message: 'Wallet locked due to insufficient balance',
        requiredAmount: WALLET_FEE_AMOUNT,
        currentBalance,
        currentVonBalance,
        vonValueInUsd
      };
    }

    // User has sufficient balance - deduct fee
    let newBalance = currentBalance;
    let newVonBalance = currentVonBalance;
    let deductionSource = 'USD';

    if (currentBalance >= WALLET_FEE_AMOUNT) {
      // Deduct from USD balance
      newBalance = currentBalance - WALLET_FEE_AMOUNT;
    } else {
      // Need to deduct from VON balance
      const usdShortfall = WALLET_FEE_AMOUNT - currentBalance;
      const vonNeeded = usdShortfall / vonPrice;
      
      if (currentVonBalance >= vonNeeded) {
        // Deduct remaining from USD and rest from VON
        newBalance = 0;
        newVonBalance = currentVonBalance - vonNeeded;
        deductionSource = 'VON';
        console.log(`💰 Deducting wallet fee from VON: ${vonNeeded.toFixed(2)} VON (worth $${usdShortfall.toFixed(2)})`);
      } else {
        // This shouldn't happen as we checked totalAvailableBalance, but handle it anyway
        throw new Error('Insufficient balance calculation error');
      }
    }
    
    // Update wallet balances
    await client.query(`
      UPDATE wallets 
      SET balance = $1, "VonBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
      WHERE "userId" = $3
    `, [newBalance, newVonBalance, userId]);

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

    // Record in admin_reserve_history using the new deductWalletFee pattern (non-blocking)
    try {
      await databaseHelpers.adminReserveHistory.deductWalletFee({
        amount: WALLET_FEE_AMOUNT,
        userId: userId,
        purpose: `Wallet fee deduction for user ${userId} (first deposit < $10, no referral within 30 days)`,
        adminId: 'SYSTEM',
        client: client // Use existing transaction
      });
    } catch (reserveError) {
      console.warn(`⚠️ Failed to record wallet fee in admin reserve history for user ${userId}:`, reserveError.message);
      // Don't fail the whole process if reserve history recording fails
    }

    // Create transaction record
    const { randomUUID } = await import('crypto');
    const transactionId = randomUUID();
    
    await client.query(`
      INSERT INTO transactions (
        id, "userId", type, amount, currency, status, 
        description, "feeAmount", "feeReceiverId", "netAmount", "transactionType",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, 'WALLET_FEE', $3, 'USD', 'COMPLETED', $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      transactionId,
      userId,
      WALLET_FEE_AMOUNT,
      'One-time wallet fee after 30-day trial period (no referral exemption)',
      WALLET_FEE_AMOUNT,
      feeReceiverId,
      0, // netAmount is 0 for fee transactions
      'wallet_fee' // transactionType for admin fees page
    ]);

    // Mark fee as processed and applied
    await client.query(`
      UPDATE users 
      SET "walletFeeProcessed" = true,
          "walletFeeApplied" = true,
          "walletFeeLocked" = false,
          "walletFeeProcessedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
    `, [userId]);

    await client.query('COMMIT');

    // Create notification (non-blocking)
    const balanceMessage = deductionSource === 'VON' 
      ? `A one-time wallet fee of $${WALLET_FEE_AMOUNT} has been deducted from your VON balance. Your new USD balance is $${newBalance.toFixed(2)} and VON balance is ${newVonBalance.toFixed(2)}.`
      : `A one-time wallet fee of $${WALLET_FEE_AMOUNT} has been deducted from your wallet. Your new balance is $${newBalance.toFixed(2)}.`;
    
    try {
      await databaseHelpers.notification.createNotification({
        userId,
        title: 'Wallet Fee Charged',
        message: balanceMessage,
        type: 'INFO'
      });
    } catch (notifError) {
      console.warn(`⚠️ Failed to create notification for user ${userId}:`, notifError.message);
      // Don't fail the whole process if notification fails
    }

    console.log(`✅ Wallet fee charged for user ${userId}: $${WALLET_FEE_AMOUNT} (deducted from ${deductionSource})`);
    return {
      status: 'charged',
      message: 'Wallet fee successfully charged',
      feeAmount: WALLET_FEE_AMOUNT,
      previousBalance: currentBalance,
      previousVonBalance: currentVonBalance,
      newBalance,
      newVonBalance,
      deductionSource
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
    
    // Get all users whose wallet fee should be processed
    // Users who:
    // 1. Have not been processed yet (walletFeeProcessed = false AND walletFeeApplied = false)
    // 2. Account was created at least 30 days ago
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - FREE_TRIAL_DAYS);
    
    const usersResult = await databaseHelpers.pool.query(`
      SELECT id, email, "createdAt", "firstDepositAmount"
      FROM users
      WHERE "createdAt" <= $1
        AND "walletFeeProcessed" = false
        AND "walletFeeApplied" = false
    `, [thirtyDaysAgo]);

    const users = usersResult.rows;
    console.log(`📋 Found ${users.length} users eligible for wallet fee processing`);

    const results = {
      total: users.length,
      charged: 0,
      waived: 0,
      exempt: 0,
      locked: 0,
      pending: 0,
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
        } else if (result.exemptionReason === 'first_deposit_over_10') {
          results.exempt++;
        } else if (result.status === 'locked') {
          results.locked++;
        } else if (result.status === 'pending') {
          results.pending++;
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
 * Process wallet fee after deposit if wallet is locked
 * Called when a user makes a deposit and their wallet is locked due to unpaid fee
 * @param {string} userId - User ID
 * @returns {Object} - Result object with status
 */
export async function processWalletFeeAfterDeposit(userId) {
  try {
    // Check if wallet is locked
    const userResult = await databaseHelpers.pool.query(`
      SELECT "walletFeeLocked", "walletFeeProcessed", "walletFeeApplied", "firstDepositAmount"
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return { status: 'error', message: 'User not found' };
    }

    const user = userResult.rows[0];

    // Only process if wallet is locked and fee hasn't been processed yet
    if (!user.walletFeeLocked || user.walletFeeProcessed || user.walletFeeApplied) {
      return { status: 'skipped', message: 'Wallet fee not applicable' };
    }

    // Check if first deposit > $10 (permanently exempt)
    if (user.firstDepositAmount !== null && user.firstDepositAmount !== undefined && user.firstDepositAmount > 10) {
      // User is permanently exempt - mark as waived
      await databaseHelpers.pool.query(`
        UPDATE users 
        SET "walletFeeWaived" = true, 
            "walletFeeProcessed" = true,
            "walletFeeApplied" = false,
            "walletFeeLocked" = false,
            "walletFeeProcessedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      try {
        await databaseHelpers.notification.createNotification({
          userId,
          title: 'Wallet Fee Waived',
          message: 'Your wallet fee has been waived because your first deposit was greater than $10.',
          type: 'SUCCESS'
        });
      } catch (notifError) {
        console.warn(`⚠️ Failed to create notification for user ${userId}:`, notifError.message);
        // Don't fail the whole process if notification fails
      }

      return {
        status: 'waived',
        message: 'Permanently exempt from wallet fee (first deposit > $10)',
        exemptionReason: 'first_deposit_over_10'
      };
    }

    // Process the wallet fee (will try to deduct from balance/VON)
    const result = await processWalletFeeForUser(userId);
    
    if (result.status === 'charged') {
      // Fee was successfully charged
      try {
        await databaseHelpers.notification.createNotification({
          userId,
          title: 'Wallet Unlocked',
          message: `Your wallet has been unlocked! The $${WALLET_FEE_AMOUNT} wallet fee has been deducted from your account.`,
          type: 'SUCCESS'
        });
      } catch (notifError) {
        console.warn(`⚠️ Failed to create notification for user ${userId}:`, notifError.message);
        // Don't fail the whole process if notification fails
      }
    }

    return result;
  } catch (error) {
    console.error('Error processing wallet fee after deposit:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Handle wallet fee waiver when referral condition is met
 * Called when a user refers someone (within 30 days of account creation)
 * @param {string} referrerId - ID of the user who made the referral
 * @returns {boolean} - True if fee was waived, false if already processed or not eligible
 */
export async function handleReferralFeeWaiver(referrerId) {
  try {
    const userResult = await databaseHelpers.pool.query(`
      SELECT "walletFeeProcessed", "walletFeeApplied", "createdAt", "firstDepositAmount"
      FROM users
      WHERE id = $1
    `, [referrerId]);

    if (userResult.rows.length === 0) {
      console.log(`User ${referrerId} not found`);
      return false;
    }

    const user = userResult.rows[0];
    const now = new Date();
    const accountCreatedAt = new Date(user.createdAt);
    const thirtyDaysLater = new Date(accountCreatedAt);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + FREE_TRIAL_DAYS);

    // Skip if already processed or applied
    if (user.walletFeeProcessed || user.walletFeeApplied) {
      return false;
    }

    // Skip if first deposit > $10 (permanently exempt, will be handled by cron)
    if (user.firstDepositAmount !== null && user.firstDepositAmount !== undefined && user.firstDepositAmount > 10) {
      return false;
    }

    // Only waive if still within the 30-day period
    if (now <= thirtyDaysLater) {
      // Check if user now has at least 1 referral
      const exemptionMet = await checkReferralExemption(referrerId, accountCreatedAt);
      
      if (exemptionMet) {
        await databaseHelpers.pool.query(`
          UPDATE users 
          SET "walletFeeWaived" = true,
              "walletFeeProcessed" = true,
              "walletFeeApplied" = false,
              "walletFeeLocked" = false,
              "walletFeeProcessedAt" = NOW(),
              "updatedAt" = NOW()
          WHERE id = $1
        `, [referrerId]);

        // Create notification (non-blocking)
        try {
          await databaseHelpers.notification.createNotification({
            userId: referrerId,
            title: 'Wallet Fee Waived! 🎉',
            message: 'Congratulations! Your wallet fee has been waived because you referred at least 1 person within your first month.',
            type: 'SUCCESS'
          });
        } catch (notifError) {
          console.warn(`⚠️ Failed to create notification for referrer ${referrerId}:`, notifError.message);
          // Don't fail the whole process if notification fails
        }

        console.log(`✅ Wallet fee waived for referrer ${referrerId} (referral exemption)`);
        return true;
      }
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
  processWalletFeeAfterDeposit,
  WALLET_FEE_AMOUNT,
  FREE_TRIAL_DAYS,
  MINIMUM_REFERRAL_STAKE
};













