import { NextResponse } from 'next/server';
import { config } from '../../../../lib/config';
import { getBaseUrl, getSigninUrl, getDashboardUrl, getOAuthCallbackUrl } from '../../../../lib/url-utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get the correct URLs using our utility
  const baseUrl = getBaseUrl();
  const signinUrl = getSigninUrl();
  const dashboardUrl = getDashboardUrl();

  if (error) {
    return NextResponse.redirect(`${signinUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${signinUrl}?error=No authorization code received`);
  }

  if (!state) {
    return NextResponse.redirect(`${signinUrl}?error=No state parameter received`);
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
      return NextResponse.redirect(`${signinUrl}?error=Invalid OAuth provider`);
    }

    if (userData) {
      // Create a session token for the user
      const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store user session data
      const sessionData = {
        user: userData,
        token: sessionToken,
        provider: provider,
        createdAt: new Date().toISOString()
      };

      // Store complete user data in localStorage via URL parameters
      const redirectUrl = new URL(dashboardUrl);
      redirectUrl.searchParams.set('oauth', 'success');
      redirectUrl.searchParams.set('provider', provider);
      redirectUrl.searchParams.set('session', sessionToken);
      redirectUrl.searchParams.set('userEmail', userData.email);
      redirectUrl.searchParams.set('userName', userData.name);
      redirectUrl.searchParams.set('userId', userData.id);
      if (userData.picture) {
        redirectUrl.searchParams.set('userPicture', userData.picture);
      }
      
      return NextResponse.redirect(redirectUrl.toString());
    } else {
      return NextResponse.redirect(`${signinUrl}?error=Failed to authenticate`);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${signinUrl}?error=${encodeURIComponent(error.message)}`);
  }
}

async function handleGoogleCallback(code) {
  try {
    // Get the correct redirect URI using our utility
    const redirectUri = getOAuthCallbackUrl();
    
    console.log('🔧 Google OAuth Token Exchange:');
    console.log('  Client ID:', config.oauth.google.clientId);
    console.log('  Redirect URI:', redirectUri);
    console.log('  Code received:', code ? 'Yes' : 'No');
    
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
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    console.log('🔧 Token Response Status:', tokenResponse.status);
    console.log('🔧 Token Response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenData);
      throw new Error(`Token exchange failed: ${tokenData.error || 'Unknown error'}`);
    }

    if (!tokenData.access_token) {
      console.error('❌ No access token in response:', tokenData);
      throw new Error('Failed to get access token');
    }

    console.log('✅ Access token received successfully');

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to get user info:', userResponse.status);
      throw new Error('Failed to get user information');
    }

    const userData = await userResponse.json();
    console.log('✅ User data retrieved:', userData.email);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      provider: 'google'
    };
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return null;
  }
}

async function handleGithubCallback(code) {
  try {
    console.log('🔧 GitHub OAuth Token Exchange:');
    console.log('  Client ID:', config.oauth.github.clientId);
    console.log('  Code received:', code ? 'Yes' : 'No');
    
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
    
    console.log('🔧 GitHub Token Response Status:', tokenResponse.status);
    console.log('🔧 GitHub Token Response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('❌ GitHub token exchange failed:', tokenData);
      throw new Error(`GitHub token exchange failed: ${tokenData.error || 'Unknown error'}`);
    }

    if (!tokenData.access_token) {
      console.error('❌ No GitHub access token in response:', tokenData);
      throw new Error('Failed to get GitHub access token');
    }

    console.log('✅ GitHub access token received successfully');

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to get GitHub user info:', userResponse.status);
      throw new Error('Failed to get GitHub user information');
    }

    const userData = await userResponse.json();
    console.log('✅ GitHub user data retrieved:', userData.email);

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.login,
      picture: userData.avatar_url,
      provider: 'github'
    };
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    return null;
  }
}
