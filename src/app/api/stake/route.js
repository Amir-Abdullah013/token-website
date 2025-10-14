import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';

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

    if (!durationDays || ![7, 30, 90].includes(durationDays)) {
      return NextResponse.json(
        { success: false, error: 'Invalid duration. Must be 7, 30, or 90 days' },
        { status: 400 }
      );
    }

    // Define reward percentages
    const rewardPercentages = {
      7: 2,
      30: 10,
      90: 25
    };

    const rewardPercent = rewardPercentages[durationDays];

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

    // Check user's Tiki balance
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

    if (userWallet.tikiBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient Tiki balance' },
        { status: 400 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    // Create staking record
    let staking;
    try {
      staking = await databaseHelpers.staking.createStaking({
        userId: userId,
        amountStaked: amount,
        durationDays,
        rewardPercent,
        startDate,
        endDate
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

    // Deduct Tiki tokens from user's wallet
    try {
      await databaseHelpers.wallet.updateTikiBalance(userId, -amount);
      console.log('✅ TIKI balance deducted');
    } catch (walletErr) {
      console.error('❌ Error deducting TIKI balance for staking:', walletErr);
      // Attempt to cancel staking record to keep consistency
      try {
        await databaseHelpers.staking.updateStakingStatus(staking.id, 'CANCELLED');
        console.log('↩️ Reverted staking to CANCELLED due to wallet error');
      } catch (revertErr) {
        console.error('❌ Failed to revert staking after wallet error:', revertErr);
      }
      return NextResponse.json({
        success: false,
        error: 'Failed to update wallet for staking',
        step: 'wallet_update',
        details: walletErr.message
      }, { status: 500 });
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
        description: `Staked ${amount} TIKI for ${durationDays} days (${rewardPercent}% reward)`
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
        message: `You have successfully staked ${amount} TIKI tokens for ${durationDays} days. You will earn ${rewardPercent}% reward.`,
        type: 'SUCCESS'
      });
      console.log('✅ Notification sent');
    } catch (notifError) {
      console.error('❌ Error creating staking notification:', notifError);
      // Continue; do not fail staking due to notification
    }

    return NextResponse.json({
      success: true,
      message: 'Staking started successfully',
      staking: {
        id: staking.id,
        amountStaked: staking.amountStaked,
        durationDays: staking.durationDays,
        rewardPercent: staking.rewardPercent,
        startDate: staking.startDate,
        endDate: staking.endDate,
        status: staking.status
      }
    });

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
