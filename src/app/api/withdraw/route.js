import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';
import { calculateFee, creditFeeToAdmin } from '@/lib/fees';
import { handleApiError, handleValidationError, handleAuthError } from '../error-handler';

export async function POST(request) {
  try {
    console.log('🔍 Withdrawal API called');
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const session = await getServerSession();
    console.log('🔍 Session:', session ? { id: session.id, email: session.email, name: session.name } : 'No session');
    
    if (!session?.id) {
      console.log('❌ No session found');
      return handleAuthError('Authentication required');
    }

    const userRole = await getUserRole(session);
    console.log('🔍 User role:', userRole);
    
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      console.log('❌ Invalid user role:', userRole);
      return handleAuthError('User access required');
    }

    // Check if wallet is locked
    const { checkWalletLock, createWalletLockedResponse } = await import('../../../lib/walletLockCheck.js');
    const lockCheck = await checkWalletLock(session.id);
    if (!lockCheck.allowed) {
      console.log('❌ Wallet is locked for user:', session.id);
      return createWalletLockedResponse();
    }

    let requestData;
    try {
      requestData = await request.json();
      console.log('🔍 Request data:', { amount: requestData.amount, binanceAddress: requestData.binanceAddress });
    } catch (parseError) {
      console.error('❌ Error parsing request JSON:', parseError);
      return handleValidationError('Invalid request data', parseError.message);
    }

    const { amount, binanceAddress, network } = requestData;

    // Validation
    if (!amount || amount <= 0) {
      return handleValidationError('Valid amount is required');
    }

    if (!binanceAddress || binanceAddress.length < 20) {
      return handleValidationError('Valid Binance address is required (minimum 20 characters)');
    }

    if (!network) {
      return handleValidationError('Network selection is required');
    }

    // Simple approach - just proceed with session ID
    console.log('🔍 Proceeding with session ID:', session.id);

    // Check user's balance
    console.log('🔍 Checking user wallet...');
    let userWallet;
    try {
      userWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
      console.log('🔍 User wallet:', userWallet ? { balance: userWallet.balance } : 'No wallet found');
    } catch (walletError) {
      console.error('❌ Error getting wallet:', walletError);
      return handleApiError(walletError, 'Wallet retrieval');
    }

    if (!userWallet) {
      console.log('🔍 Creating wallet for user...', { userId: session.id });
      try {
        userWallet = await databaseHelpers.wallet.createWallet(session.id, 'USD');
        console.log('✅ Created wallet for user:', { userId: session.id, walletId: userWallet.id });
      } catch (createError) {
        console.error('❌ Error creating wallet:', createError);
        
        // If wallet creation fails, return a more helpful error
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create user wallet. Please try again or contact support.',
            details: createError.message,
            debug: {
              userId: session.id,
              errorCode: createError.code,
              constraint: createError.constraint
            }
          },
          { status: 500 }
        );
      }
    }

    // Calculate withdrawal fee (10% for withdrawals)
    const { fee, net } = await calculateFee(amount, "withdraw");
    
    // Check sufficient balance (user needs to have the full amount + fee)
    const totalRequired = amount + fee;
    if (totalRequired > userWallet.balance) {
      return handleValidationError(`Insufficient balance. Required: $${totalRequired.toFixed(2)} ($${amount.toFixed(2)} + $${fee.toFixed(2)} fee)`);
    }

    // Deduct full amount + fee from user's balance immediately (freeze it)
    const totalDeducted = amount + fee;
    try {
      await databaseHelpers.wallet.updateBalance(session.id, -totalDeducted);
    } catch (balanceError) {
      console.error('Error updating balance:', balanceError);
      return handleApiError(balanceError, 'Balance update');
    }
    
    // Credit fee to admin wallet immediately
    if (fee > 0) {
      await creditFeeToAdmin(databaseHelpers.pool, fee);
      console.log('💰 Withdrawal API: Fee credited to admin wallet:', fee);
    }

    // Create withdrawal transaction with fee information
    let transaction;
    try {
      transaction = await databaseHelpers.transaction.createTransaction({
        userId: session.id,
        type: 'WITHDRAW',
        amount,
        currency: 'USD',
        status: 'PENDING',
        gateway: 'Binance',
        binanceAddress,
        network,
        description: `Withdrawal request to ${binanceAddress} (${network})`,
        feeAmount: fee,
        netAmount: net,
        feeReceiverId: 'ADMIN_WALLET',
        transactionType: 'withdraw'
      });
    } catch (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Refund the balance if transaction creation fails
      try {
        await databaseHelpers.wallet.updateBalance(session.id, totalDeducted);
      } catch (refundError) {
        console.error('Failed to refund balance:', refundError);
      }
      return handleApiError(transactionError, 'Transaction creation');
    }

    // Create notification for user (non-critical, don't fail if this fails)
    try {
      await databaseHelpers.notification.createNotification({
        userId: session.id,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of $${amount} has been submitted and is pending admin approval.`,
        type: 'INFO'
      });
    } catch (notificationError) {
      console.warn('Failed to create notification:', notificationError);
      // Don't fail the withdrawal if notification fails
    }

    console.log('✅ Withdrawal request created:', {
      userId: session.id,
      amount,
      binanceAddress,
      transactionId: transaction.id
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Waiting for admin confirmation.',
      transaction: {
        id: transaction.id,
        amount,
        fee,
        netAmount: net,
        status: 'PENDING',
        binanceAddress
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in withdrawal API:', error);
    console.error('Error stack:', error.stack);
    return handleApiError(error, 'Withdrawal API');
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      return handleAuthError('User access required');
    }

    // Get user's withdrawal requests
    const withdrawals = await databaseHelpers.transaction.getUserTransactions(session.id, 'WITHDRAW');

    return NextResponse.json({
      success: true,
      withdrawals
    });

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return handleApiError(error, 'Withdrawal fetch');
  }
}
