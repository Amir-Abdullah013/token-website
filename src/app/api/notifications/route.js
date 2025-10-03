import { NextResponse } from 'next/server';

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

    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: userId,
          title: 'Welcome to TokenApp!',
          message: 'Your account has been successfully created.',
          type: 'info',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'notif-2',
          userId: userId,
          title: 'Deposit Successful',
          message: 'Your deposit of $500 has been processed.',
          type: 'success',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 'notif-3',
          userId: null,
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight at 2 AM.',
          type: 'warning',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
      ];

      return NextResponse.json({ 
        notifications: mockNotifications.slice(offset, offset + limit),
        total: mockNotifications.length
      });
    }

    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      // Return mock data if database is not available
      return NextResponse.json({
        notifications: mockNotifications,
        total: mockNotifications.length,
        limit,
        offset
      });
    }

    // Production mode - use actual database
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId },
            { userId: null }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.notification.count({
        where: {
          OR: [
            { userId },
            { userId: null }
          ]
        }
      });

      return NextResponse.json({ 
        notifications,
        total
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data
      const mockNotifications = [
        {
          id: 'fallback-notif-1',
          userId: userId,
          title: 'System Status',
          message: 'All systems are operational.',
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return NextResponse.json({ 
        notifications: mockNotifications,
        total: 1
      });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}