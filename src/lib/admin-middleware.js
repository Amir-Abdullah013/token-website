import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function adminOnly(request) {
  try {
    // Get token from cookies or Authorization header
    const adminToken = request.cookies.get('admin-token')?.value;
    const sessionCookie = request.cookies.get('session')?.value;
    
    let user = null;

    // Try admin token first
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'fallback-secret-key');
        if (decoded.role === 'admin') {
          user = decoded;
        }
      } catch (error) {
        console.log('Admin token verification failed:', error.message);
      }
    }

    // Fallback to session cookie
    if (!user && sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session.role === 'admin') {
          user = session;
        }
      } catch (error) {
        console.log('Session cookie parsing failed:', error.message);
      }
    }

    // Check if user is authenticated and is admin
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          redirect: '/admin'
        },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied: Admin privileges required',
          redirect: '/user/dashboard'
        },
        { status: 403 }
      );
    }

    // User is authenticated and is admin
    return { success: true, user };

  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        redirect: '/admin'
      },
      { status: 500 }
    );
  }
}

export function requireAdmin(handler) {
  return async (request, context) => {
    const authResult = adminOnly(request);
    
    // If authResult is a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // If authentication failed, return error
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Add user to request context
    request.user = authResult.user;
    
    // Call the original handler
    return handler(request, context);
  };
}

