import { NextResponse } from 'next/server';
import { supabase } from './src/lib/supabase.js';

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
  '/auth/callback'
];

// Helper function to get user session
async function getUserSession(request) {
  try {
    // Get session from Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    // Session is invalid or expired
    return null;
  }
}

// Helper function to get user role
async function getUserRole(user) {
  try {
    // Check user metadata for role
    if (user.user_metadata && user.user_metadata.role) {
      return user.user_metadata.role;
    }
    
    // Check app_metadata for role
    if (user.app_metadata && user.app_metadata.role) {
      return user.app_metadata.role;
    }
    
    return 'user';
  } catch (error) {
    console.error('Error getting user role in middleware:', error);
    return 'user';
  }
}

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

  // In development mode, skip all middleware to prevent OAuth issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: skipping middleware for', pathname);
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

  // Get user session
  const user = await getUserSession(request);

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get user role and redirect accordingly
    const userRole = await getUserRole(user);
    
    if (pathname.startsWith('/user') && userRole !== 'user') {
      // Admin trying to access user routes
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      // User trying to access admin routes
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
  }

  // Handle auth routes (redirect authenticated users)
  if (isAuthRoute && user) {
    const userRole = await getUserRole(user);
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
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

