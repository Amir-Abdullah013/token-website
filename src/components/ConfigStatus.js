'use client';

import { useAuth } from '../lib/auth-context';
import { validateConfig } from '../lib/config';

const ConfigStatus = () => {
  const { configValid, error } = useAuth();
  const validation = validateConfig();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!configValid) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
        <div className="flex">
          <div className="py-1">
            <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold">Configuration Error</p>
            <p className="text-sm">Please check your environment variables:</p>
            <ul className="text-sm mt-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-red-600">• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

 
};

export default ConfigStatus;




