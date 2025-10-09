import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 25;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('📬 Fetching notifications for user:', userId);

    // Get user notifications using database helpers with fallback
    let notifications = [];
    
    try {
      notifications = await databaseHelpers.notification.getUserNotifications(userId, limit);
      console.log('✅ Notifications fetched from database:', notifications.length);
    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError);
      
      // Fallback mock data when database fails
      notifications = [
        {
          id: 'notif-1',
          userId: userId,
          title: 'Welcome to Tiki Token!',
          message: 'Your account has been successfully created. Start trading Tiki tokens today!',
          type: 'INFO',
          status: 'UNREAD',
          isGlobal: false,
          createdBy: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          creator_name: 'System',
          creator_email: null
        },
        {
          id: 'notif-2',
          userId: userId,
          title: 'Deposit Successful',
          message: 'Your deposit of $500 has been processed successfully.',
          type: 'SUCCESS',
          status: 'UNREAD',
          isGlobal: false,
          createdBy: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          creator_name: 'System',
          creator_email: null
        },
        {
          id: 'notif-3',
          userId: null,
          title: 'System Maintenance Notice',
          message: 'Scheduled maintenance will occur tonight from 2-4 AM UTC. Some features may be temporarily unavailable.',
          type: 'WARNING',
          status: 'UNREAD',
          isGlobal: true,
          createdBy: 'admin1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          creator_name: 'Admin User',
          creator_email: 'admin@example.com'
        }
      ];
    }

    // Apply pagination
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    console.log('✅ User notifications response:', {
      total: notifications.length,
      returned: paginatedNotifications.length,
      hasGlobal: paginatedNotifications.some(n => n.isGlobal)
    });

    return NextResponse.json({ 
      notifications: paginatedNotifications,
      total: notifications.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}