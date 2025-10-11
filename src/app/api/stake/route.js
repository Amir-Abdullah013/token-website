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

    // Check user's Tiki balance
    const userWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet not found' },
        { status: 404 }
      );
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
    const staking = await databaseHelpers.staking.createStaking({
      userId: session.id,
      amountStaked: amount,
      durationDays,
      rewardPercent,
      startDate,
      endDate
    });

    console.log('✅ Staking record created:', staking.id);

    // Deduct Tiki tokens from user's wallet
    await databaseHelpers.wallet.updateTikiBalance(session.id, -amount);
    console.log('✅ TIKI balance deducted');

    // Create transaction record
    await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'STAKE',
      amount: amount,
      currency: 'TIKI',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Staked ${amount} TIKI for ${durationDays} days (${rewardPercent}% reward)`
    });
    console.log('✅ Transaction record created');

    // Send notification
    await databaseHelpers.notification.createNotification({
      userId: session.id,
      title: 'Staking Started',
      message: `You have successfully staked ${amount} TIKI tokens for ${durationDays} days. You will earn ${rewardPercent}% reward.`,
      type: 'STAKE'
    });
    console.log('✅ Notification sent');

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
