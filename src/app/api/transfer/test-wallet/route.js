import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  console.log('🔍 WALLET TEST: Testing wallet creation');
  
  try {
    const session = await getServerSession();
    console.log('🔍 WALLET TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    // Try to get existing wallet
    console.log('🔍 WALLET TEST: Checking existing wallet...');
    let wallet;
    try {
      wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
      console.log('🔍 WALLET TEST: Existing wallet:', wallet);
    } catch (error) {
      console.log('🔍 WALLET TEST: No existing wallet, error:', error.message);
    }
    
    if (!wallet) {
      console.log('🔍 WALLET TEST: Creating new wallet...');
      try {
        wallet = await databaseHelpers.wallet.createWallet(session.id);
        console.log('🔍 WALLET TEST: Wallet created:', wallet);
      } catch (createError) {
        console.error('❌ WALLET TEST: Wallet creation failed:', createError);
        return NextResponse.json({
          success: false,
          error: 'Wallet creation failed',
          details: createError.message,
          code: createError.code,
          constraint: createError.constraint
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Wallet test completed',
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        VonBalance: wallet.VonBalance
      }
    });
    
  } catch (error) {
    console.error('❌ WALLET TEST: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
