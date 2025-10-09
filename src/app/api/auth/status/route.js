import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the URL to check what server we're hitting
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Import database helpers to check connection
    let dbStatus = 'unknown';
    let userCount = 0;
    
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const users = await databaseHelpers.user.getAllUsers();
      userCount = users.length;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      console.error('Database connection error:', error);
    }
    
    return NextResponse.json({
      success: true,
      server: {
        baseUrl,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: dbStatus,
        userCount
      },
      endpoints: {
        signup: `${baseUrl}/api/auth/signup`,
        signin: `${baseUrl}/api/auth/signin`,
        debug: `${baseUrl}/api/debug/users`
      }
    });
    
  } catch (error) {
    console.error('Auth status error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get auth status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


