import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Check if user is requesting their own orders or is an admin
    if (session.id !== userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view these orders' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter by status

    // Get user's orders
    const orders = await databaseHelpers.order.getUserOrders(userId, status);

    // Format the orders
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderType: order.orderType,
      priceType: order.priceType,
      amount: parseFloat(order.amount),
      tokenAmount: order.tokenAmount ? parseFloat(order.tokenAmount) : null,
      limitPrice: order.limitPrice ? parseFloat(order.limitPrice) : null,
      status: order.status,
      filledAmount: parseFloat(order.filledAmount || 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      executedAt: order.executedAt,
      canceledAt: order.canceledAt
    }));

    // Get order statistics
    const stats = await databaseHelpers.order.getOrderStats(userId);

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        pending: parseInt(stats.pending_orders),
        filled: parseInt(stats.filled_orders),
        canceled: parseInt(stats.canceled_orders),
        total: parseInt(stats.total_orders)
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}


