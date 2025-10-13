import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    
    return NextResponse.json({
      success: true,
      role: userRole,
      userId: session.id
    });

  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check user role' },
      { status: 500 }
    );
  }
}







