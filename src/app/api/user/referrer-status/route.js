import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.id;

    // Get user to check if they have a referrer
    const user = await databaseHelpers.user.getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasReferrer: !!user.referrerId,
      referrerId: user.referrerId || null
    });

  } catch (error) {
    console.error('Error checking referrer status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check referrer status' },
      { status: 500 }
    );
  }
}

