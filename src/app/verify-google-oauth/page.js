'use client';

import { useState } from 'react';

export default function VerifyGoogleOAuth() {
  const [step, setStep] = useState(1);
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/api/auth/oauth-callback');
  const [clientId, setClientId] = useState('577250226657-te740bbbj8ape899fgm6votvirdgaupk.apps.googleusercontent.com');

  const steps = [
    {
      id: 1,
      title: "Open Google Cloud Console",
      description: "Go to the Google Cloud Console to access your OAuth app settings",
      action: () => window.open('https://console.developers.google.com/', '_blank'),
      buttonText: "Open Google Cloud Console"
    },
    {
      id: 2,
      title: "Navigate to Credentials",
      description: "In the Google Cloud Console, go to APIs & Services → Credentials",
      action: () => {},
      buttonText: "I'm in Credentials section"
    },
    {
      id: 3,
      title: "Find Your OAuth Client",
      description: `Look for your OAuth 2.0 Client ID: ${clientId}`,
      action: () => {},
      buttonText: "I found my OAuth client"
    },
    {
      id: 4,
      title: "Add Redirect URI",
      description: `In the "Authorized redirect URIs" section, add this EXACT URI:`,
      code: redirectUri,
      action: () => navigator.clipboard.writeText(redirectUri),
      buttonText: "Copy Redirect URI"
    },
    {
      id: 5,
      title: "Add JavaScript Origin",
      description: "In the 'Authorized JavaScript origins' section, add:",
      code: "http://localhost:3000",
      action: () => navigator.clipboard.writeText('http://localhost:3000'),
      buttonText: "Copy JavaScript Origin"
    },
    {
      id: 6,
      title: "Save Changes",
      description: "Click the SAVE button to save your changes",
      action: () => {},
      buttonText: "I saved the changes"
    },
    {
      id: 7,
      title: "Wait for Propagation",
      description: "Google changes can take 2-3 minutes to propagate. Wait before testing.",
      action: () => {},
      buttonText: "I'll wait 3 minutes"
    },
    {
      id: 8,
      title: "Test OAuth",
      description: "Now test your OAuth flow to see if the error is resolved",
      action: () => window.open('/debug-oauth-redirect', '_blank'),
      buttonText: "Test OAuth Flow"
    }
  ];

  const currentStep = steps.find(s => s.id === step);
  const isLastStep = step === steps.length;

  const nextStep = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetSteps = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Google OAuth Configuration Verifier
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Current Error:</h3>
              <p className="text-sm text-red-700">
                <strong>Error 400: redirect_uri_mismatch</strong> - Your Google OAuth app redirect URI doesn't match what your app is sending.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {step} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Step */}
          <div className="border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              {currentStep?.title}
            </h2>
            <p className="text-gray-700 mb-4">
              {currentStep?.description}
            </p>
            
            {currentStep?.code && (
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">
                    {currentStep.code}
                  </code>
                  <button
                    onClick={currentStep.action}
                    className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    {currentStep.buttonText}
                  </button>
                </div>
              </div>
            )}

            {!currentStep?.code && currentStep?.action && (
              <button
                onClick={currentStep.action}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {currentStep.buttonText}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {!isLastStep ? (
              <button
                onClick={nextStep}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Next Step
              </button>
            ) : (
              <div className="text-center">
                <p className="text-green-700 font-medium mb-4">
                  ✅ Configuration should now be complete!
                </p>
                <button
                  onClick={resetSteps}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>

          {/* Quick Reference */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium text-blue-900 mb-2">Redirect URI</h4>
                <code className="text-sm break-all">{redirectUri}</code>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-medium text-green-900 mb-2">JavaScript Origin</h4>
                <code className="text-sm">http://localhost:3000</code>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Still Getting Errors?</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Double-check these common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Make sure you're using <code>http://</code> not <code>https://</code></li>
                <li>Check for extra spaces or characters in the redirect URI</li>
                <li>Ensure the port number is exactly <code>3000</code></li>
                <li>Wait 2-3 minutes after saving changes</li>
                <li>Try clearing your browser cache</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
