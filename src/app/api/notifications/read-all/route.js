import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { getServerSession } from '@/lib/session';

// PUT /api/notifications/read-all - Mark all user notifications as read
export async function PUT(request) {
  try {
    // Get current user from session
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all notifications as read
    const result = await databaseHelpers.notification.markAllAsRead(session.id);

    return NextResponse.json({
      success: true,
      updated: result.updated
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}



