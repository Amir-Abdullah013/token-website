import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';

/**
 * Session validation endpoint
 * Returns current session status and user information
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'No active session found'
      }, { status: 401 });
    }

    const userRole = await getUserRole(session);
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: userRole
      },
      session: {
        id: session.id,
        email: session.email
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Session validation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * Refresh session endpoint
 * Updates session data and returns fresh session info
 */
export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'No active session found'
      }, { status: 401 });
    }

    const userRole = await getUserRole(session);
    
    // Return refreshed session data
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: userRole
      },
      session: {
        id: session.id,
        email: session.email
      },
      refreshed: true
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Session refresh failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
