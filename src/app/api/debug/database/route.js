import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

export async function GET() {
  try {
    // Test basic database connection
    const result = await databaseHelpers.user.getAllUsers();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: result.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug database error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}







