import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔧 Ensuring user exists:', { userId: session.id, email: session.email });

    // Check if user exists
    let user = await databaseHelpers.user.getUserById(session.id);
    
    if (!user) {
      console.log('⚠️ User not found, creating user...');
      
      // Create user with session data
      user = await databaseHelpers.user.createUser({
        email: session.email || 'user@example.com',
        password: 'temp-password',
        name: session.name || 'User',
        emailVerified: true,
        role: 'USER'
      });
      
      console.log('✅ User created:', { userId: user.id, email: user.email });
    } else {
      console.log('✅ User already exists:', { userId: user.id, email: user.email });
    }

    // Ensure wallet exists
    let wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    
    if (!wallet) {
      console.log('⚠️ Wallet not found, creating wallet...');
      
      wallet = await databaseHelpers.wallet.createWallet(session.id, 'USD');
      
      console.log('✅ Wallet created:', { walletId: wallet.id, userId: wallet.userId });
    } else {
      console.log('✅ Wallet already exists:', { walletId: wallet.id, balance: wallet.balance });
    }

    return NextResponse.json({
      success: true,
      message: 'User and wallet ensured',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        currency: wallet.currency
      }
    });

  } catch (error) {
    console.error('❌ Error ensuring user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to ensure user',
        details: error.message 
      },
      { status: 500 }
    );
  }
}






