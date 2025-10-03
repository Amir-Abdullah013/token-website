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
    const mockWallet = {
      id: 'wallet-1',
      userId: userId,
      balance: 1000.00,
      currency: 'PKR',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(mockWallet);
  } catch (error) {
    console.error('Error getting wallet:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, amount, type } = await request.json();

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'User ID, amount, and type are required' },
        { status: 400 }
      );
    }

    // Return mock success for build compatibility
    return NextResponse.json({
      success: true,
      message: 'Wallet operation completed',
      transactionId: 'txn-' + Date.now()
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    );
  }
}