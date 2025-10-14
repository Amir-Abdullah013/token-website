'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="text-6xl">⚠️</div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Application Error
          </h1>
          
          <p className="text-gray-400 mb-8">
            A critical error occurred in the application. Please try refreshing the page or contact support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">🔄</span>
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">🏠</span>
              Go Home
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                Error Details (Development)
              </summary>
              <pre className="mt-4 p-4 bg-gray-900 rounded text-xs text-red-400 overflow-auto">
                {error?.message || 'No error message available'}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}

