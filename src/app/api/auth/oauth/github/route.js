import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';

export async function POST() {
  try {
    // Check if GitHub OAuth is configured
    if (!config.oauth.github.clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID in your environment variables.' },
        { status: 400 }
      );
    }

    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Get the base URL - use localhost:3000 for development
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : (config.urls.base || 'http://localhost:3000');
    
    // Build GitHub OAuth URL with proper parameters
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(config.oauth.github.clientId)}&` +
      `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/oauth-callback`)}&` +
      `scope=${encodeURIComponent('user:email')}&` +
      `state=github_${state}`;

    console.log('Generated GitHub OAuth URL:', githubAuthUrl);

    return NextResponse.json({
      url: githubAuthUrl,
      state: state
    });

  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth' },
      { status: 500 }
    );
  }
}
