import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../lib/database.js';

export async function GET() {
  try {
    // Test basic database operations
    const testEmail = 'test@example.com';
    
    // Try to get a user (this will fail if database is not connected)
    await databaseHelpers.user.getUserByEmail(testEmail);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection is working properly!'
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    // Check if it's a connection error
    if (error.message.includes('Can\'t reach database server') || 
        error.message.includes('Connection refused') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please check your DATABASE_URL and ensure the database server is running.' 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Database test failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}