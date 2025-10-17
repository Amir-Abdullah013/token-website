import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

// Get specific notification
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: notificationId } = await params;

    console.log('📬 Fetching notification:', notificationId);

    // Get notification using database helper
    const notification = await databaseHelpers.notification.getNotificationById(notificationId);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    console.log('✅ Notification fetched successfully:', notification.id);

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// Update notification
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: notificationId } = await params;
    const { title, message, type } = await request.json();

    if (!title || !message || !type) {
      return NextResponse.json(
        { success: false, error: 'Title, message, and type are required' },
        { status: 400 }
      );
    }

    if (!['INFO', 'SUCCESS', 'WARNING', 'ALERT'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    console.log('📝 Updating notification:', notificationId);

    // Check if notification exists
    const existingNotification = await databaseHelpers.notification.getNotificationById(notificationId);
    if (!existingNotification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification using database helper
    const updatedNotification = await databaseHelpers.notification.updateNotification(notificationId, {
      title,
      message,
      type
    });

    console.log('✅ Notification updated successfully:', updatedNotification.id);

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// Delete notification
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: notificationId } = await params;

    console.log('🗑️ Deleting notification:', notificationId);

    // Check if notification exists
    const existingNotification = await databaseHelpers.notification.getNotificationById(notificationId);
    if (!existingNotification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete notification using database helper
    const deletedNotification = await databaseHelpers.notification.deleteNotification(notificationId);

    console.log('✅ Notification deleted successfully:', deletedNotification.id);

    return NextResponse.json({
      success: true,
      notification: deletedNotification,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
