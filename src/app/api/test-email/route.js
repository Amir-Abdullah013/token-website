import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid build-time issues
    const { testEmailConfig } = await import('../../../lib/email-service-simple.js');
    const result = await testEmailConfig();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Email configuration test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Email configuration test failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
