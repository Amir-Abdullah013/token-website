import { NextResponse } from 'next/server';
export async function GET(request) {
  try {
    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In development mode, return mock data if database is not available
    if (process.env.NODE_ENV === 'development') {
      const mockWallet = {
        id: 'mock-wallet-id',
        userId: userId,
        balance: 12500.50,
        currency: 'PKR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockStatistics = {
        totalDeposits: 15000.00,
        totalWithdrawals: 2500.00,
        totalTrades: 15,
        profitLoss: 12500.50
      };

      return NextResponse.json({ 
        wallet: mockWallet,
        statistics: mockStatistics,
        lastUpdated: new Date().toISOString()
      });
    }

    // Production mode - use actual database
    try {
    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }
      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        const newWallet = await prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: 'PKR'
          }
        });
        return NextResponse.json({ 
          wallet: newWallet,
          statistics: {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalTrades: 0,
            profitLoss: 0
          }
        });
      }

      // Get user's transactions for statistics
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate statistics
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalTrades = transactions.filter(t => t.type === 'trade').length;

      const profitLoss = totalDeposits - totalWithdrawals;

      const statistics = {
        totalDeposits,
        totalWithdrawals,
        totalTrades,
        profitLoss
      };

      return NextResponse.json({ 
        wallet,
        statistics,
        lastUpdated: wallet.updatedAt || new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data if database is not available
      const mockWallet = {
        id: 'fallback-wallet-id',
        userId: userId,
        balance: 0,
        currency: 'PKR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockStatistics = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalTrades: 0,
        profitLoss: 0
      };

      return NextResponse.json({ 
        wallet: mockWallet,
        statistics: mockStatistics,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching wallet overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet overview' },
      { status: 500 }
    );
  }
}
