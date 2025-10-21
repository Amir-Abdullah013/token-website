import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

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

    console.log('📊 Fetching recent activity...');

    // Get recent activities from multiple sources
    const [
      recentUsers,
      recentTransactions,
      recentStaking
    ] = await Promise.all([
      // Get recent user registrations
      databaseHelpers.pool.query(`
        SELECT 
          id,
          name,
          email,
          "createdAt",
          'user_registration' as type
        FROM users 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `),
      
      // Get recent transactions
      databaseHelpers.pool.query(`
        SELECT 
          t.id,
          t.type,
          t.amount,
          t.status,
          t."createdAt",
          u.name as "userName",
          u.email as "userEmail"
        FROM transactions t
        LEFT JOIN users u ON t."userId" = u.id
        ORDER BY t."createdAt" DESC 
        LIMIT 10
      `),
      
      // Get recent staking activities
      databaseHelpers.pool.query(`
        SELECT 
          s.id,
          s."amountStaked",
          s.status,
          s."createdAt",
          u.name as "userName",
          u.email as "userEmail"
        FROM staking s
        LEFT JOIN users u ON s."userId" = u.id
        ORDER BY s."createdAt" DESC 
        LIMIT 5
      `)
    ]);

    // Combine and format activities
    const activities = [];

    // Add user registrations
    recentUsers.rows.forEach(user => {
      activities.push({
        id: user.id,
        type: 'user',
        message: `New user registered: ${user.name}`,
        time: formatTimeAgo(user.createdAt),
        status: 'success',
        data: {
          userName: user.name,
          userEmail: user.email,
          createdAt: user.createdAt
        }
      });
    });

    // Add transactions
    recentTransactions.rows.forEach(transaction => {
      let message = '';
      let status = 'info';
      
      switch (transaction.type) {
        case 'DEPOSIT':
          message = `Deposit of $${transaction.amount} by ${transaction.userName}`;
          status = transaction.status === 'COMPLETED' ? 'success' : 'warning';
          break;
        case 'BUY':
          message = `Von purchase of $${transaction.amount} by ${transaction.userName}`;
          status = transaction.status === 'COMPLETED' ? 'success' : 'warning';
          break;
        default:
          message = `${transaction.type} transaction by ${transaction.userName}`;
          status = 'info';
      }

      activities.push({
        id: transaction.id,
        type: 'transaction',
        message,
        time: formatTimeAgo(transaction.createdAt),
        status,
        data: {
          transactionType: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          userName: transaction.userName,
          createdAt: transaction.createdAt
        }
      });
    });

    // Add staking activities
    recentStaking.rows.forEach(staking => {
      let message = '';
      let status = 'info';
      
      switch (staking.status) {
        case 'ACTIVE':
          message = `New staking of $${staking.amountStaked} by ${staking.userName}`;
          status = 'success';
          break;
        case 'COMPLETED':
          message = `Staking completed for $${staking.amountStaked} by ${staking.userName}`;
          status = 'success';
          break;
        case 'CLAIMED':
          message = `Staking rewards claimed by ${staking.userName}`;
          status = 'success';
          break;
        default:
          message = `Staking activity by ${staking.userName}`;
          status = 'info';
      }

      activities.push({
        id: staking.id,
        type: 'staking',
        message,
        time: formatTimeAgo(staking.createdAt),
        status,
        data: {
          amount: staking.amountStaked,
          status: staking.status,
          userName: staking.userName,
          createdAt: staking.createdAt
        }
      });
    });

    // Sort by creation time (most recent first) and limit to 10
    activities.sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt));
    const recentActivities = activities.slice(0, 10);

    console.log('✅ Recent activity fetched successfully:', recentActivities.length, 'activities');

    return NextResponse.json({
      success: true,
      activities: recentActivities
    });

  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    
    // Return fallback data
    return NextResponse.json({
      success: false,
      activities: [
        { type: 'user', message: 'New user registered', time: '2m ago', status: 'success' },
        { type: 'deposit', message: 'Large deposit processed', time: '15m ago', status: 'info' },
        { type: 'withdrawal', message: 'Withdrawal pending approval', time: '1h ago', status: 'warning' }
      ],
      error: 'Failed to fetch recent activity'
    });
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}
