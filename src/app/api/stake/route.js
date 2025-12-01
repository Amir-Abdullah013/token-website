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

    const { amount, durationDays } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!durationDays || ![15, 30, 60, 120, 180, 365].includes(durationDays)) {
      return NextResponse.json(
        { success: false, error: 'Invalid duration. Must be 15, 30, 60, 120, 180, or 365 days' },
        { status: 400 }
      );
    }

    // Define reward percentages (annual rates)
    // Rewards are calculated daily over 365 days regardless of staking period
    const rewardPercentages = {
      15: 10,   // 15 days → 10% annual
      30: 15,   // 1 month → 15% annual
      60: 25,   // 2 months → 25% annual
      120: 30,  // 4 months → 30% annual
      180: 50,  // 6 months → 50% annual
      365: 75   // 1 year → 75% annual
    };

    const rewardPercent = rewardPercentages[durationDays];
    // Annual reward amount
    const annualRewardAmount = (amount * rewardPercent) / 100;
    // Daily reward calculated over 365 days (regardless of staking period)
    const dailyRewardAmount = annualRewardAmount / 365;
    // Total reward for the staking period (daily reward * staking duration)
    const rewardAmount = dailyRewardAmount * durationDays;

    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      return NextResponse.json(
        { success: false, error: 'Token supply not initialized' },
        { status: 500 }
      );
    }

    // Resolve a real DB user ID to satisfy FK constraints (by id or email)
    let userId = session.id;
    try {
      let dbUser = await databaseHelpers.user.getUserById(session.id);
      if (!dbUser && session.email) {
        dbUser = await databaseHelpers.user.getUserByEmail(session.email);
      }
      if (!dbUser) {
        const name = session.name || (session.email ? session.email.split('@')[0] : 'User');
        const password = `oauth_${Date.now()}`; // placeholder; not used for sign-in
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
      console.error('❌ Error ensuring DB user exists for staking:', resolveErr);
      return NextResponse.json(
        { success: false, error: 'Failed to resolve user for staking' },
        { status: 500 }
      );
    }

    // Check if wallet is locked
    const { checkWalletLock, createWalletLockedResponse } = await import('../../../lib/walletLockCheck.js');
    const lockCheck = await checkWalletLock(userId);
    if (!lockCheck.allowed) {
      console.log('❌ Wallet is locked for user:', userId);
      return createWalletLockedResponse();
    }

    // Check user's Von balance
    let userWallet = await databaseHelpers.wallet.getWalletByUserId(userId);
    if (!userWallet) {
      // Create wallet for user if it doesn't exist
      console.log('💼 Creating wallet for user:', userId);
      try {
        userWallet = await databaseHelpers.wallet.createWallet(userId);
        console.log('✅ Wallet created for user');
      } catch (walletError) {
        console.error('❌ Error creating wallet:', walletError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user wallet' },
          { status: 500 }
        );
      }
    }

    if (userWallet.VonBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient Von balance' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);
    const nextRewardDate = new Date(startDate);
    nextRewardDate.setDate(nextRewardDate.getDate() + 1);

    // Create staking record
    let staking;
    try {
      staking = await databaseHelpers.staking.createStaking({
        userId: userId,
        amountStaked: amount,
        durationDays,
        rewardPercent,
        startDate,
        endDate,
        rewardAmount,
        dailyRewardAmount,
        nextRewardDate
      });
      console.log('✅ Staking record created:', staking.id);
    } catch (stakingErr) {
      console.error('❌ Error creating staking record:', stakingErr);
      return NextResponse.json({
        success: false,
        error: 'Failed to create staking record',
        step: 'staking_create',
        details: stakingErr.message
      }, { status: 500 });
    }

    // Lock staked tokens in user's account (using transaction for atomicity)
    let client;
    try {
      client = await databaseHelpers.pool.connect();
      await client.query('BEGIN');

      // Deduct from VonBalance and lock in stakingTokensAmount
      await client.query(`
        UPDATE wallets 
        SET "VonBalance" = "VonBalance" - $1,
            "stakingTokensAmount" = "stakingTokensAmount" + $1,
            "lastUpdated" = NOW(),
            "updatedAt" = NOW()
        WHERE "userId" = $2 AND "VonBalance" >= $1
      `, [amount, userId]);

      const checkResult = await client.query(
        'SELECT "VonBalance", "stakingTokensAmount" FROM wallets WHERE "userId" = $1',
        [userId]
      );

      if (checkResult.rows.length === 0) {
        throw new Error('Wallet not found after update');
      }

      await client.query('COMMIT');
      console.log('✅ Tokens locked in user account:', {
        amount,
        stakingTokensAmount: checkResult.rows[0].stakingTokensAmount
      });
    } catch (walletErr) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('❌ Error locking tokens in user account:', walletErr);
      // Attempt to cancel staking record to keep consistency
      try {
        await databaseHelpers.staking.updateStakingStatus(staking.id, 'CANCELLED');
        console.log('↩️ Reverted staking to CANCELLED due to wallet error');
      } catch (revertErr) {
        console.error('❌ Failed to revert staking after wallet error:', revertErr);
      }
      return NextResponse.json({
        success: false,
        error: walletErr.message.includes('VonBalance') 
          ? 'Insufficient Von balance' 
          : 'Failed to lock tokens in account',
        step: 'wallet_update',
        details: walletErr.message
      }, { status: 500 });
    } finally {
      if (client) {
        client.release();
      }
    }

    // Process immediate referral bonus (NEW LOGIC)
    let referralBonusInfo = null;
    try {
      // Get user details to check for referrer
      const user = await databaseHelpers.user.getUserById(userId);
      
      if (user && user.referrerId) {
        console.log('💰 Referral bonus triggered on stake creation');
        
        // Define referral bonus percentages based on staking duration
        const referralBonusPercentages = {
          15: 2,   // 15 days → 2%
          30: 3,   // 1 month → 3%
          60: 4,   // 2 months → 4%
          120: 5,  // 4 months → 5%
          180: 7,  // 6 months → 7%
          365: 10  // 1 year → 10%
        };
        
        const referralBonusPercent = referralBonusPercentages[durationDays] || 0;
        const referrerBonus = (amount * referralBonusPercent) / 100;
        
        if (referrerBonus > 0) {
          // Use transaction to ensure atomicity
          let client;
          try {
            client = await databaseHelpers.pool.connect();
            await client.query('BEGIN');
            
            // Get the referral record
            const referral = await client.query(
              'SELECT * FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2',
              [user.referrerId, userId]
            );
            
            if (referral.rows.length > 0) {
              const referralRecord = referral.rows[0];
              
              // Get referrer's wallet
              const referrerWalletResult = await client.query(
                'SELECT * FROM wallets WHERE "userId" = $1',
                [user.referrerId]
              );
              
              if (referrerWalletResult.rows.length > 0) {
                const referrerWallet = referrerWalletResult.rows[0];
                const referrerNewBalance = referrerWallet.VonBalance + referrerBonus;
                
                // Update referrer's wallet balance
                await client.query(
                  'UPDATE wallets SET "VonBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
                  [referrerNewBalance, user.referrerId]
                );
                
                // Create referral earning record
                await client.query(`
                  INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
                  VALUES ($1, $2, $3, $4, NOW())
                `, [require('crypto').randomUUID(), referralRecord.id, staking.id, referrerBonus]);
                
                // Send notification to referrer
                await client.query(`
                  INSERT INTO notifications (id, "userId", title, message, type, status, "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [
                  require('crypto').randomUUID(),
                  user.referrerId,
                  'Referral Bonus Earned!',
                  `You earned ${referrerBonus.toFixed(2)} Von referral bonus from ${user.name}'s new staking!`,
                  'SUCCESS',
                  'UNREAD'
                ]);
                
                await client.query('COMMIT');
                
                console.log(`✅ Referrer rewarded immediately with ${referrerBonus} Von`);
                
                referralBonusInfo = {
                  referrerId: user.referrerId,
                  bonus: referrerBonus,
                  percentage: referralBonusPercent
                };

                // Check wallet fee waiver condition (stake >= $20)
                if (amount >= 20) {
                  try {
                    console.log('🎁 Checking wallet fee waiver for referrer...');
                    const walletFeeService = (await import('../../../lib/walletFeeService.js')).default;
                    const waived = await walletFeeService.handleReferralFeeWaiver(user.referrerId);
                    if (waived) {
                      console.log(`✅ Wallet fee waived for referrer ${user.referrerId}`);
                    }
                  } catch (feeWaiverError) {
                    console.error('❌ Error processing wallet fee waiver:', feeWaiverError);
                    // Don't fail the staking if fee waiver fails
                  }
                }
              }
            }
            
          } catch (refError) {
            if (client) {
              await client.query('ROLLBACK');
            }
            console.error('❌ Error processing referral bonus:', refError);
            // Don't fail the staking if referral bonus fails
          } finally {
            if (client) {
              client.release();
            }
          }
        }
      }
    } catch (refCheckError) {
      console.error('❌ Error checking referral eligibility:', refCheckError);
      // Continue with staking even if referral check fails
    }

    // Create transaction record (non-blocking)
    try {
      await databaseHelpers.transaction.createTransaction({
        userId: userId,
        type: 'BUY',
        amount: amount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'Staking',
        description: `Staked ${amount} Von for ${durationDays} days (${rewardPercent}% reward)`,
        feeAmount: 0, // No fees on staking creation
        netAmount: amount // Full amount (no fees deducted)
      });
      console.log('✅ Transaction record created');
    } catch (txError) {
      console.error('❌ Error creating transaction record for staking:', txError);
      // Continue; staking already recorded and balance updated
    }

    // Send notification (non-blocking)
    try {
      await databaseHelpers.notification.createNotification({
        userId: userId,
        title: 'Staking Started',
        message: `You have successfully staked ${amount} Von tokens for ${durationDays} days. You will earn ${rewardPercent}% reward.`,
        type: 'SUCCESS'
      });
      console.log('✅ Notification sent');
    } catch (notifError) {
      console.error('❌ Error creating staking notification:', notifError);
      // Continue; do not fail staking due to notification
    }

    const response = {
      success: true,
      message: 'Staking started successfully',
      staking: {
        id: staking.id,
        amountStaked: staking.amountStaked,
        durationDays: staking.durationDays,
        rewardPercent: staking.rewardPercent,
        rewardAmount: staking.rewardAmount,
        dailyRewardAmount: staking.dailyRewardAmount,
        rewardAccrued: staking.rewardAccrued,
        daysRewarded: staking.daysRewarded,
        nextRewardDate: staking.nextRewardDate,
        startDate: staking.startDate,
        endDate: staking.endDate,
        status: staking.status
      }
    };

    // Add referral bonus info if applicable
    if (referralBonusInfo) {
      response.referralBonus = referralBonusInfo;
      response.message += ' Referral bonus distributed to referrer.';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating staking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create staking',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Fetching stakings for user:', session.id);
    
    // Add timeout and better error handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 10000);
    });
    
    const stakingsPromise = databaseHelpers.staking.getUserStakings(session.id);
    
    const stakings = await Promise.race([stakingsPromise, timeoutPromise]);
    console.log('📊 User stakings found:', stakings.length);

    return NextResponse.json({
      success: true,
      stakings: stakings || []
    });

  } catch (error) {
    console.error('Error fetching user stakings:', error);
    
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({
      success: true,
      stakings: [],
      warning: 'Database connection issue - showing empty stakings'
    });
  }
}
