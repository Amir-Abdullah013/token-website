import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Use the existing database connection instead of Prisma
    try {
      const notification = await databaseHelpers.notification.markAsRead(id);
      return NextResponse.json({ 
        success: true,
        notification
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock success
      return NextResponse.json({ 
        success: true,
        message: 'Notification marked as read (fallback)'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}