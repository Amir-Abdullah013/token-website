'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email if coming from signup
  useEffect(() => {
    const signupEmail = localStorage.getItem('signupEmail');
    if (signupEmail) {
      setFormData(prev => ({
        ...prev,
        email: signupEmail
      }));
      // Clear the stored email
      localStorage.removeItem('signupEmail');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user session
        localStorage.setItem('userSession', JSON.stringify(data.user));
        
        // Clear any cached data
        localStorage.removeItem('signupEmail');
        
        // Check for redirect parameter
        const redirectTo = searchParams.get('redirect');
        
        // Role-based redirect with fallback to redirect parameter
        if (data.user.role === 'admin') {
          router.push(redirectTo && redirectTo.startsWith('/admin') ? redirectTo : '/admin/dashboard');
        } else {
          router.push(redirectTo && redirectTo.startsWith('/user') ? redirectTo : '/user/dashboard');
        }
      } else {
        // Handle specific error cases with detailed debugging
        console.error('Signin failed:', data);
        
        let errorMessage = data.error || 'Failed to sign in';
        
      
        
        if (data.errorCode === 'USER_NOT_FOUND') {
          setErrors({ 
            general: errorMessage,
            showSignupLink: true,
            suggestion: data.suggestion
          });
        } else if (data.errorCode === 'INVALID_PASSWORD') {
          setErrors({ 
            general: errorMessage,
            showForgotPassword: true
          });
        } else {
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      // Direct redirect to Google OAuth endpoint
      window.location.href = '/api/auth/oauth/google';
    } catch (error) {
      console.error('Google sign in error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30 mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 shadow-2xl py-8 px-4 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{errors.general}</p>
                    {errors.showSignupLink && (
                      <div className="mt-2">
                        <Link 
                          href="/auth/signup" 
                          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 underline transition-colors"
                        >
                          Create Account Now →
                        </Link>
                      </div>
                    )}
                    {errors.showForgotPassword && (
                      <div className="mt-2">
                        <Link 
                          href="/auth/forgot-password" 
                          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 underline transition-colors"
                        >
                          Forgot Password? →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <span className="mr-2">📧</span>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                    errors.email ? 'border-red-400' : 'border-slate-500/30'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-300">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <span className="mr-2">🔒</span>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                    errors.password ? 'border-red-400' : 'border-slate-500/30'
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-300">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-500/30 rounded bg-slate-700/50"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-slate-200">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">🔑</span>
                    Sign in
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-500/30" />
                </div>
               
              </div>

              
            </div>
          </form>

          {/* Helpful message for new users */}
          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-cyan-300">
                  New to Von Platform?
                </h3>
                <div className="mt-2 text-sm text-cyan-200">
                  <p>
                    If you don't have an account yet, you can create one in just a few minutes.
                    <Link href="/auth/signup" className="font-medium underline hover:text-cyan-100 transition-colors">
                      {' '}Create your account now →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
