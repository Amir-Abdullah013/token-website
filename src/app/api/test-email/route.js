import { NextResponse } from 'next/server';
const { testEmailConfig } = require('../../../lib/email-service-simple.js');

export async function GET() {
  try {
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
