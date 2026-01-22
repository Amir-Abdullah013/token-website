import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';
import { creditFeeToAdmin } from '@/lib/fees';

// Define 8 plans
const PLANS = [
  { id: 1, amount: 10, name: 'Starter Plan' },
  { id: 2, amount: 25, name: 'Basic Plan' },
  { id: 3, amount: 50, name: 'Standard Plan' },
  { id: 4, amount: 100, name: 'Premium Plan' },
  { id: 5, amount: 250, name: 'Gold Plan' },
  { id: 6, amount: 500, name: 'Platinum Plan' },
  { id: 7, amount: 1000, name: 'Diamond Plan' },
  { id: 8, amount: 2500, name: 'Elite Plan' }
];

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();

    // Validate input
    if (!planId || !PLANS.find(p => p.id === planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const plan = PLANS.find(p => p.id === planId);
    const planAmount = plan.amount;
    
    console.log('📦 Plan Purchase Request:', {
      userId,
      planId,
      planName: plan.name,
      planAmount,
      sessionId: session.id
    });

    // Resolve a real DB user ID
    let userId = session.id;
    try {
      let dbUser = await databaseHelpers.user.getUserById(session.id);
      if (!dbUser && session.email) {
        dbUser = await databaseHelpers.user.getUserByEmail(session.email);
      }
      if (!dbUser) {
        const name = session.name || (session.email ? session.email.split('@')[0] : 'User');
        const password = `oauth_${Date.now()}`;
        dbUser = await databaseHelpers.user.createUser({
          email: session.email || `user_${Date.now()}@example.com`,
          password,
          name,
          emailVerified: true,
          role: 'USER'
        });
      }
      userId = dbUser.id;
    } catch (resolveErr) {
      console.error('❌ Error ensuring DB user exists for plan purchase:', resolveErr);
      return NextResponse.json(
        { success: false, error: 'Failed to resolve user for plan purchase' },
        { status: 500 }
      );
    }

    // Check if wallet is locked
    const { checkWalletLock, createWalletLockedResponse } = await import('../../../../lib/walletLockCheck.js');
    const lockCheck = await checkWalletLock(userId);
    if (!lockCheck.allowed) {
      console.log('❌ Wallet is locked for user:', userId);
      return createWalletLockedResponse();
    }

    // Check user's USD balance
    let userWallet = await databaseHelpers.wallet.getWalletByUserId(userId);
    if (!userWallet) {
      userWallet = await databaseHelpers.wallet.createWallet(userId);
    }

    console.log('💰 Balance Check:', {
      userId,
      currentBalance: userWallet.balance,
      planAmount,
      sufficient: userWallet.balance >= planAmount
    });

    if (userWallet.balance < planAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient USD balance' },
        { status: 400 }
      );
    }

    // Calculate splits: 30% tokens, 30% referrer, 40% admin
    const tokenPurchaseAmount = planAmount * 0.30; // 30%
    const referrerAmount = planAmount * 0.30; // 30% (changed from 40%)
    const adminFeeAmount = planAmount * 0.40; // 40% (changed from 30%)

    // Get current token price
    let currentPrice;
    try {
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      currentPrice = tokenValue.currentTokenValue;
    } catch (dbError) {
      console.warn('Database not available, using fallback value:', dbError.message);
      currentPrice = 0.0035; // Base value
    }

    // Calculate tokens to buy with 30% of plan amount
    const tokensPurchased = tokenPurchaseAmount / currentPrice;

    // Calculate unlock date (6 months from now)
    const unlockDate = new Date();
    unlockDate.setMonth(unlockDate.getMonth() + 6);

    let client;
    try {
      client = await databaseHelpers.pool.connect();
      await client.query('BEGIN');

      // 1. Deduct EXACT plan amount from user's USD balance (NO FEES on plan purchases)
      const balanceCheck = await client.query(
        'SELECT balance FROM wallets WHERE "userId" = $1',
        [userId]
      );
      
      if (balanceCheck.rows.length === 0) {
        throw new Error('Wallet not found');
      }
      
      const currentBalance = parseFloat(balanceCheck.rows[0].balance || 0);
      if (currentBalance < planAmount) {
        throw new Error('Insufficient balance');
      }
      
      // Deduct exactly the plan amount (no fees on plan purchases)
      const updateResult = await client.query(
        `UPDATE wallets SET balance = balance - $1, "updatedAt" = NOW() WHERE "userId" = $2 RETURNING balance`,
        [planAmount, userId]
      );
      
      if (updateResult.rows.length === 0) {
        throw new Error('Failed to update wallet balance');
      }
      
      const newBalance = parseFloat(updateResult.rows[0].balance);
      const actualDeducted = currentBalance - newBalance;
      
      console.log('✅ Plan amount deducted:', {
        userId,
        planAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        actualDeducted,
        matches: Math.abs(actualDeducted - planAmount) < 0.01
      });
      
      // Verify exact amount was deducted (allow small floating point differences)
      if (Math.abs(actualDeducted - planAmount) > 0.01) {
        console.error('❌ Amount mismatch!', {
          expected: planAmount,
          actual: actualDeducted,
          difference: actualDeducted - planAmount
        });
        throw new Error(`Incorrect amount deducted. Expected $${planAmount}, but $${actualDeducted} was deducted.`);
      }

      // 2. Buy tokens with 30% and lock them for 6 months
      // Add tokens to lockedPlanTokensAmount (handle NULL values)
      await client.query(
        `UPDATE wallets 
         SET "lockedPlanTokensAmount" = COALESCE("lockedPlanTokensAmount", 0) + $1::DECIMAL(30,8), 
             "updatedAt" = NOW() 
         WHERE "userId" = $2`,
        [tokensPurchased.toString(), userId]
      );

      // Verify the update worked
      const walletCheck = await client.query(
        'SELECT "lockedPlanTokensAmount" FROM wallets WHERE "userId" = $1',
        [userId]
      );
      
      if (walletCheck.rows.length === 0) {
        throw new Error('Wallet not found after update');
      }
      
      const updatedLockedAmount = walletCheck.rows[0].lockedPlanTokensAmount;
      console.log('✅ Locked tokens updated:', {
        userId,
        tokensPurchased: tokensPurchased.toString(),
        lockedAmountBefore: 'N/A',
        lockedAmountAfter: updatedLockedAmount,
        tokensPurchasedValue: tokensPurchased
      });
      
      // Double-check the value was actually updated
      if (!updatedLockedAmount || parseFloat(updatedLockedAmount) < parseFloat(tokensPurchased)) {
        console.warn('⚠️ Warning: Locked tokens may not have updated correctly', {
          expected: tokensPurchased,
          actual: updatedLockedAmount
        });
      }

      // Deduct tokens from user supply (similar to buy logic)
      const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
      if (!tokenSupply) {
        throw new Error('Token supply not initialized');
      }

      // Update token supply (deduct from user supply)
      const newUserSupply = tokenSupply.userSupplyRemaining - tokensPurchased;
      if (newUserSupply < 0) {
        throw new Error('Insufficient token supply');
      }

      await client.query(
        `UPDATE token_supply 
         SET "userSupplyRemaining" = $1, "updatedAt" = NOW() 
         WHERE id = $2`,
        [newUserSupply, tokenSupply.id]
      );

      // 3. Transfer 40% to referrer if exists
      let referrerId = null;
      const user = await databaseHelpers.user.getUserById(userId);
      if (user && user.referrerId) {
        referrerId = user.referrerId;
        
        // Get or create referrer wallet
        let referrerWallet = await databaseHelpers.wallet.getWalletByUserId(referrerId);
        if (!referrerWallet) {
          // Create wallet for referrer
          const referrerUser = await databaseHelpers.user.getUserById(referrerId);
          if (referrerUser) {
            referrerWallet = await databaseHelpers.wallet.createWallet(referrerId);
          }
        }

        if (referrerWallet) {
          // Credit referrer with 30% of plan amount
          await client.query(
            `UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE "userId" = $2`,
            [referrerAmount, referrerId]
          );

          // Create transaction for referrer
          await databaseHelpers.transaction.createTransaction({
            userId: referrerId,
            type: 'REFERRAL_REWARD',
            amount: referrerAmount,
            currency: 'USD',
            status: 'COMPLETED',
            gateway: 'Plan Purchase',
            description: `Referral reward from ${user.name || user.email}'s ${plan.name} purchase ($${planAmount})`,
            feeAmount: 0,
            netAmount: referrerAmount,
            transactionType: 'referral_reward'
          });

          // Create notification for referrer
          await databaseHelpers.notification.createNotification({
            userId: referrerId,
            title: 'Referral Reward Received! 🎉',
            message: `You received $${referrerAmount.toFixed(2)} as a referral reward from ${user.name || user.email}'s ${plan.name} purchase.`,
            type: 'SUCCESS'
          });
        }
      }

      // 4. Transfer 40% to admin as fee
      await creditFeeToAdmin(databaseHelpers.pool, adminFeeAmount);

      // 5. Create plan purchase record
      const planPurchaseId = require('crypto').randomUUID();
      await client.query(
        `INSERT INTO plan_purchases 
         (id, "userId", "planAmount", "tokenPurchaseAmount", "tokensPurchased", "referrerAmount", "adminFeeAmount", "referrerId", "unlockDate", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          planPurchaseId,
          userId,
          planAmount,
          tokenPurchaseAmount,
          tokensPurchased.toString(),
          referrerAmount,
          adminFeeAmount,
          referrerId,
          unlockDate,
          'ACTIVE'
        ]
      );

      // 6. Create transaction record for user
      await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'PLAN_PURCHASE',
        amount: planAmount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'Plan Purchase',
        description: `Purchased ${plan.name} - ${tokensPurchased.toFixed(2)} tokens locked for 6 months`,
        feeAmount: adminFeeAmount,
        netAmount: planAmount - adminFeeAmount,
        transactionType: 'plan_purchase'
      });

      // 7. Create transaction record for admin fee
      const adminUser = await databaseHelpers.user.getAdminUser();
      if (adminUser) {
        await databaseHelpers.transaction.createTransaction({
          userId: adminUser.id,
          type: 'PLAN_PURCHASE',
          amount: adminFeeAmount,
          currency: 'USD',
          status: 'COMPLETED',
          gateway: 'Plan Purchase Fee',
          description: `Admin fee from ${user.name || user.email}'s ${plan.name} purchase`,
          feeAmount: 0,
          netAmount: adminFeeAmount,
          transactionType: 'admin_fee'
        });
      }

      await client.query('COMMIT');

      // Create notification for user
      await databaseHelpers.notification.createNotification({
        userId: userId,
        title: 'Plan Purchased Successfully! 🎉',
        message: `You purchased ${plan.name} for $${planAmount}. ${tokensPurchased.toFixed(2)} tokens have been locked and will unlock on ${unlockDate.toLocaleDateString()}.`,
        type: 'SUCCESS'
      });

      return NextResponse.json({
        success: true,
        message: 'Plan purchased successfully',
        plan: {
          id: plan.id,
          name: plan.name,
          amount: planAmount,
          tokensPurchased: tokensPurchased,
          unlockDate: unlockDate,
          referrerReward: referrerId ? referrerAmount : 0,
          adminFee: adminFeeAmount
        }
      });

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Error purchasing plan:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to purchase plan',
          details: error.message
        },
        { status: 500 }
      );
    } finally {
      if (client) {
        client.release();
      }
    }

  } catch (error) {
    console.error('Error in plan purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process plan purchase',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available plans
export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      plans: PLANS
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

