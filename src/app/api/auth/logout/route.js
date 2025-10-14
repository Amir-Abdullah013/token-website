import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear all session-related cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token', 
      'userSession',
      'oauthSession',
      'session',
      'supabase.auth.token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false, // Allow client-side access for some cookies
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    console.log('✅ All session cookies cleared');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}








