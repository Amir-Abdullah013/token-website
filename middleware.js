import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/user',
  '/admin'
];

// Routes that should redirect authenticated users
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password'
];

// Public routes that don't need authentication
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/design-system',
  '/redirect-dashboard',
  '/auth/callback',
  '/auth/oauth-success',
  '/auth/oauth-callback'
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth-related
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For OAuth callback routes, allow access (they handle their own redirects)
  if (pathname.startsWith('/auth/oauth') || pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // For protected routes in production, let client-side auth handle authentication
  // This prevents middleware from interfering with OAuth localStorage sessions
  if (isProtectedRoute) {
    // In production, skip server-side auth checks for OAuth users
    // Let the client-side auth context handle authentication
    console.log('Protected route accessed:', pathname, '- letting client handle auth');
    return NextResponse.next();
  }

  // For auth routes, let client-side handle redirects
  if (isAuthRoute) {
    console.log('Auth route accessed:', pathname, '- letting client handle redirects');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};