import { NextResponse } from 'next/server';
import { config } from '../../../../lib/config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${config.urls.base}/auth/signin?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${config.urls.base}/auth/signin?error=No authorization code received`);
  }

  if (!state) {
    return NextResponse.redirect(`${config.urls.base}/auth/signin?error=No state parameter received`);
  }

  try {
    let userData = null;

    // Parse the state parameter to determine the provider
    const [provider, stateValue] = state.split('_');

    if (provider === 'google') {
      // Handle Google OAuth callback
      userData = await handleGoogleCallback(code);
    } else if (provider === 'github') {
      // Handle GitHub OAuth callback
      userData = await handleGithubCallback(code);
    } else {
      return NextResponse.redirect(`${config.urls.base}/auth/signin?error=Invalid OAuth provider`);
    }

    if (userData) {
      // Store user data in session or database
      // For now, redirect to dashboard with success
      return NextResponse.redirect(`${config.urls.base}/user/dashboard?oauth=success&provider=${provider}`);
    } else {
      return NextResponse.redirect(`${config.urls.base}/auth/signin?error=Failed to authenticate`);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${config.urls.base}/auth/signin?error=${encodeURIComponent(error.message)}`);
  }
}

async function handleGoogleCallback(code) {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${config.urls.base}/api/auth/oauth-callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      provider: 'google'
    };
  } catch (error) {
    console.error('Google OAuth error:', error);
    return null;
  }
}

async function handleGithubCallback(code) {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.oauth.github.clientId,
        client_secret: config.oauth.github.clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.login,
      picture: userData.avatar_url,
      provider: 'github'
    };
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return null;
  }
}
