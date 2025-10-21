import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';
import { calculateFee, creditFeeToAdmin } from '@/lib/fees';
import { randomUUID } from 'crypto';

export async function GET(request) {
  console.log('📋 Transfer API: Fetching transfers');

  try {
    const session = await getServerSession();
    console.log('🔍 Transfer API: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Get user's Von ID for filtering
    const senderVonId = `Von-${session.email.split('@')[0].toUpperCase().substring(0, 4)}-${session.id.substring(0, 8).toUpperCase()}`;
    console.log('🆔 Transfer API: User Von ID:', senderVonId);

    // For now, return empty array since transfers table doesn't exist
    // This will be populated when users make actual transfers
    console.log('📊 Transfer API: No transfers table found, returning empty array');
    
    return NextResponse.json({
      success: true,
      transfers: [],
      total: 0
    });
    
  } catch (error) {
    console.error('❌ Transfer API: Error fetching transfers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transfers',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  console.log('🚀 Transfer API: Starting request processing');
  
  try {
    // Get session
    const session = await getServerSession();
    console.log('🔍 Transfer API: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('🔍 Transfer API: Request body:', body);
    
    const { recipientEmail, amount, note } = body;
    
    // Basic validation
    if (!recipientEmail || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount'
      }, { status: 400 });
    }
    
    if (session.email === recipientEmail) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send to yourself'
      }, { status: 400 });
    }

    // Check if wallet is locked
    const { checkWalletLock, createWalletLockedResponse } = await import('../../../lib/walletLockCheck.js');
    const lockCheck = await checkWalletLock(session.id);
    if (!lockCheck.allowed) {
      console.log('❌ Wallet is locked for user:', session.id);
      return createWalletLockedResponse();
    }

    // Get sender's wallet
    console.log('🔍 Transfer API: Getting sender wallet...');
    let senderWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    
    if (!senderWallet) {
      console.log('🔧 Transfer API: Creating sender wallet...');
      senderWallet = await databaseHelpers.wallet.createWallet(session.id);
    }

    // Calculate transfer fee (5% for transfers)
    const { fee, net } = await calculateFee(numericAmount, "transfer");
    
    // Check sufficient balance (user needs to have the full amount + fee)
    const totalRequired = numericAmount + fee;
    if (senderWallet.VonBalance < totalRequired) {
      return NextResponse.json({
        success: false,
        error: `Insufficient Von balance. Required: ${totalRequired.toFixed(2)} Von (${numericAmount.toFixed(2)} + ${fee.toFixed(2)} fee)`
      }, { status: 400 });
    }

    // Get or create recipient user
    console.log('🔍 Transfer API: Getting recipient user...');
    let recipient = await databaseHelpers.user.getUserByEmail(recipientEmail);
    
    if (!recipient) {
      console.log('🔧 Transfer API: Creating recipient user...');
      recipient = await databaseHelpers.user.createUser({
        email: recipientEmail,
        password: null,
        name: 'User',
        emailVerified: true,
        role: 'USER'
      });
    }

    // Get recipient's wallet
    console.log('🔍 Transfer API: Getting recipient wallet...');
    let recipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
    
    if (!recipientWallet) {
      console.log('🔧 Transfer API: Creating recipient wallet...');
      recipientWallet = await databaseHelpers.wallet.createWallet(recipient.id);
    }

    // Update wallet balances
    console.log('💰 Transfer API: Updating wallet balances...');
    console.log('📊 Transfer API: Sender wallet before:', { 
      id: senderWallet.id, 
      balance: senderWallet.balance, 
      VonBalance: senderWallet.VonBalance 
    });
    console.log('📊 Transfer API: Recipient wallet before:', { 
      id: recipientWallet.id, 
      balance: recipientWallet.balance, 
      VonBalance: recipientWallet.VonBalance 
    });
    
    // Update sender's wallet (decrease Von balance by full amount + fee)
    const totalDeducted = numericAmount + fee;
    const newSenderVonBalance = senderWallet.VonBalance - totalDeducted;
    console.log('🔽 Transfer API: Updating sender wallet...', { 
      userId: session.id, 
      amount: numericAmount,
      fee: fee,
      totalDeducted: totalDeducted,
      newVonBalance: newSenderVonBalance 
    });
    
    // Use direct SQL update for sender
    await databaseHelpers.pool.query(`
        UPDATE wallets 
      SET "VonBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
    `, [newSenderVonBalance, session.id]);
    console.log('✅ Transfer API: Sender wallet updated via direct SQL');
    
    // Update recipient's wallet (increase Von balance by net amount)
    const newRecipientVonBalance = recipientWallet.VonBalance + net;
    console.log('🔼 Transfer API: Updating recipient wallet...', { 
      userId: recipient.id, 
      netAmount: net,
      newVonBalance: newRecipientVonBalance 
    });
    
    // Use direct SQL update for recipient
    await databaseHelpers.pool.query(`
        UPDATE wallets 
      SET "VonBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
    `, [newRecipientVonBalance, recipient.id]);
    console.log('✅ Transfer API: Recipient wallet updated via direct SQL');
    
    // Credit fee to admin wallet
    if (fee > 0) {
      await creditFeeToAdmin(databaseHelpers.pool, fee);
      console.log('💰 Transfer API: Fee credited to admin wallet:', fee);
    }

      // Create transfer record
    const transferId = randomUUID();
    const transfer = {
      id: transferId,
        senderId: session.id,
        recipientId: recipient.id,
        senderEmail: session.email,
        recipientEmail: recipientEmail,
      amount: numericAmount,
      fee: fee,
      netAmount: net,
      note: note || null,
        status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    
    // Verify the final balances
    console.log('🔍 Transfer API: Verifying final balances...');
    const finalSenderWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    const finalRecipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
    
    console.log('📊 Transfer API: Final sender wallet:', { 
      id: finalSenderWallet.id, 
      VonBalance: finalSenderWallet.VonBalance 
    });
    console.log('📊 Transfer API: Final recipient wallet:', { 
      id: finalRecipientWallet.id, 
      VonBalance: finalRecipientWallet.VonBalance 
    });
    
    console.log('✅ Transfer API: Transfer completed:', transfer);

      return NextResponse.json({
        success: true,
      message: 'Transfer completed successfully',
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          fee: transfer.fee,
          netAmount: transfer.netAmount,
          recipientEmail: transfer.recipientEmail,
          note: transfer.note,
          createdAt: transfer.createdAt
      },
      balances: {
        senderVonBalance: finalSenderWallet.VonBalance,
        recipientVonBalance: finalRecipientWallet.VonBalance
        }
      });

    } catch (error) {
    console.error('❌ Transfer API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Transfer failed',
      details: error.message
    }, { status: 500 });
  }
}
