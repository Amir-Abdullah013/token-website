import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For development purposes, allow any authenticated user to access admin endpoints
    console.log('✅ Allowing access to admin staking actions for development');
    // const userRole = await getUserRole(session);
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const { id } = params;
    const { action } = await request.json();

    // Get staking details
    const staking = await databaseHelpers.staking.getStakingById(id);
    if (!staking) {
      return NextResponse.json(
        { success: false, error: 'Staking not found' },
        { status: 404 }
      );
    }

    if (action === 'mark-completed') {
      // Check if staking period has ended
      const now = new Date();
      const endDate = new Date(staking.endDate);
      
      if (now < endDate) {
        return NextResponse.json(
          { success: false, error: 'Staking period has not ended yet' },
          { status: 400 }
        );
      }

      // Calculate reward amount
      const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;

      // Update staking status
      await databaseHelpers.staking.updateStakingStatus(id, 'COMPLETED', rewardAmount);

      // Send notification to user
      await databaseHelpers.notification.createNotification({
        userId: staking.userId,
        title: 'Staking Completed',
        message: `Your staking of ${staking.amountStaked} TIKI has completed! You can now claim your rewards (${staking.amountStaked} + ${rewardAmount} TIKI).`,
        type: 'STAKE'
      });

      return NextResponse.json({
        success: true,
        message: 'Staking marked as completed',
        staking: {
          id: staking.id,
          status: 'COMPLETED',
          rewardAmount: rewardAmount
        }
      });

    } else if (action === 'reject') {
      // Mark staking as cancelled
      await databaseHelpers.staking.updateStakingStatus(id, 'CANCELLED');

      // Refund staked amount to user's wallet
      const userWallet = await databaseHelpers.wallet.getWalletByUserId(staking.userId);
      if (userWallet) {
        const newTikiBalance = userWallet.tikiBalance + staking.amountStaked;
        await databaseHelpers.wallet.updateBalance(staking.userId, null, newTikiBalance);

        // Create transaction record for refund
        await databaseHelpers.transaction.createTransaction({
          userId: staking.userId,
          type: 'REFUND',
          amount: staking.amountStaked,
          currency: 'TIKI',
          status: 'COMPLETED',
          gateway: 'Staking',
          description: `Staking cancelled - refunded ${staking.amountStaked} TIKI`
        });
      }

      // Send notification to user
      await databaseHelpers.notification.createNotification({
        userId: staking.userId,
        title: 'Staking Cancelled',
        message: `Your staking has been cancelled. ${staking.amountStaked} TIKI has been refunded to your wallet.`,
        type: 'STAKE'
      });

      return NextResponse.json({
        success: true,
        message: 'Staking rejected and refunded',
        staking: {
          id: staking.id,
          status: 'CANCELLED'
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating staking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staking' },
      { status: 500 }
    );
  }
}






