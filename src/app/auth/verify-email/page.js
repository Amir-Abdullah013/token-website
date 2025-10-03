'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { Button, Card, CardContent, AlertModal, Loader } from '../../../components';

export default function VerifyEmailPage() {
  const { verifyEmail, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [isVerifying, setIsVerifying] = useState(true);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (userId && secret) {
      handleVerification();
    } else {
      setAlertMessage('Invalid verification link. Please check your email and try again.');
      setAlertType('error');
      setShowAlert(true);
      setIsVerifying(false);
    }
  }, [userId, secret]);

  const handleVerification = async () => {
    try {
      const result = await verifyEmail(userId, secret);
      
      if (result.success) {
        setAlertMessage(result.message);
        setAlertType('success');
        setShowAlert(true);
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        setAlertMessage(result.error);
        setAlertType('error');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage('An error occurred during verification. Please try again.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Loader size="lg" text="Verifying your email..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
            alertType === 'success' ? 'bg-success-100' : 'bg-error-100'
          }`}>
            {alertType === 'success' ? (
              <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            {alertType === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            {alertType === 'success' 
              ? 'Your email has been successfully verified. You can now sign in to your account.'
              : 'There was a problem verifying your email. Please try again or request a new verification email.'
            }
          </p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              {alertType === 'success' ? (
                <div className="space-y-3">
                  <p className="text-sm text-secondary-600">
                    Redirecting to sign in page in a few seconds...
                  </p>
                  <Link href="/auth/signin">
                    <Button variant="primary" fullWidth>
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-secondary-600">
                    You can try signing up again or contact support if the problem persists.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Link href="/auth/signup">
                      <Button variant="primary" fullWidth>
                        Try Signing Up Again
                      </Button>
                    </Link>
                    <Link href="/auth/signin">
                      <Button variant="outline" fullWidth>
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Need help?{' '}
            <Link href="/contact" className="font-medium text-primary-600 hover:text-primary-500">
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertType === 'success' ? 'Success!' : 'Verification Failed'}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
    </div>
  );
}


