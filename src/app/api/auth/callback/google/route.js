import { NextResponse } from 'next/server';
import { config } from '../../../../../lib/config';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get the correct base URL for redirects
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : config.urls.base);

  if (error) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=No authorization code received`);
  }

  if (!state) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=No state parameter received`);
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
        return NextResponse.redirect(`${baseUrl}/user/dashboard`);
      }
    }
    
    // Fallback redirect
    return NextResponse.redirect(`${baseUrl}/user/dashboard`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=Authentication failed`);
  }
}
