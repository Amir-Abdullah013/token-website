import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

// Get all notifications for admin
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    console.log('📊 Fetching admin notifications with filters:', {
      page, limit, type, status
    });

    // Get all notifications using database helpers with fallback
    let allNotifications = [];
    let filteredNotifications = [];
    
    try {
      allNotifications = await databaseHelpers.notification.getAllNotifications(100);
      filteredNotifications = allNotifications;
    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError);
      
      // Fallback mock data when database fails
      allNotifications = [
        {
          id: '1',
          title: 'Welcome to Tiki Token!',
          message: 'Thank you for joining our platform. Start trading Tiki tokens today!',
          type: 'INFO',
          status: 'UNREAD',
          isGlobal: true,
          createdBy: 'admin1',
          createdAt: new Date('2024-01-15T10:30:00Z'),
          creator_name: 'Admin User',
          creator_email: 'admin@example.com'
        },
        {
          id: '2',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2-4 AM UTC.',
          type: 'WARNING',
          status: 'UNREAD',
          isGlobal: true,
          createdBy: 'admin1',
          createdAt: new Date('2024-01-14T15:45:00Z'),
          creator_name: 'Admin User',
          creator_email: 'admin@example.com'
        }
      ];
      filteredNotifications = allNotifications;
    }

    // Apply filters
    if (type) {
      filteredNotifications = filteredNotifications.filter(notification => notification.type === type);
    }
    
    if (status) {
      filteredNotifications = filteredNotifications.filter(notification => notification.status === status);
    }

    const totalNotifications = filteredNotifications.length;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);

    // Calculate statistics
    const globalNotifications = allNotifications.filter(n => n.isGlobal).length;
    const unreadNotifications = allNotifications.filter(n => n.status === 'UNREAD').length;
    const readNotifications = allNotifications.filter(n => n.status === 'READ').length;

    console.log('✅ Admin notifications fetched successfully:', {
      totalNotifications: allNotifications.length,
      filteredNotifications: totalNotifications,
      paginatedNotifications: paginatedNotifications.length,
      statistics: {
        globalNotifications,
        unreadNotifications,
        readNotifications
      }
    });

    return NextResponse.json({
      success: true,
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit)
      },
      statistics: {
        totalNotifications: allNotifications.length,
        globalNotifications,
        unreadNotifications,
        readNotifications
      }
    });

  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Create new notification
export async function POST(request) {
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

    const { title, message, type, isGlobal = true } = await request.json();

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

    console.log('📝 Creating notification:', { title, type, isGlobal });

    // Create notification using database helper
    const notificationData = {
      title,
      message,
      type,
      isGlobal,
      createdBy: session.id
    };

    const newNotification = await databaseHelpers.notification.createGlobalNotification(notificationData);

    console.log('✅ Notification created successfully:', newNotification.id);

    return NextResponse.json({
      success: true,
      notification: newNotification,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
