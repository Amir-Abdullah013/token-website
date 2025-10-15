'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read referral code from URL parameters
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode
      }));
    }
  }, [searchParams]);

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

  const handleSignInClick = () => {
    // Store the email in localStorage so it can be pre-filled on signin page
    if (successData?.email) {
      localStorage.setItem('signupEmail', successData.email);
    }
    router.push('/auth/signin');
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          referralCode: formData.referralCode.trim() || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success state
        setSuccessData({
          name: formData.name.trim(),
          email: formData.email.trim()
        });
        setIsSuccess(true);
      } else {
        setErrors({ general: data.error || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success page if signup was successful
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 shadow-2xl py-8 px-4 sm:rounded-lg sm:px-10">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-4 border border-emerald-400/30">
                <svg className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                🎉 Welcome to TIKI Platform!
              </h2>
              <p className="text-slate-300 mb-6">
                Your account has been created successfully.
              </p>
              
              {/* User Details */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-emerald-300">Account Details:</span>
                </div>
                <div className="ml-7 text-sm text-emerald-200">
                  <p><strong>Name:</strong> {successData.name}</p>
                  <p><strong>Email:</strong> {successData.email}</p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  You can now sign in to your account and start using all the features.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSignInClick}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg text-center font-medium shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all duration-300 hover:scale-105"
                  >
                    🚀 Sign In Now
                  </button>
                  <Link
                    href="/"
                    className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-4 py-3 rounded-lg text-center font-medium border border-slate-400/30 transition-all duration-300 hover:scale-105"
                  >
                    🏠 Go to Home
                  </Link>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-cyan-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-cyan-200">
                    <p className="font-medium mb-1">What's next?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Sign in to access your dashboard</li>
                      <li>Explore our token management features</li>
                      <li>Set up your profile and preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30 mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Or{' '}
            <Link href="/auth/signin" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 shadow-2xl py-8 px-4 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-400/30 text-red-300 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="name" className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <span className="mr-2">👤</span>
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                    errors.name ? 'border-red-400' : 'border-slate-500/30'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-300">{errors.name}</p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <span className="mr-2">🔐</span>
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-400' : 'border-slate-500/30'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-300">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="referralCode" className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <span className="mr-2">🎁</span>
                Referral Code (Optional)
                {formData.referralCode && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30">
                    ✓ Auto-filled
                  </span>
                )}
              </label>
              <div className="mt-1">
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  placeholder="Enter referral code if you have one"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                    formData.referralCode 
                      ? 'border-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20' 
                      : 'border-slate-500/30 bg-gradient-to-r from-slate-700/50 to-slate-800/50'
                  }`}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {formData.referralCode 
                    ? 'Referral code detected! You\'ll earn rewards for both you and your referrer.'
                    : 'Enter a referral code if someone referred you to join'
                  }
                </p>
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
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">🚀</span>
                    Create Account
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
