import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Return mock data for build compatibility
    const mockOverview = {
      wallet: {
        id: 'wallet-1',
        userId: userId,
        balance: 1000.00,
        currency: 'PKR',
        lastUpdated: new Date().toISOString()
      },
      recentTransactions: [
        {
          id: 'txn-1',
          type: 'DEPOSIT',
          amount: 500.00,
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 'txn-2',
          type: 'WITHDRAW',
          amount: 100.00,
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ],
      statistics: {
        totalDeposits: 1500.00,
        totalWithdrawals: 100.00,
        transactionCount: 2
      }
    };

    return NextResponse.json(mockOverview);
  } catch (error) {
    console.error('Error getting wallet overview:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet overview' },
      { status: 500 }
    );
  }
}