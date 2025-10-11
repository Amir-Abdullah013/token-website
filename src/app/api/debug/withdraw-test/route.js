import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    console.log('Session debug:', { session, userRole });

    // Test wallet retrieval
    const userWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    console.log('Wallet debug:', userWallet);

    // Test transaction creation
    const testTransaction = await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'WITHDRAW',
      amount: 10,
      status: 'PENDING',
      gateway: 'Binance',
      binanceAddress: 'test-address-12345678901234567890'
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        email: session.email,
        role: session.role
      },
      userRole,
      wallet: userWallet,
      testTransaction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Withdraw test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}


