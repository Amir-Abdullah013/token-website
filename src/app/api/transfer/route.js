import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';
import { handleApiError, handleValidationError, handleAuthError } from '../error-handler';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    const { recipientEmail, amount, note } = await request.json();

    // Validate input
    if (!recipientEmail || !amount) {
      return handleValidationError('Recipient email and amount are required');
    }

    if (amount <= 0) {
      return handleValidationError('Amount must be greater than 0');
    }

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(recipientEmail)) {
      return handleValidationError('Please enter a valid Gmail address');
    }

    // Check if sender and recipient are the same
    if (session.email === recipientEmail) {
      return handleValidationError('You cannot send tokens to yourself');
    }

    // Get sender's wallet
    const senderWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!senderWallet) {
      return handleValidationError('Sender wallet not found');
    }

    // Check sufficient balance
    if (senderWallet.tikiBalance < amount) {
      return handleValidationError('Insufficient TIKI balance');
    }

    // Find recipient by email
    const recipient = await databaseHelpers.user.getUserByEmail(recipientEmail);
    if (!recipient) {
      return handleValidationError('This Gmail is not registered on Tiki');
    }

    // Get recipient's wallet
    const recipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
    if (!recipientWallet) {
      return handleValidationError('Recipient wallet not found');
    }

    // Start database transaction
    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Deduct from sender's wallet
      await client.query(`
        UPDATE wallets 
        SET "tikiBalance" = "tikiBalance" - $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
      `, [amount, session.id]);

      // Add to recipient's wallet
      await client.query(`
        UPDATE wallets 
        SET "tikiBalance" = "tikiBalance" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
        WHERE "userId" = $2
      `, [amount, recipient.id]);

      // Create transfer record
      const transfer = await databaseHelpers.transfer.createTransfer({
        senderId: session.id,
        recipientId: recipient.id,
        senderEmail: session.email,
        recipientEmail: recipientEmail,
        amount: amount,
        note: note || null
      });

      // Create transaction records for both users
      await databaseHelpers.transaction.createTransaction({
        userId: session.id,
        type: 'TRANSFER_SENT',
        amount: amount,
        currency: 'TIKI',
        status: 'COMPLETED',
        gateway: 'Transfer',
        description: `Sent ${amount} TIKI to ${recipientEmail}${note ? ` - ${note}` : ''}`
      });

      await databaseHelpers.transaction.createTransaction({
        userId: recipient.id,
        type: 'TRANSFER_RECEIVED',
        amount: amount,
        currency: 'TIKI',
        status: 'COMPLETED',
        gateway: 'Transfer',
        description: `Received ${amount} TIKI from ${session.email}${note ? ` - ${note}` : ''}`
      });

      // Send notifications
      await databaseHelpers.notification.createNotification({
        userId: session.id,
        title: 'Transfer Sent',
        message: `You successfully sent ${amount} TIKI to ${recipientEmail}`,
        type: 'TRANSFER'
      });

      await databaseHelpers.notification.createNotification({
        userId: recipient.id,
        title: 'Transfer Received',
        message: `You received ${amount} TIKI from ${session.email}`,
        type: 'TRANSFER'
      });

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Transfer successful',
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          recipientEmail: transfer.recipientEmail,
          note: transfer.note,
          createdAt: transfer.createdAt
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    return handleApiError(error, 'Failed to process transfer');
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    const transfers = await databaseHelpers.transfer.getUserTransfers(session.id);

    // Separate sent and received transfers
    const sentTransfers = transfers.filter(t => t.senderId === session.id);
    const receivedTransfers = transfers.filter(t => t.recipientId === session.id);

    return NextResponse.json({
      success: true,
      transfers: {
        sent: sentTransfers,
        received: receivedTransfers,
        all: transfers
      }
    });

  } catch (error) {
    return handleApiError(error, 'Failed to fetch transfers');
  }
}

