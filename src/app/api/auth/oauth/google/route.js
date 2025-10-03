import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';

export async function POST(request) {
  try {
    // Check if Google OAuth is configured
    if (!config.oauth.google.clientId) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.' },
        { status: 400 }
      );
    }

    // Check if we should use alternative redirect URI
    const { searchParams } = new URL(request.url);
    const useAlternative = searchParams.get('alternative') === 'true';

    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Get the base URL - handle both development and production
    let baseUrl;
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (config.urls.base) {
      baseUrl = config.urls.base;
    } else {
      baseUrl = 'http://localhost:3000';
    }
    
    // Construct the redirect URI - use the correct callback for Vercel
    let redirectUri;
    if (useAlternative === 'callback') {
      redirectUri = `${baseUrl}/auth/callback`;
    } else if (useAlternative === 'google') {
      redirectUri = `${baseUrl}/api/auth/callback/google`;
    } else {
      // Use the correct callback URL that matches your Google Cloud Console setup
      redirectUri = `${baseUrl}/api/auth/oauth-callback`;
    }
    
    // Alternative redirect URI if the first one doesn't work
    const alternativeRedirectUri = useAlternative 
      ? `${baseUrl}/api/auth/oauth-callback`
      : `${baseUrl}/auth/callback`;
    
    console.log('Base URL:', baseUrl);
    console.log('Redirect URI:', redirectUri);
    console.log('Google Client ID:', config.oauth.google.clientId);
    
    // Build Google OAuth URL with proper parameters
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(config.oauth.google.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `response_type=code&` +
      `state=google_${state}&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('Generated Google OAuth URL:', googleAuthUrl);

    return NextResponse.json({
      url: googleAuthUrl,
      state: state
    });

  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
