import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  console.log('🔍 DEBUG: Transfer API Debug Endpoint');
  
  try {
    // Test 1: Basic request parsing
    console.log('🔍 DEBUG: Testing request parsing...');
    const body = await request.json();
    console.log('🔍 DEBUG: Request body:', body);
    
    // Test 2: Session check
    console.log('🔍 DEBUG: Testing session...');
    const session = await getServerSession();
    console.log('🔍 DEBUG: Session:', { 
      hasSession: !!session, 
      sessionId: session?.id, 
      sessionEmail: session?.email 
    });
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        debug: 'Session test failed'
      }, { status: 401 });
    }
    
    // Test 3: Database connection
    console.log('🔍 DEBUG: Testing database connection...');
    if (!databaseHelpers.pool) {
      return NextResponse.json({
        success: false,
        error: 'Database pool not available',
        debug: 'Database pool test failed'
      }, { status: 500 });
    }
    
    // Test 4: Database query
    console.log('🔍 DEBUG: Testing database query...');
    const dbTest = await databaseHelpers.pool.query('SELECT 1 as test');
    console.log('🔍 DEBUG: Database test result:', dbTest.rows[0]);
    
    // Test 5: User lookup
    console.log('🔍 DEBUG: Testing user lookup...');
    let user = await databaseHelpers.user.getUserByEmail(session.email);
    console.log('🔍 DEBUG: User found:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email 
    });
    
    // Test 5.5: Create user if not found
    if (!user) {
      console.log('🔍 DEBUG: Creating user...');
      try {
        user = await databaseHelpers.user.createUser({
          email: session.email,
          password: null,
          name: session.name || 'User',
          emailVerified: true,
          role: 'USER'
        });
        console.log('🔍 DEBUG: User created:', user.id);
      } catch (createError) {
        console.log('🔍 DEBUG: User creation failed:', createError.message);
      }
    }
    
    // Test 6: Wallet lookup
    console.log('🔍 DEBUG: Testing wallet lookup...');
    let wallet;
    try {
      wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
      console.log('🔍 DEBUG: Wallet found:', { 
        hasWallet: !!wallet, 
        balance: wallet?.tikiBalance 
      });
    } catch (walletError) {
      console.log('🔍 DEBUG: Wallet error:', walletError.message);
      // Try to create wallet
      try {
        wallet = await databaseHelpers.wallet.createWallet(session.id);
        console.log('🔍 DEBUG: Wallet created:', wallet?.id);
      } catch (createError) {
        console.log('🔍 DEBUG: Wallet creation failed:', createError.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug test completed',
      debug: {
        session: !!session,
        database: !!databaseHelpers.pool,
        user: !!user,
        wallet: !!wallet,
        requestBody: body
      }
    });
    
  } catch (error) {
    console.error('❌ DEBUG: Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
