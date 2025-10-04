import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';
import { getBaseUrl, getOAuthCallbackUrl, logUrlConfig } from '../../../../../lib/url-utils';
import { getGoogleOAuthConfig, logOAuthConfig, validateOAuthConfig } from '../../../../../lib/oauth-config';

export async function GET(request) {
  try {
    // Validate OAuth configuration
    const validation = validateOAuthConfig();
    
    if (!validation.isValid) {
      console.error('❌ OAuth configuration invalid:', validation.errors);
      return NextResponse.json(
        { error: `OAuth configuration error: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Get Google OAuth configuration
    const googleConfig = getGoogleOAuthConfig();
    
    if (!googleConfig.clientId) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.' },
        { status: 400 }
      );
    }

    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Log OAuth configuration for debugging
    logOAuthConfig();
    
    console.log('🔧 OAuth Configuration:');
    console.log('  Base URL:', googleConfig.redirectUri.split('/api')[0]);
    console.log('  Redirect URI:', googleConfig.redirectUri);
    console.log('  Google Client ID:', googleConfig.clientId);
    console.log('  Environment:', validation.config.environment);
    console.log('  Vercel URL:', process.env.VERCEL_URL || 'Not set');
    
    // Build Google OAuth URL with proper parameters
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleConfig.clientId)}&` +
      `redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&` +
      `scope=${encodeURIComponent(googleConfig.scope)}&` +
      `response_type=${googleConfig.responseType}&` +
      `state=google_${state}&` +
      `access_type=${googleConfig.accessType}&` +
      `prompt=${googleConfig.prompt}`;

    console.log('Generated Google OAuth URL:', googleAuthUrl);

    // Redirect directly to Google OAuth instead of returning JSON
    return NextResponse.redirect(googleAuthUrl);

  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
