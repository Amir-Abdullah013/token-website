import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Dynamic import to avoid build-time issues
    const { databaseHelpers } = await import('../../../lib/database.js');
    
    // Test database connection
    await databaseHelpers.user.getUserByEmail('test@example.com');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful! You can now use the authentication system.'
    });

  } catch (error) {
    console.error('Database setup error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Database setup failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}