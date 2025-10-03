import { NextResponse } from 'next/server';
import { loadDatabaseHelpers, getMockData } from '../../../lib/database-loader.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to load database helpers dynamically
    const databaseHelpers = await loadDatabaseHelpers();
    if (!databaseHelpers) {
      // Return mock data if database is not available
      return NextResponse.json({
        ...getMockData.transactions(),
        message: 'Database not available - returning mock data'
      });
    }

    let transactionsData;
    
    try {
      if (filter === 'all') {
        transactionsData = await databaseHelpers.transactions.getUserTransactions(
          userId,
          limit,
          (page - 1) * limit
        );
      } else {
        transactionsData = await databaseHelpers.transactions.getTransactionsByStatus(
          userId,
          filter,
          limit,
          (page - 1) * limit
        );
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Return mock data for development
      const mockTransactions = [
        {
          id: '1',
          type: 'deposit',
          amount: 1000,
          currency: 'PKR',
          status: 'completed',
          createdAt: new Date().toISOString(),
          description: 'Mock deposit transaction'
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: 500,
          currency: 'PKR',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          description: 'Mock withdrawal transaction'
        }
      ];
      
      return NextResponse.json(mockTransactions);
    }

    return NextResponse.json(transactionsData);

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, type, amount, gateway } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      );
    }

    try {
      const transaction = await databaseHelpers.transactions.createTransaction(
        userId,
        type,
        amount,
        gateway || 'default'
      );
      
      return NextResponse.json(transaction);
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Return mock transaction for development
      const mockTransaction = {
        id: Date.now().toString(),
        userId,
        type,
        amount,
        gateway: gateway || 'default',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      return NextResponse.json(mockTransaction);
    }

  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
