import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    // Get current user
    const user = await authHelpers.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the notification first to check if user has access
    const notification = await databaseHelpers.notifications.getNotification(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if user has access to this notification
    if (notification.userId && notification.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Mark as read
    const updatedNotification = await databaseHelpers.notifications.markAsRead(id);

    return NextResponse.json({
      success: true,
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}



