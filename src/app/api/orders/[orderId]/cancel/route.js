import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Get the order to verify ownership
    const order = await databaseHelpers.order.getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns the order or is an admin
    if (order.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this order' },
        { status: 403 }
      );
    }

    // Check if order can be canceled
    if (order.status === 'FILLED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a filled order' },
        { status: 400 }
      );
    }

    if (order.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: 'Order is already canceled' },
        { status: 400 }
      );
    }

    // Cancel the order
    const canceledOrder = await databaseHelpers.order.cancelOrder(orderId);

    if (!canceledOrder) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel order' },
        { status: 500 }
      );
    }

    console.log('✅ Order canceled:', {
      orderId,
      userId: session.id,
      orderType: order.orderType,
      amount: order.amount
    });

    return NextResponse.json({
      success: true,
      message: 'Order canceled successfully',
      order: {
        id: canceledOrder.id,
        status: canceledOrder.status,
        canceledAt: canceledOrder.canceledAt
      }
    });

  } catch (error) {
    console.error('Error canceling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order', details: error.message },
      { status: 500 }
    );
  }
}


