import { NextResponse } from 'next/server';

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

    // Return mock data for development since database might not be set up
    const mockTransactions = [
      {
        $id: '1',
        type: 'deposit',
        amount: 1000,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: 'Mock deposit transaction',
        gateway: 'bank_transfer'
      },
      {
        $id: '2',
        type: 'withdrawal',
        amount: 500,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        description: 'Mock withdrawal transaction',
        gateway: 'bank_transfer'
      },
      {
        $id: '3',
        type: 'deposit',
        amount: 2500,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        description: 'Mock deposit transaction',
        gateway: 'credit_card'
      },
      {
        $id: '4',
        type: 'withdrawal',
        amount: 750,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        description: 'Mock withdrawal transaction',
        gateway: 'bank_transfer'
      },
      {
        $id: '5',
        type: 'deposit',
        amount: 5000,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        description: 'Mock deposit transaction',
        gateway: 'wire_transfer'
      }
    ];

    // Filter transactions based on filter parameter
    let filteredTransactions = mockTransactions;
    if (filter !== 'all') {
      filteredTransactions = mockTransactions.filter(tx => tx.status === filter);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    return NextResponse.json({
      transactions: paginatedTransactions,
      total: filteredTransactions.length,
      page,
      limit,
      hasMore: endIndex < filteredTransactions.length
    });

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

    // Return mock transaction for development
    const mockTransaction = {
      $id: Date.now().toString(),
      userId,
      type,
      amount,
      gateway: gateway || 'default',
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Mock ${type} transaction`
    };
    
    return NextResponse.json(mockTransaction);

  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}













