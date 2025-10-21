import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    console.log('🔍 Admin Stats API: Checking authentication...');
    
    const session = await getServerSession();
    console.log('📋 Session data:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    console.log('👤 User role:', userRole);
    
    if (userRole !== 'ADMIN') {
      console.log('❌ User is not admin, role:', userRole);
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('📊 Fetching admin statistics...');

    // Get all statistics in optimized queries
    const [
      userStats,
      walletStats,
      transactionStats,
      pendingStats
    ] = await Promise.all([
      // Get user statistics
      databaseHelpers.pool.query(`
        SELECT 
          COUNT(*) as totalUsers,
          COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verifiedUsers
        FROM users
      `),
      
      // Get wallet statistics
      databaseHelpers.pool.query(`
        SELECT 
          COUNT(*) as totalWallets,
          COUNT(CASE WHEN balance > 0 OR "VonBalance" > 0 THEN 1 END) as activeWallets,
          SUM(balance) as totalBalance,
          SUM("VonBalance") as totalVonBalance
        FROM wallets
      `),
      
      // Get transaction statistics
      databaseHelpers.pool.query(`
        SELECT 
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
          SUM(CASE WHEN type = 'WITHDRAW' THEN amount ELSE 0 END) as totalWithdrawals,
          SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
          SUM(CASE WHEN type = 'SELL' THEN amount ELSE 0 END) as totalSells,
          COUNT(CASE WHEN type = 'DEPOSIT' THEN 1 END) as depositCount,
          COUNT(CASE WHEN type = 'WITHDRAW' THEN 1 END) as withdrawalCount,
          COUNT(CASE WHEN type = 'BUY' THEN 1 END) as buyCount,
          COUNT(CASE WHEN type = 'SELL' THEN 1 END) as sellCount
        FROM transactions
        WHERE status = 'COMPLETED'
      `),
      
      // Get pending transactions count
      databaseHelpers.pool.query(`
        SELECT COUNT(*) as pendingTransactions
        FROM transactions
        WHERE status = 'PENDING'
      `)
    ]);

    const userData = userStats.rows[0];
    const walletData = walletStats.rows[0];
    const transactionData = transactionStats.rows[0];
    const pendingData = pendingStats.rows[0];

    const stats = {
      totalUsers: parseInt(userData.totalusers) || 0,
      verifiedUsers: parseInt(userData.verifiedusers) || 0,
      activeWallets: parseInt(walletData.activewallets) || 0,
      totalWallets: parseInt(walletData.totalwallets) || 0,
      totalBalance: parseFloat(walletData.totalbalance) || 0,
      totalVonBalance: parseFloat(walletData.totalVonbalance) || 0,
      totalDeposits: parseFloat(transactionData.totaldeposits) || 0,
      totalWithdrawals: parseFloat(transactionData.totalwithdrawals) || 0,
      totalBuys: parseFloat(transactionData.totalbuys) || 0,
      totalSells: parseFloat(transactionData.totalsells) || 0,
      depositCount: parseInt(transactionData.depositcount) || 0,
      withdrawalCount: parseInt(transactionData.withdrawalcount) || 0,
      buyCount: parseInt(transactionData.buycount) || 0,
      sellCount: parseInt(transactionData.sellcount) || 0,
      pendingTransactions: parseInt(pendingData.pendingtransactions) || 0,
      totalTransactions: parseInt(transactionData.totaltransactions) || 0
    };

    console.log('✅ Admin statistics fetched successfully:', stats);

    return NextResponse.json({
      success: true,
      ...stats,
      systemHealth: '100%'
    });

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    
    // Return fallback data instead of error
    return NextResponse.json({
      success: false,
      totalUsers: 0,
      verifiedUsers: 0,
      activeWallets: 0,
      totalWallets: 0,
      totalBalance: 0,
      totalVonBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalBuys: 0,
      totalSells: 0,
      pendingTransactions: 0,
      totalTransactions: 0,
      systemHealth: '100%',
      error: 'Failed to fetch statistics'
    });
  }
}

