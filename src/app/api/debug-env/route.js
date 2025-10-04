import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all relevant environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      timestamp: new Date().toISOString()
    };

    // Check which variables are missing
    const missing = [];
    if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
    if (!process.env.NEXT_PUBLIC_NEXTAUTH_URL) missing.push('NEXT_PUBLIC_NEXTAUTH_URL');
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');

    return NextResponse.json({
      success: true,
      environment: envVars,
      missing: missing,
      recommendations: missing.length > 0 ? [
        'Add missing environment variables to Vercel',
        'Redeploy your application',
        'Wait 5-10 minutes for changes to propagate'
      ] : [
        'All required environment variables are set',
        'OAuth should work correctly'
      ]
    });

  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get environment variables',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
