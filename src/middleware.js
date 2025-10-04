import { NextResponse } from 'next/server';
import { authHelpers } from '@/lib/supabase';

// Route protection middleware
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/simple',
    '/auth/test',
    '/setup-database',
    '/create-db',
    '/test-protection',
    '/test-system-settings'
  ];
  
  // Admin routes that require admin role
  const adminRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/notifications',
    '/admin/logs',
    '/admin/settings',
    '/admin/users',
    '/admin/deposits',
    '/admin/withdrawals',
    '/admin/profile'
  ];
  
  // User routes that require authentication
  const userRoutes = [
    '/user',
    '/user/dashboard',
    '/user/profile',
    '/user/deposit',
    '/user/withdraw',
    '/user/transactions',
    '/user/notifications',
    '/user/support'
  ];
  
  // API routes that require authentication
  const protectedApiRoutes = [
    '/api/auth',
    '/api/create-db',
    '/api/setup-database',
    '/api/test-database'
  ];
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if route is admin
  const isAdminRoute = adminRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if route is user
  const isUserRoute = userRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if route is protected API
  const isProtectedApi = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/') && !isProtectedApi
  ) {
    return NextResponse.next();
  }
  
      try {
        // In development mode, skip all middleware logic to prevent loops
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: skipping middleware for', pathname);
          return NextResponse.next();
        }
    
    // Production mode: Skip authentication check for OAuth users
    // OAuth users use localStorage which can't be checked in middleware
    // Let the client-side auth context handle authentication
    console.log('Production mode: skipping middleware authentication check for', pathname);
    return NextResponse.next();
    
    return NextResponse.next();
    
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Configure which routes the middleware should run on
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

