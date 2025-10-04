import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to load Prisma dynamically
    let prisma;
    try {
      const prismaModule = await import('../../../../lib/prisma.js');
      prisma = prismaModule.prisma;
    } catch (error) {
      console.warn('Prisma not available:', error.message);
      // Return mock count when database is unavailable
      return NextResponse.json({ count: 2 });
    }

    // Try to get unread count from database
    try {
      const count = await prisma.notification.count({
        where: {
          OR: [
            { userId, status: 'UNREAD' },
            { userId: null, status: 'UNREAD' }
          ]
        }
      });

      return NextResponse.json({ count });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock count when database query fails
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