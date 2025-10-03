import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';

// PUT /api/notifications/read-all - Mark all user notifications as read
export async function PUT(request) {
  try {
    // Get current user
    const user = await authHelpers.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all notifications as read
    const result = await databaseHelpers.notifications.markAllAsRead(user.id);

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



