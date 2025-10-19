import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET() {
  try {
    console.log('🧪 Testing admin withdrawals API...');
    
    const session = await getServerSession();
    console.log('🧪 Session:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Test 1: Check if we can get transactions
    console.log('🧪 Test 1: Getting all transactions...');
    const allTransactions = await databaseHelpers.transaction.getAllTransactions();
    console.log('🧪 All transactions count:', allTransactions.data?.length || 0);

    // Test 2: Check if we can get withdrawal transactions
    console.log('🧪 Test 2: Getting withdrawal transactions...');
    const withdrawals = await databaseHelpers.transaction.getAllTransactions({
      type: 'WITHDRAW',
      page: 1,
      limit: 10
    });
    console.log('🧪 Withdrawal transactions count:', withdrawals.data?.length || 0);

    // Test 3: Check if we can get transaction stats
    console.log('🧪 Test 3: Getting transaction stats...');
    const stats = await databaseHelpers.transaction.getTransactionStats('WITHDRAW');
    console.log('🧪 Transaction stats:', stats);

    return NextResponse.json({
      success: true,
      message: 'Admin withdrawals API test completed',
      results: {
        allTransactions: allTransactions.data?.length || 0,
        withdrawals: withdrawals.data?.length || 0,
        stats: stats
      },
      data: {
        allTransactions: allTransactions.data || [],
        withdrawals: withdrawals.data || [],
        stats: stats || {}
      }
    });

  } catch (error) {
    console.error('❌ Admin withdrawals API test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Admin withdrawals API test failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}






