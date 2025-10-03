import { NextResponse } from 'next/server';
export async function GET(request) {
  try {
    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In development mode, return mock count
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ count: 2 }); // Mock unread count
    }

    // Production mode - use actual database
    try {
    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }
      const count = await prisma.notification.count({
        where: {
          OR: [
            { userId, isRead: false },
            { userId: null, isRead: false }
          ]
        }
      });

      return NextResponse.json({ count });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock count
      return NextResponse.json({ count: 0 });
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

