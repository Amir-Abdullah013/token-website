
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin status from database
    const user = await databaseHelpers.user.getUserById(session.id);
    const isAdmin = user && (user.isAdmin === true || user.role === 'ADMIN');

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized Access' },
        { status: 403 }
      );
    }

    // Fetch Plan Purchases
    const query = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t."userId" = u.id
      WHERE t.gateway = 'PLAN_PURCHASE'
      ORDER BY t."createdAt" DESC
    `;
    
    // Fetch stats
    const statsQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_volume,
        SUM("feeAmount") as total_fees
      FROM transactions
      WHERE gateway = 'PLAN_PURCHASE'
    `;

    const [transactionsResult, statsResult] = await Promise.all([
      databaseHelpers.pool.query(query),
      databaseHelpers.pool.query(statsQuery)
    ]);

    const transactions = transactionsResult.rows;
    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      transactions,
      statistics: {
        totalPurchases: parseInt(stats.count || 0),
        totalVolume: parseFloat(stats.total_volume || 0),
        totalFees: parseFloat(stats.total_fees || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching admin plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan data' },
      { status: 500 }
    );
  }
}
