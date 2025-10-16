import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';
import { calculateFee, creditFeeToAdmin } from '../../../lib/fees';
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
    
    const { recipientTikiId, amount, note } = body;
    
    // Basic validation
    if (!recipientTikiId || !amount) {
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
    
    // Validate TIKI ID format
    if (!recipientTikiId.startsWith('TIKI-') || recipientTikiId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid TIKI ID format'
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
    const senderTikiId = `TIKI-${session.email.split('@')[0].toUpperCase().substring(0, 4)}-${userId.substring(0, 8).toUpperCase()}`;
    if (recipientTikiId === senderTikiId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send tokens to yourself. Please use a different recipient TIKI ID.'
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
    if (senderWallet.tikiBalance < totalRequired) {
      return NextResponse.json({
        success: false,
        error: `Insufficient TIKI balance. Required: ${totalRequired.toFixed(2)} TIKI (${numericAmount.toFixed(2)} + ${fee.toFixed(2)} fee)`
      }, { status: 400 });
    }

    // Find recipient by TIKI ID
    console.log('🔍 Transfer Simple API: Looking up recipient by TIKI ID:', recipientTikiId);
    
    // Handle multiple TIKI ID formats:
    // Format 1: TIKI-AMIR-1F1FFFE0 (4-8 format from database)
    // Format 2: TIKI-AMIR-11661526 (4-8 format from dashboard)
    // Format 3: TIKI-AMIR-1166-1526 (4-4-4 format from user-id.js)
    const tikiIdParts = recipientTikiId.split('-');
    if (tikiIdParts.length < 3 || tikiIdParts.length > 4) {
      return NextResponse.json({
        success: false,
        error: 'Invalid TIKI ID format'
      }, { status: 400 });
    }

    const emailPrefix = tikiIdParts[1]; // AMIR from all formats
    let idSuffix;
    
    if (tikiIdParts.length === 3) {
      // Format 1 & 2: TIKI-AMIR-1F1FFFE0 or TIKI-AMIR-11661526 (4-8 format)
      idSuffix = tikiIdParts[2]; // 1F1FFFE0 or 11661526
    } else {
      // Format 3: TIKI-AMIR-1166-1526 (4-4-4 format)
      idSuffix = tikiIdParts[2] + tikiIdParts[3]; // 11661526
    }
    
    console.log('🔍 Transfer Simple API: Parsed TIKI ID parts:', { emailPrefix, idSuffix, format: tikiIdParts.length === 3 ? '4-8' : '4-4-4' });
    
    // Search for user by email prefix and ID suffix
    let recipient = null;
    let allUsers = [];
    
    try {
      // Get all users and search for matching TIKI ID
      allUsers = await databaseHelpers.user.getAllUsers();
      console.log('🔍 Transfer Simple API: Searching through', allUsers.length, 'users');
      
      for (const user of allUsers) {
        // Generate TIKI ID for this user using the same logic as auth-context (4-8 format)
        const userEmailPrefix = user.email.split('@')[0].toUpperCase().substring(0, 4);
        const userIdSuffix = user.id.substring(0, 8).toUpperCase();
        const userTikiId = `TIKI-${userEmailPrefix}-${userIdSuffix}`;
        
        console.log('🔍 Transfer Simple API: Checking user:', { 
          id: user.id, 
          email: user.email, 
          generatedTikiId: userTikiId,
          targetTikiId: recipientTikiId,
          emailPrefix: userEmailPrefix,
          idSuffix: userIdSuffix
        });
        
        // Check if the target TIKI ID matches this user's generated TIKI ID
        if (userTikiId === recipientTikiId) {
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
        
        // Fallback: Check if email prefix matches (for dashboard TIKI ID format)
        // This is a security risk - we should not automatically match by email prefix
        // Instead, we'll log this as a potential issue and require exact match
        if (userEmailPrefix === emailPrefix) {
          console.log('⚠️ Transfer Simple API: Found email prefix match but TIKI ID does not match exactly');
          console.log('⚠️ This could be a security issue - TIKI ID mismatch detected');
        }
      }
    } catch (searchError) {
      console.error('❌ Transfer Simple API: Error searching users:', searchError);
    }
    
    if (!recipient) {
      console.log('❌ Transfer Simple API: Recipient not found for TIKI ID:', recipientTikiId);
      console.log('🔍 Transfer Simple API: Searched for:', { emailPrefix, idSuffix });
      
      // Generate list of available TIKI IDs for better error message
      const availableTikiIds = allUsers.map(u => {
        const userEmailPrefix = u.email.split('@')[0].toUpperCase().substring(0, 4);
        const userIdSuffix = u.id.substring(0, 8).toUpperCase();
        return {
          email: u.email,
          name: u.name,
          tikiId: `TIKI-${userEmailPrefix}-${userIdSuffix}`
        };
      });
      
      console.log('🔍 Transfer Simple API: Available users with TIKI IDs:', availableTikiIds);
      
        return NextResponse.json({
          success: false,
        error: `Recipient not found. The TIKI ID "${recipientTikiId}" does not exist in the system.`,
        availableTikiIds: availableTikiIds.slice(0, 10), // Show first 10 for reference
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
      tikiBalance: senderWallet.tikiBalance 
    });
    console.log('📊 Transfer Simple API: Recipient wallet before:', { 
      id: recipientWallet.id, 
      balance: recipientWallet.balance, 
      tikiBalance: recipientWallet.tikiBalance 
    });
    
    // Update sender's wallet (decrease TIKI balance by full amount + fee)
    const totalDeducted = numericAmount + fee;
    const newSenderTikiBalance = senderWallet.tikiBalance - totalDeducted;
    console.log('🔽 Transfer Simple API: Updating sender wallet...', { 
      userId: session.id, 
      amount: numericAmount,
      fee: fee,
      totalDeducted: totalDeducted,
      newTikiBalance: newSenderTikiBalance 
    });
    
    // Use direct SQL update for sender
      await databaseHelpers.pool.query(`
        UPDATE wallets 
        SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
    `, [newSenderTikiBalance, session.id]);
    console.log('✅ Transfer Simple API: Sender wallet updated via direct SQL');
    
    // Update recipient's wallet (increase TIKI balance by net amount)
    const newRecipientTikiBalance = recipientWallet.tikiBalance + net;
    console.log('🔼 Transfer Simple API: Updating recipient wallet...', { 
      userId: recipient.id, 
      netAmount: net,
      newTikiBalance: newRecipientTikiBalance 
    });
    
    // Use direct SQL update for recipient
        await databaseHelpers.pool.query(`
          UPDATE wallets 
          SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
    `, [newRecipientTikiBalance, recipient.id]);
    console.log('✅ Transfer Simple API: Recipient wallet updated via direct SQL');
    
    // Credit fee to admin wallet
    if (fee > 0) {
      await creditFeeToAdmin(databaseHelpers.pool, fee);
      console.log('💰 Transfer Simple API: Fee credited to admin wallet:', fee);
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
      netAmount: net,
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
      tikiBalance: finalSenderWallet.tikiBalance 
    });
    console.log('📊 Transfer Simple API: Final recipient wallet:', { 
      id: finalRecipientWallet.id, 
      tikiBalance: finalRecipientWallet.tikiBalance 
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
        senderTikiBalance: finalSenderWallet.tikiBalance,
        recipientTikiBalance: finalRecipientWallet.tikiBalance
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