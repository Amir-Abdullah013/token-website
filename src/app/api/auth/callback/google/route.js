import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';
import { getBaseUrl, getSigninUrl, getDashboardUrl } from '../../../../../lib/url-utils';

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
    // Determine the provider from state
    const provider = state.startsWith('google_') ? 'google' : 'github';
    
    // Handle the OAuth callback
    const response = await fetch(`${baseUrl}/api/auth/oauth-callback?code=${code}&state=${state}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        // Redirect to dashboard with user data
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // Fallback redirect
    return NextResponse.redirect(dashboardUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${signinUrl}?error=Authentication failed`);
  }
}
