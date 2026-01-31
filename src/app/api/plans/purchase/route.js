// src/app/api/plans/purchase/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planAmount } = await request.json();

    // Validate plan amount
    if (!planAmount || planAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan amount' },
        { status: 400 }
      );
    }

    // Get current token price using supply-based economy
    let currentPrice = 0.0035;
    try {
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      currentPrice = tokenValue.currentTokenValue;
      if (!currentPrice || currentPrice <= 0) currentPrice = 0.0035;
    } catch (err) {
      console.error('Error fetching token value:', err);
    }

    // Get user and wallet
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }

    // Ensure numeric comparison
    const currentBalance = parseFloat(wallet.balance || 0);
    const amountToDeduct = parseFloat(planAmount);

    console.log(`Plan Purchase Debug: User ${session.id}, Balance ${currentBalance}, Plan Cost ${amountToDeduct}`);

    if (currentBalance < amountToDeduct) {
      // Allow proceeding if it's close enough (floating point tolerance) or strict? Strict for money.
      return NextResponse.json({ success: false, error: `Insufficient USD balance. Have $${currentBalance}, Need $${amountToDeduct}` }, { status: 400 });
    }

    // Determine distribution based on referrer
    const hasReferrer = !!user.referrerId;
    
    let adminFeePercent = 30;
    let referrerRewardPercent = 0;
    let tokenPurchasePercent = 0;

    if (hasReferrer) {
      // Scenario 2: Referrer exists
      referrerRewardPercent = 40;
      tokenPurchasePercent = 30;
    } else {
      // Scenario 1: No referrer
      referrerRewardPercent = 0;
      tokenPurchasePercent = 70;
    }

    // Calculate amounts
    const adminFeeAmount = (amountToDeduct * adminFeePercent) / 100;
    const referrerRewardAmount = (amountToDeduct * referrerRewardPercent) / 100;
    const tokenPurchaseAmount = (amountToDeduct * tokenPurchasePercent) / 100;

    // Calculate tokens to be bought
    const tokensBought = tokenPurchaseAmount / currentPrice;

    // Execute Transaction
    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('Transaction started for User:', session.id);

      // 1. Deduct USD from User
      const deductResult = await client.query(
        'UPDATE wallets SET balance = (balance::numeric - $1), "updatedAt" = NOW() WHERE "userId" = $2 RETURNING balance',
        [amountToDeduct, session.id]
      );
      
      if (deductResult.rowCount === 0) {
        throw new Error('Failed to deduct balance: Wallet not found or update failed');
      }
      console.log('New Balance after deduction:', deductResult.rows[0].balance);

      // 2. Add Tokens to User (Locked in Staking aka stakingTokensAmount)
      const tokenAddResult = await client.query(
        'UPDATE wallets SET "stakingTokensAmount" = (COALESCE("stakingTokensAmount"::numeric, 0) + $1), "updatedAt" = NOW() WHERE "userId" = $2',
        [tokensBought, session.id]
      );
      
      if (tokenAddResult.rowCount === 0) {
        throw new Error('Failed to add locked tokens: Wallet not found');
      }

      // 3. Create Staking Record (Lock)
      const stakingId = require('crypto').randomUUID();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 180); // 6 months lock

      await client.query(`
        INSERT INTO staking (
          id, "userId", "amountStaked", "durationDays", "rewardPercent", 
          "startDate", "endDate", status, claimed, "rewardAmount", 
          "dailyRewardAmount", "rewardAccrued", "daysRewarded", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, $10,
          $11, $12, $13, NOW(), NOW()
        )
      `, [
        stakingId,
        session.id,
        tokensBought,
        180,
        0,
        startDate,
        endDate,
        'ACTIVE',
        false,
        0,
        0,
        0,
        0
      ]);

      // 4. Update Token Supply (Price Impact / Inflation)
      // This mimics the 'deductSupply' logic to ensure the price increases due to usage
      await client.query(`
        UPDATE token_supply 
        SET 
          "remainingSupply" = "remainingSupply" - $1,
          "userSupplyRemaining" = "userSupplyRemaining" - $1,
          "updatedAt" = NOW()
        WHERE id = (SELECT id FROM token_supply ORDER BY id DESC LIMIT 1)
      `, [Math.floor(tokensBought)]);
      console.log(`📉 Token Supply Deducted by ${Math.floor(tokensBought)} to trigger Price Inflation`);

      // 4. Distribute Referrer Reward (if applicable)
      if (hasReferrer && referrerRewardAmount > 0) {
        // Find Referrer Wallet
        const referrerUpdate = await client.query(
          'UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW() WHERE "userId" = $2 returning balance',
          [referrerRewardAmount, user.referrerId]
        );

        if (referrerUpdate.rowCount > 0) {
            // Log Transaction for Referrer to show in their history/notifications
            await client.query(`
              INSERT INTO transactions (
                id, "userId", type, amount, currency, status, gateway, 
                description, "createdAt", "updatedAt"
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                $8, NOW(), NOW()
              )
            `, [
              require('crypto').randomUUID(),
              user.referrerId,
              'DEPOSIT', 
              referrerRewardAmount,
              'USD',
              'COMPLETED',
              'REFERRAL_REWARD',
              `Referral Reward from ${user.email || 'User'} Plan Purchase`
            ]);

            // Log Referral Earning in specialized table
            const referralIdResult = await client.query('SELECT id FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2', [user.referrerId, session.id]);
            if (referralIdResult.rows.length > 0) {
               await client.query(`
                INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
                VALUES ($1, $2, $3, $4, NOW())
              `, [require('crypto').randomUUID(), referralIdResult.rows[0].id, stakingId, referrerRewardAmount]);
            }
        }
      }

      // 5. Construct a detailed description for Admin & User
      let description = `Plan Purchase ($${planAmount})`;
      if (hasReferrer) {
        description += `: ${tokensBought.toFixed(2)} tokens locked (30%), $${referrerRewardAmount} ref reward (40%), $${adminFeeAmount} admin fee (30%).`;
      } else {
        description += `: ${tokensBought.toFixed(2)} tokens locked (70%), $${adminFeeAmount} admin fee (30%).`;
      }

      // Record the User's Purchase in transactions
      const txId = require('crypto').randomUUID();
      await client.query(`
        INSERT INTO transactions (
          id, "userId", type, amount, currency, status, gateway, 
          description, "feeAmount", "netAmount", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 
          $8, $9, $10, NOW(), NOW()
        )
      `, [
        txId,
        session.id,
        'BUY', // Buying a plan
        planAmount,
        'USD',
        'COMPLETED',
        'PLAN_PURCHASE', // Explicitly PLAN_PURCHASE
        description,
        adminFeeAmount,
        planAmount - adminFeeAmount, // Net amount after admin fee
      ]);

      // Store Reference Transaction for Admin Fee
      /* 
      // DISABLED: Admin Fee Logic
      if (adminFeeAmount > 0) {
        // We use a SAVEPOINT so if this specific insert fails (e.g. admin user missing),
        // it doesn't abort the entire main transaction.
        try {
            await client.query('SAVEPOINT admin_fee_point');

             await client.query(`
                INSERT INTO transactions (
                  id, "userId", type, amount, currency, status, gateway, 
                  description, "createdAt", "updatedAt"
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, 
                  $8, NOW(), NOW()
                )
              `, [
                require('crypto').randomUUID(),
                'ADMIN_WALLET', // Special ID
                'WALLET_FEE', 
                adminFeeAmount,
                'USD',
                'COMPLETED',
                'PLAN_FEE',
                `Platform Fee from User ${session.id} Plan Purchase ($${planAmount})`
              ]);
              
            await client.query('RELEASE SAVEPOINT admin_fee_point');
        } catch (adminErr) {
            // CRITICAL: Must rollback to savepoint to restore transaction validity
            await client.query('ROLLBACK TO SAVEPOINT admin_fee_point');
            console.log('Admin fee log skipped (non-fatal):', adminErr.message);
        }
      }
      */

      await client.query('COMMIT');
      console.log('✅ COMMIT Successful for Plan Purchase');

      // Verify persistence immediately
      try {
        const verifyTx = await databaseHelpers.pool.query('SELECT * FROM transactions WHERE id = $1', [txId]);
        console.log('🔍 Verification: Transaction found post-commit?', verifyTx.rows.length > 0 ? 'YES' : 'NO');
        
        const verifyWallet = await databaseHelpers.pool.query('SELECT balance, "stakingTokensAmount" FROM wallets WHERE "userId" = $1', [session.id]);
        console.log('🔍 Verification: Wallet State:', verifyWallet.rows[0]);
      } catch (verifyErr) {
        console.error('Verify check failed:', verifyErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Plan purchased successfully',
        data: {
          planAmount,
          tokensBought,
          lockDate: endDate,
          txId
        }
      });

    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Transaction Rollback:', e);
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Plan purchase error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to purchase plan', details: error.message },
      { status: 500 }
    );
  }
}
