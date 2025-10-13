import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';

export async function GET() {
  try {
    const session = await getServerSession();
    const userRole = await getUserRole(session);
    
    return NextResponse.json({
      success: true,
      session: session ? {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role
      } : null,
      userRole,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        session: null,
        userRole: null
      },
      { status: 500 }
    );
  }
}







