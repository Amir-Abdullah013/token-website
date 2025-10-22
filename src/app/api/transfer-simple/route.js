import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';
import { calculateFee, creditFeeToAdmin } from '@/lib/fees';
import { randomUUID } from 'crypto';

export async function POST(request) {
  console.log('🚀 Transfer Simple API: Starting request processing');
  
  try {
    // Get session
    const session = await getServerSession();
    console.log('🔍 Transfer Simple API: Session:', session);
    
    if (!session) {
      console.log('❌ Transfer Simple API: No session found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to send tokens.'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('🔍 Transfer Simple API: Request body:', body);
    
    const { recipientVonId, amount, note } = body;
    
    // Basic validation
    if (!recipientVonId || !amount) {
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
    
    // Validate Von ID format - should be Von-XXXX-XXXXXXXX
    if (!/^Von-[A-Z0-9]{4}-[A-Z0-9]{8}$/i.test(recipientVonId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Von ID format (expected: Von-XXXX-XXXXXXXX)'
      }, { status: 400 });
    }

    // Get sender's wallet
    const userId = session.id || session.user?.id;
    console.log('🔍 Transfer Simple API: Getting sender wallet for user ID:', userId);
    console.log('🔍 Transfer Simple API: Session details:', {
      sessionId: session.id,
      sessionUserId: session.user?.id,
      email: session.email,
      name: session.name
    });
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID not found in session'
      }, { status: 401 });
    }
    
    // Check for self-transfer
    const senderVonId = `Von-${session.email.split('@')[0].toUpperCase().substring(0, 4)}-${userId.substring(0, 8).toUpperCase()}`;
    if (recipientVonId === senderVonId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send tokens to yourself. Please use a different recipient Von ID.'
      }, { status: 400 });
    }

    let senderWallet = await databaseHelpers.wallet.getWalletByUserId(userId);
    console.log('🔍 Transfer Simple API: Sender wallet result:', senderWallet);
    
    if (!senderWallet) {
      console.log('🔧 Transfer Simple API: Creating sender wallet...');
      try {
        senderWallet = await databaseHelpers.wallet.createWallet(userId);
        console.log('✅ Transfer Simple API: Created sender wallet:', senderWallet);
      } catch (walletError) {
        console.error('❌ Transfer Simple API: Error creating sender wallet:', walletError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create sender wallet',
          details: walletError.message
        }, { status: 500 });
      }
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

    // Find recipient by Von ID
    console.log('🔍 Transfer Simple API: Looking up recipient by Von ID:', recipientVonId);
    
    // Handle multiple Von ID formats:
    // Format 1: Von-AMIR-1F1FFFE0 (4-8 format from database)
    // Format 2: Von-AMIR-11661526 (4-8 format from dashboard)
    // Format 3: Von-AMIR-1166-1526 (4-4-4 format from user-id.js)
    const VonIdParts = recipientVonId.split('-');
    if (VonIdParts.length < 3 || VonIdParts.length > 4) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Von ID format'
      }, { status: 400 });
    }

    const emailPrefix = VonIdParts[1]; // AMIR from all formats
    let idSuffix;
    
    if (VonIdParts.length === 3) {
      // Format 1 & 2: Von-AMIR-1F1FFFE0 or Von-AMIR-11661526 (4-8 format)
      idSuffix = VonIdParts[2]; // 1F1FFFE0 or 11661526
    } else {
      // Format 3: Von-AMIR-1166-1526 (4-4-4 format)
      idSuffix = VonIdParts[2] + VonIdParts[3]; // 11661526
    }
    
    console.log('🔍 Transfer Simple API: Parsed Von ID parts:', { emailPrefix, idSuffix, format: VonIdParts.length === 3 ? '4-8' : '4-4-4' });
    
    // Search for user by email prefix and ID suffix
    let recipient = null;
    let allUsers = [];
    
    try {
      // Get all users and search for matching Von ID
      allUsers = await databaseHelpers.user.getAllUsers();
      console.log('🔍 Transfer Simple API: Searching through', allUsers.length, 'users');
      
      for (const user of allUsers) {
        // Generate Von ID for this user using the same logic as auth-context (4-8 format)
        const userEmailPrefix = user.email.split('@')[0].toUpperCase().substring(0, 4);
        const userIdSuffix = user.id.substring(0, 8).toUpperCase();
        const userVonId = `Von-${userEmailPrefix}-${userIdSuffix}`;
        
        console.log('🔍 Transfer Simple API: Checking user:', { 
          id: user.id, 
          email: user.email, 
          generatedVonId: userVonId,
          targetVonId: recipientVonId,
          emailPrefix: userEmailPrefix,
          idSuffix: userIdSuffix
        });
        
        // Check if the target Von ID matches this user's generated Von ID
        if (userVonId === recipientVonId) {
          recipient = user;
          console.log('✅ Transfer Simple API: Found exact match:', user.email);
          break;
        }
        
        // Also check if the email prefix and ID suffix match (for partial matching)
        if (userEmailPrefix === emailPrefix && userIdSuffix === idSuffix) {
          recipient = user;
          console.log('✅ Transfer Simple API: Found partial match:', user.email);
          break;
        }
        
        // Fallback: Check if email prefix matches (for dashboard Von ID format)
        // This is a security risk - we should not automatically match by email prefix
        // Instead, we'll log this as a potential issue and require exact match
        if (userEmailPrefix === emailPrefix) {
          console.log('⚠️ Transfer Simple API: Found email prefix match but Von ID does not match exactly');
          console.log('⚠️ This could be a security issue - Von ID mismatch detected');
        }
      }
    } catch (searchError) {
      console.error('❌ Transfer Simple API: Error searching users:', searchError);
    }
    
    if (!recipient) {
      console.log('❌ Transfer Simple API: Recipient not found for Von ID:', recipientVonId);
      console.log('🔍 Transfer Simple API: Searched for:', { emailPrefix, idSuffix });
      
      // Generate list of available Von IDs for better error message
      const availableVonIds = allUsers.map(u => {
        const userEmailPrefix = u.email.split('@')[0].toUpperCase().substring(0, 4);
        const userIdSuffix = u.id.substring(0, 8).toUpperCase();
        return {
          email: u.email,
          name: u.name,
          VonId: `Von-${userEmailPrefix}-${userIdSuffix}`
        };
      });
      
      console.log('🔍 Transfer Simple API: Available users with Von IDs:', availableVonIds);
      
        return NextResponse.json({
          success: false,
        error: `Recipient not found. The Von ID "${recipientVonId}" does not exist in the system.`,
        availableVonIds: availableVonIds.slice(0, 10), // Show first 10 for reference
        totalUsers: allUsers.length
        }, { status: 404 });
      }

    console.log('✅ Transfer Simple API: Recipient found:', recipient.email);

    // Get recipient's wallet
    console.log('🔍 Transfer Simple API: Getting recipient wallet...');
    let recipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
    
    if (!recipientWallet) {
      console.log('🔧 Transfer Simple API: Creating recipient wallet...');
      recipientWallet = await databaseHelpers.wallet.createWallet(recipient.id);
    }

    // Update wallet balances
    console.log('💰 Transfer Simple API: Updating wallet balances...');
    console.log('📊 Transfer Simple API: Sender wallet before:', { 
      id: senderWallet.id, 
      balance: senderWallet.balance, 
      VonBalance: senderWallet.VonBalance 
    });
    console.log('📊 Transfer Simple API: Recipient wallet before:', { 
      id: recipientWallet.id, 
      balance: recipientWallet.balance, 
      VonBalance: recipientWallet.VonBalance 
    });
    
    // Update sender's wallet (decrease Von balance by full amount + fee)
    const totalDeducted = numericAmount + fee;
    const newSenderVonBalance = senderWallet.VonBalance - totalDeducted;
    console.log('🔽 Transfer Simple API: Updating sender wallet...', { 
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
    console.log('✅ Transfer Simple API: Sender wallet updated via direct SQL');
    
    // Update recipient's wallet (increase Von balance by full amount - recipient gets full amount, sender pays fee)
    const newRecipientVonBalance = recipientWallet.VonBalance + numericAmount;
    console.log('🔼 Transfer Simple API: Updating recipient wallet...', { 
      userId: recipient.id, 
      amountReceived: numericAmount,
      newVonBalance: newRecipientVonBalance 
    });
    
    // Use direct SQL update for recipient
        await databaseHelpers.pool.query(`
          UPDATE wallets 
          SET "VonBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
    `, [newRecipientVonBalance, recipient.id]);
    console.log('✅ Transfer Simple API: Recipient wallet updated via direct SQL');
    
    // Credit fee to admin wallet
    if (fee > 0) {
      await creditFeeToAdmin(databaseHelpers.pool, fee);
      console.log('💰 Transfer Simple API: Fee credited to admin wallet:', fee);
    }
    
    // Create transaction record for admin fees tracking
    let transaction;
    try {
      console.log('🔍 Transfer Simple API: Creating transaction record...', {
        userId: session.id,
        type: 'TRANSFER',
        amount: numericAmount,
        currency: 'Von',
        feeAmount: fee,
        transactionType: 'transfer'
      });
      
      transaction = await databaseHelpers.transaction.createTransaction({
        userId: session.id,
        type: 'WITHDRAW', // Use WITHDRAW enum value for transfers
        amount: numericAmount,
        currency: 'Von',
        status: 'COMPLETED',
        gateway: 'VonTransfer',
        description: `Transfer to ${recipient.email}`,
        feeAmount: fee,
        netAmount: numericAmount, // Recipient receives full amount
        feeReceiverId: 'ADMIN_WALLET',
        transactionType: 'transfer' // Keep transactionType as 'transfer' for admin fees tracking
      });
      console.log('✅ Transfer Simple API: Transaction record created for fee tracking:', transaction.id);
    } catch (txErr) {
      console.error('❌ Transfer Simple API: Failed to create transaction record:', txErr);
      console.error('❌ Transfer Simple API: Error details:', {
        message: txErr.message,
        code: txErr.code,
        stack: txErr.stack
      });
      // Don't fail the transfer if transaction record creation fails
    }
    
    // Create transfer record
    const transferId = randomUUID();
    const transfer = {
      id: transferId,
      senderId: session.id,
      recipientId: recipient.id,
      senderEmail: session.email,
      recipientEmail: recipient.email,
      amount: numericAmount,
      fee: fee,
      netAmount: numericAmount, // Recipient receives full amount, sender pays fee separately
      note: note || null,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    
    // Verify the final balances
    console.log('🔍 Transfer Simple API: Verifying final balances...');
    const finalSenderWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    const finalRecipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
    
    console.log('📊 Transfer Simple API: Final sender wallet:', { 
      id: finalSenderWallet.id, 
      VonBalance: finalSenderWallet.VonBalance 
    });
    console.log('📊 Transfer Simple API: Final recipient wallet:', { 
      id: finalRecipientWallet.id, 
      VonBalance: finalRecipientWallet.VonBalance 
    });
    
    console.log('✅ Transfer Simple API: Transfer completed:', transfer);
    
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
    console.error('❌ Transfer Simple API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Transfer failed',
      details: error.message
    }, { status: 500 });
  }
}