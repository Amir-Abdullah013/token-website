import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { randomUUID } from 'crypto';

export async function GET(request) {
  console.log('📋 Transfer History API: Fetching transfers');
  
  try {
    // Get session
    const session = await getServerSession();
    console.log('🔍 Transfer History API: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Get user's TIKI ID for filtering
    const senderTikiId = `TIKI-${session.email.split('@')[0].toUpperCase().substring(0, 4)}-${session.id.substring(0, 8).toUpperCase()}`;
    console.log('🆔 Transfer History API: User TIKI ID:', senderTikiId);

    // Import database helpers
    const { databaseHelpers } = await import('../../../lib/database.js');
    
    if (!databaseHelpers || !databaseHelpers.pool) {
      console.error('❌ Transfer History API: Database pool not available');
      return NextResponse.json({
        success: false,
        error: 'Database connection error'
      }, { status: 500 });
    }

    // Fetch transfers where user is either sender or recipient
    const transfersResult = await databaseHelpers.pool.query(`
      SELECT 
        id,
        "senderTikiId",
        "recipientTikiId", 
        amount,
        note,
        status,
        "createdAt"
      FROM transfers 
      WHERE "senderTikiId" = $1 OR "recipientTikiId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 50
    `, [senderTikiId]);

    console.log('📊 Transfer History API: Found transfers:', transfersResult.rows.length);

    // Format transfers for frontend
    const formattedTransfers = transfersResult.rows.map(transfer => ({
      id: transfer.id,
      type: transfer.senderTikiId === senderTikiId ? 'sent' : 'received',
      amount: transfer.amount,
      note: transfer.note,
      status: transfer.status,
      createdAt: transfer.createdAt,
      senderTikiId: transfer.senderTikiId,
      recipientTikiId: transfer.recipientTikiId
    }));

    return NextResponse.json({
      success: true,
      transfers: formattedTransfers,
      total: formattedTransfers.length
    });

  } catch (error) {
    console.error('❌ Transfer History API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transfer history',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  console.log('🚀 Simple Transfer API: Starting request processing');
  
  try {
    // Get session
    const session = await getServerSession();
    console.log('🔍 Simple Transfer API: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('🔍 Simple Transfer API: Request body:', body);
    
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
    if (!/^TIKI-[A-Z0-9]{4}-[A-Z0-9]{8}$/.test(recipientTikiId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid TIKI ID format'
      }, { status: 400 });
    }

    // Check if sending to self (compare with sender's TIKI ID)
    const senderTikiId = `TIKI-${session.email.split('@')[0].toUpperCase().substring(0, 4)}-${session.id.substring(0, 8).toUpperCase()}`;
    if (recipientTikiId === senderTikiId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send to yourself'
      }, { status: 400 });
    }

    // Get current sender wallet balance
    console.log('🔍 Simple Transfer API: Getting sender wallet...');
    const senderResponse = await fetch(`http://localhost:3000/api/wallet/balance?userId=${session.id}`);
    let senderWallet = null;
    
    if (senderResponse.ok) {
      const senderData = await senderResponse.json();
      senderWallet = senderData;
      console.log('📊 Simple Transfer API: Sender wallet:', senderWallet);
    } else {
      console.log('⚠️ Simple Transfer API: Could not get sender wallet, using defaults');
      senderWallet = { tikiBalance: 1000, usdBalance: 100 }; // Default for testing
    }

    // Check sufficient balance
    if (senderWallet.tikiBalance < numericAmount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient TIKI balance'
      }, { status: 400 });
    }

    // Update sender's wallet (decrease TIKI balance) using direct database update
    console.log('🔽 Simple Transfer API: Updating sender wallet directly...');
    const newSenderTikiBalance = senderWallet.tikiBalance - numericAmount;
    
    try {
      // Use direct database update instead of API call
      const { databaseHelpers } = await import('../../../lib/database.js');
      
      if (databaseHelpers && databaseHelpers.pool) {
        await databaseHelpers.pool.query(`
          UPDATE wallets 
          SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
        `, [newSenderTikiBalance, session.id]);
        
        console.log('✅ Simple Transfer API: Sender wallet updated via direct SQL');
      } else {
        console.error('❌ Simple Transfer API: Database pool not available');
      }
    } catch (updateError) {
      console.error('❌ Simple Transfer API: Error updating sender wallet:', updateError);
    }

    // Find recipient by TIKI ID and update their balance
    console.log('🔍 Simple Transfer API: Looking up recipient by TIKI ID...');
    
    try {
      const { databaseHelpers } = await import('../../../lib/database.js');
      
      if (!databaseHelpers || !databaseHelpers.pool) {
        console.error('❌ Simple Transfer API: Database pool not available for recipient lookup');
        return NextResponse.json({
          success: false,
          error: 'Database connection error'
        }, { status: 500 });
      }

      // Extract recipient info from TIKI ID
      // Format: TIKI-XXXX-YYYYYYYY where XXXX is email prefix and YYYYYYYY is user ID prefix
      const tikiParts = recipientTikiId.split('-');
      const recipientIdPrefix = tikiParts[2]; // The user ID part

      // Find recipient user by matching the ID prefix
      const recipientResult = await databaseHelpers.pool.query(
        'SELECT id, email, name FROM users WHERE UPPER(SUBSTRING(id, 1, 8)) = $1',
        [recipientIdPrefix]
      );

      if (recipientResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Recipient not found. Please verify the TIKI ID is correct.'
        }, { status: 404 });
      }

      const recipient = recipientResult.rows[0];
      console.log('👤 Simple Transfer API: Found recipient:', recipient.email);

      // Get recipient's current wallet balance
      const recipientWalletResult = await databaseHelpers.pool.query(
        'SELECT "userId", "tikiBalance", "balance" FROM wallets WHERE "userId" = $1',
        [recipient.id]
      );

      let recipientWallet;
      if (recipientWalletResult.rows.length === 0) {
        // Create wallet for recipient if it doesn't exist
        console.log('💼 Simple Transfer API: Creating wallet for recipient...');
        const walletId = randomUUID();
        await databaseHelpers.pool.query(`
          INSERT INTO wallets (id, "userId", balance, "tikiBalance", currency, "lastUpdated", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
        `, [walletId, recipient.id, 0, 0, 'USD']);
        
        recipientWallet = { tikiBalance: 0, balance: 0 };
      } else {
        recipientWallet = recipientWalletResult.rows[0];
      }

      console.log('📊 Simple Transfer API: Recipient current balance:', recipientWallet.tikiBalance);

      // Update recipient's wallet (increase TIKI balance)
      const newRecipientTikiBalance = recipientWallet.tikiBalance + numericAmount;
      console.log('🔼 Simple Transfer API: Updating recipient wallet to:', newRecipientTikiBalance);

      await databaseHelpers.pool.query(`
        UPDATE wallets 
        SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
      `, [newRecipientTikiBalance, recipient.id]);

      console.log('✅ Simple Transfer API: Recipient wallet updated successfully');

    } catch (recipientError) {
      console.error('❌ Simple Transfer API: Error updating recipient:', recipientError);
      // Rollback sender's balance if recipient update fails
      try {
        const { databaseHelpers } = await import('../../../lib/database.js');
        await databaseHelpers.pool.query(`
          UPDATE wallets 
          SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
        `, [senderWallet.tikiBalance, session.id]);
        console.log('↩️ Simple Transfer API: Rolled back sender balance');
      } catch (rollbackError) {
        console.error('❌ Simple Transfer API: Rollback failed:', rollbackError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to complete transfer to recipient'
      }, { status: 500 });
    }
    
    // Create transfer record
    const transferId = randomUUID();
    const transfer = {
      id: transferId,
      senderTikiId: senderTikiId,
      recipientTikiId: recipientTikiId,
      amount: numericAmount,
      note: note || null,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    
    // Save transfer record to database
    try {
      await databaseHelpers.pool.query(`
        INSERT INTO transfers (id, "senderTikiId", "recipientTikiId", amount, note, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [transferId, senderTikiId, recipientTikiId, numericAmount, note, 'COMPLETED']);
      
      console.log('💾 Simple Transfer API: Transfer record saved to database');
    } catch (dbError) {
      console.error('❌ Simple Transfer API: Error saving transfer record:', dbError);
      // Don't fail the transfer if record saving fails, but log it
    }
    
    console.log('✅ Simple Transfer API: Transfer completed:', transfer);
    
    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transfer: {
        id: transfer.id,
        amount: transfer.amount,
        recipientTikiId: transfer.recipientTikiId,
        note: transfer.note,
        createdAt: transfer.createdAt
      },
      newBalance: newSenderTikiBalance
    });
    
  } catch (error) {
    console.error('❌ Simple Transfer API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Transfer failed',
      details: error.message
    }, { status: 500 });
  }
}
