import { NextResponse } from 'next/server';

export function handleApiError(error, context = 'API') {
  console.error(`❌ ${context} Error:`, error);
  
  // Always return JSON, never HTML
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      details: error.message,
      type: 'server_error',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

export function handleValidationError(message, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      type: 'validation_error'
    },
    { status: 400 }
  );
}

export function handleAuthError(message = 'Authentication required') {
  return NextResponse.json(
    {
      success: false,
      error: message,
      type: 'auth_error'
    },
    { status: 401 }
  );
}


