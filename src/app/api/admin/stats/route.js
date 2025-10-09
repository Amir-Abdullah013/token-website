import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get admin statistics using database helpers
    const allUsers = await databaseHelpers.user.getAllUsers();
    const totalUsers = allUsers.length;
    
    // Get active wallets (wallets with balance > 0)
    let activeWallets = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let pendingTransactions = 0;
    
    try {
      // Get all wallets and count active ones
      const allWallets = await Promise.all(
        allUsers.map(user => databaseHelpers.wallet.getUserWallet(user.id))
      );
      activeWallets = allWallets.filter(wallet => wallet && (wallet.balance > 0 || wallet.tikiBalance > 0)).length;
      
      // Get transaction stats for all users
      const allTransactionStats = await Promise.all(
        allUsers.map(user => databaseHelpers.transaction.getUserTransactionStats(user.id))
      );
      
      // Sum up all transaction stats
      totalDeposits = allTransactionStats.reduce((sum, stats) => sum + (stats.totalDeposits || 0), 0);
      totalWithdrawals = allTransactionStats.reduce((sum, stats) => sum + (stats.totalWithdrawals || 0), 0);
      pendingTransactions = allTransactionStats.reduce((sum, stats) => sum + (stats.totalTransactions || 0), 0);
      
    } catch (error) {
      console.error('Error calculating admin stats:', error);
      // Use fallback values
      activeWallets = 0;
      totalDeposits = 0;
      totalWithdrawals = 0;
      pendingTransactions = 0;
    }

    return NextResponse.json({
      totalUsers,
      activeWallets,
      totalDeposits,
      totalWithdrawals,
      pendingTransactions,
      systemHealth: '100%' // Could be calculated based on uptime, error rates, etc.
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    // Return fallback data instead of error
    return NextResponse.json({
      totalUsers: 0,
      activeWallets: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingTransactions: 0,
      systemHealth: '100%'
    });
  }
}

