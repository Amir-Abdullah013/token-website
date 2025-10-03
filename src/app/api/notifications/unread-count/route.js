import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma.js';

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

    // In development mode, return mock count
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ count: 2 }); // Mock unread count
    }

    // Production mode - use actual database
    try {
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

