import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  console.log('🔍 STEP TEST: Testing transfer step by step');
  
  try {
    const session = await getServerSession();
    console.log('🔍 STEP TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('🔍 STEP TEST: Request body:', body);
    
    const { recipientEmail, amount, note } = body;
    const numericAmount = parseFloat(amount);
    
    // Step 1: Basic validation
    console.log('🔍 STEP TEST: Step 1 - Basic validation');
    if (!recipientEmail || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        step: 1
      }, { status: 400 });
    }
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        step: 1
      }, { status: 400 });
    }
    
    if (session.email === recipientEmail) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send to yourself',
        step: 1
      }, { status: 400 });
    }
    
    // Step 2: Check sender wallet
    console.log('🔍 STEP TEST: Step 2 - Check sender wallet');
    let senderWallet;
    try {
      senderWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
      console.log('🔍 STEP TEST: Sender wallet:', senderWallet);
    } catch (error) {
      console.log('🔍 STEP TEST: Sender wallet error:', error.message);
      // Try to create wallet
      try {
        senderWallet = await databaseHelpers.wallet.createWallet(session.id);
        console.log('🔍 STEP TEST: Sender wallet created:', senderWallet);
      } catch (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create sender wallet',
          details: createError.message,
          step: 2
        }, { status: 500 });
      }
    }
    
    if (!senderWallet) {
      return NextResponse.json({
        success: false,
        error: 'Sender wallet not found',
        step: 2
      }, { status: 400 });
    }
    
    // Step 3: Check balance
    console.log('🔍 STEP TEST: Step 3 - Check balance');
    if (senderWallet.tikiBalance < numericAmount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient balance',
        details: {
          currentBalance: senderWallet.tikiBalance,
          requestedAmount: numericAmount
        },
        step: 3
      }, { status: 400 });
    }
    
    // Step 4: Check recipient
    console.log('🔍 STEP TEST: Step 4 - Check recipient');
    let recipient;
    try {
      recipient = await databaseHelpers.user.getUserByEmail(recipientEmail);
      console.log('🔍 STEP TEST: Recipient found:', recipient);
    } catch (error) {
      console.log('🔍 STEP TEST: Recipient lookup error:', error.message);
    }
    
    if (!recipient) {
      // Create mock recipient
      recipient = {
        id: 'mock-recipient-id',
        email: recipientEmail,
        name: 'Test Recipient'
      };
      console.log('🔍 STEP TEST: Mock recipient created:', recipient);
    }
    
    // Step 5: Check recipient wallet
    console.log('🔍 STEP TEST: Step 5 - Check recipient wallet');
    let recipientWallet;
    try {
      recipientWallet = await databaseHelpers.wallet.getWalletByUserId(recipient.id);
      console.log('🔍 STEP TEST: Recipient wallet:', recipientWallet);
    } catch (error) {
      console.log('🔍 STEP TEST: Recipient wallet error:', error.message);
      // Try to create wallet
      try {
        recipientWallet = await databaseHelpers.wallet.createWallet(recipient.id);
        console.log('🔍 STEP TEST: Recipient wallet created:', recipientWallet);
      } catch (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create recipient wallet',
          details: createError.message,
          step: 5
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'All steps completed successfully',
      data: {
        sender: {
          id: session.id,
          email: session.email,
          walletBalance: senderWallet.tikiBalance
        },
        recipient: {
          id: recipient.id,
          email: recipient.email,
          walletBalance: recipientWallet?.tikiBalance || 0
        },
        transfer: {
          amount: numericAmount,
          note: note || null
        }
      }
    });
    
  } catch (error) {
    console.error('❌ STEP TEST: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
