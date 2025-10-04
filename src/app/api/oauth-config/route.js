import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the correct base URL for the current environment
    let baseUrl;
    
    // Priority 1: NEXT_PUBLIC_NEXTAUTH_URL (most reliable)
    if (process.env.NEXT_PUBLIC_NEXTAUTH_URL) {
      baseUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    }
    // Priority 2: VERCEL_URL (server-side detection)
    else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    // Priority 3: Development fallback
    else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    }
    // Priority 4: Final fallback
    else {
      baseUrl = 'http://localhost:3000';
    }

    const oauthConfig = {
      baseUrl,
      oauthCallback: `${baseUrl}/api/auth/oauth-callback`,
      googleOAuth: `${baseUrl}/api/auth/oauth/google`,
      signinUrl: `${baseUrl}/auth/signin`,
      dashboardUrl: `${baseUrl}/user/dashboard`,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
        isVercel: !!process.env.VERCEL_URL,
        isProduction: process.env.NODE_ENV === 'production',
        hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        hasNextAuthUrl: !!process.env.NEXT_PUBLIC_NEXTAUTH_URL
      }
    };

    return NextResponse.json({
      success: true,
      config: oauthConfig,
      message: 'OAuth configuration retrieved successfully'
    });

  } catch (error) {
    console.error('OAuth config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get OAuth configuration',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
