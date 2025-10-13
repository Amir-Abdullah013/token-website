import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

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

    // Use the existing database connection instead of Prisma
    try {
      const count = await databaseHelpers.notification.getUnreadCount(userId);
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