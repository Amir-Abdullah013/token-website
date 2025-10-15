'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Card, { CardContent } from '../../../components/Card';
import { AlertModal } from '../../../components/Modal';

export default function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAlertMessage(data.message);
        setAlertType('success');
        setIsSubmitted(true);
      } else {
        setAlertMessage(data.error);
        setAlertType('error');
      }
    } catch (error) {
      setAlertMessage('Network error. Please try again.');
      setAlertType('error');
    }
    
    setShowAlert(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Check your email</h2>
            <p className="mt-2 text-sm text-slate-300">
              We've sent a password reset link to <strong className="text-emerald-300">{email}</strong>
            </p>
          </div>

          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 shadow-2xl">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  If you don't see the email in your inbox, check your spam folder.
                </p>
                <p className="text-sm text-slate-300">
                  The link will expire in 1 hour for security reasons.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    fullWidth
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-400/30 transition-all duration-300 hover:scale-105"
                  >
                    Try a different email
                  </Button>
                  
                  <Link href="/auth/signin">
                    <Button 
                      variant="primary" 
                      fullWidth
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all duration-300 hover:scale-105"
                    >
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Forgot your password?</h2>
          <p className="mt-2 text-sm text-slate-300">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    className={`appearance-none block w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border rounded-lg shadow-sm placeholder-slate-200 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 sm:text-sm ${
                      emailError ? 'border-red-400' : 'border-slate-500/30'
                    }`}
                    required
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-300">{emailError}</p>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  We'll send a password reset link to this email address
                </p>
              </div>

              <Button
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">📧</span>
                    Send Reset Link
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-slate-300">
            Remember your password?{' '}
            <Link href="/auth/signin" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertType === 'success' ? 'Email Sent!' : 'Error'}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

