import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';

export async function GET() {
  try {
    const user = await getServerSession();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user session found' 
      });
    }

    // Get user info from database
    const { databaseHelpers } = await import('../../../lib/database.js');
    const dbUser = await databaseHelpers.user.getUserByEmail(user.email);
    
    return NextResponse.json({
      success: true,
      sessionUser: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      databaseUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified
      } : null,
      message: 'User role debug info'
    });
    
  } catch (error) {
    console.error('Debug user role error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}





