import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';

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
    // Determine the provider from state
    const provider = state.startsWith('google_') ? 'google' : 'github';
    
    // Handle the OAuth callback
    const response = await fetch(`${config.urls.base}/api/auth/oauth-callback?code=${code}&state=${state}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        // Redirect to dashboard with user data
        return NextResponse.redirect(`${config.urls.base}/user/dashboard`);
      }
    }
    
    // Fallback redirect
    return NextResponse.redirect(`${config.urls.base}/user/dashboard`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${config.urls.base}/auth/signin?error=Authentication failed`);
  }
}
