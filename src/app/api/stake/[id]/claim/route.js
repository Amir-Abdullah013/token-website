import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get staking details
    const staking = await databaseHelpers.staking.getStakingById(id);
    if (!staking) {
      return NextResponse.json(
        { success: false, error: 'Staking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this staking
    if (staking.userId !== session.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if staking is completed
    if (staking.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Staking is not completed yet' },
        { status: 400 }
      );
    }

    // Check if already claimed
    if (staking.claimed) {
      return NextResponse.json(
        { success: false, error: 'Staking rewards already claimed' },
        { status: 400 }
      );
    }

    // Calculate reward amount
    const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
    const totalAmount = staking.amountStaked + rewardAmount;

    // Get user's wallet
    const userWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet not found' },
        { status: 404 }
      );
    }

    // Add staked amount + reward back to user's wallet
    const newTikiBalance = userWallet.tikiBalance + totalAmount;
    await databaseHelpers.wallet.updateBalance(session.id, null, newTikiBalance);

    // Mark staking as claimed
    await databaseHelpers.staking.claimStaking(id);

    // Create transaction record
    await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'UNSTAKE',
      amount: totalAmount,
      currency: 'TIKI',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Claimed staking rewards: ${staking.amountStaked} TIKI + ${rewardAmount} TIKI reward`
    });

    // Send notification
    await databaseHelpers.notification.createNotification({
      userId: session.id,
      title: 'Staking Rewards Claimed',
      message: `You have successfully claimed your staking rewards! Received ${totalAmount} TIKI (${staking.amountStaked} staked + ${rewardAmount} reward).`,
      type: 'STAKE'
    });

    return NextResponse.json({
      success: true,
      message: 'Staking rewards claimed successfully',
      claimed: {
        stakedAmount: staking.amountStaked,
        rewardAmount: rewardAmount,
        totalAmount: totalAmount
      }
    });

  } catch (error) {
    console.error('Error claiming staking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim staking rewards' },
      { status: 500 }
    );
  }
}






