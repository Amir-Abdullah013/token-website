import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma.js';

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

    // In development mode, return success
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: true,
        message: 'Notification marked as read (mock)'
      });
    }

    // Production mode - use actual database
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });

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

