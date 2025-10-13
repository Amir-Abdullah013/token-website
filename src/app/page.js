'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../components';
import SEO from '../components/SEO';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Features', href: '/#features' },
  ];

  return (
    <>
      <SEO
        title="Token Website - Secure Digital Wallet Platform"
        description="Experience lightning-fast crypto trading with institutional-grade security. Join thousands of traders who trust our platform for secure digital wallet management."
        keywords="digital wallet, cryptocurrency, secure trading, blockchain, crypto platform, token management"
        url="/"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-white font-bold text-sm sm:text-lg">T</span>
                  </div>
                  <span className="text-lg sm:text-2xl font-bold text-white">TokenApp</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                href="/auth/signin"
                className="text-white hover:text-blue-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 border border-gray-600 hover:border-blue-400 bg-transparent hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:scale-105 transform"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-blue-300 p-2 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/20 backdrop-blur-md rounded-2xl mt-2 border border-gray-700">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <Link
                    href="/auth/signin"
                    className="text-white hover:text-blue-300 block px-3 py-2 rounded-xl text-base font-semibold transition-colors duration-200 border border-gray-600 hover:border-blue-400 bg-transparent hover:bg-white/5 mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg block px-3 py-2 rounded-xl text-base font-bold transition-all duration-300 text-center shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-8">
              <span className="text-yellow-400 mr-2">🚀</span>
              <span className="text-blue-300 text-sm font-semibold">Next-Generation Trading Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Trade <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Crypto</span><br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Like a Pro
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Experience lightning-fast crypto trading with institutional-grade security. 
              <span className="text-blue-300 font-semibold"> Join thousands of traders</span> who trust our platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="primary"
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                >
                  Start Trading Now
                </Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto px-4">
              <div className="text-center p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">$2.4B+</div>
                <div className="text-gray-300 text-sm sm:text-base">Trading Volume</div>
              </div>
              <div className="text-center p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">50K+</div>
                <div className="text-gray-300 text-sm sm:text-base">Active Users</div>
              </div>
              <div className="text-center p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">99.9%</div>
                <div className="text-gray-300 text-sm sm:text-base">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">TokenApp</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for serious traders who demand the best performance and security.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-gray-700 hover:border-cyan-500/50 hover:shadow-lg group transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-300 leading-relaxed">
                Execute trades in <span className="text-cyan-400 font-semibold">milliseconds</span> with our high-performance trading engine. 
                Never miss an opportunity with real-time market data.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-gray-700 hover:border-emerald-500/50 hover:shadow-lg group transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Bank-Grade Security</h3>
              <p className="text-gray-300 leading-relaxed">
                Your assets are protected with <span className="text-emerald-400 font-semibold">military-grade encryption</span> and 
                multi-layer security protocols. Your investments are safe with us.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-gray-700 hover:border-purple-500/50 hover:shadow-lg group transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Advanced Analytics</h3>
              <p className="text-gray-300 leading-relaxed">
                Make informed decisions with our <span className="text-purple-400 font-semibold">comprehensive charting tools</span> and 
                market analysis. Professional-grade tools for serious traders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-12 text-center border border-gray-700">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Your <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Trading Journey</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join <span className="text-cyan-400 font-semibold">thousands of successful traders</span> who trust TokenApp for their crypto needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  variant="primary"
                  className="w-full px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg"
                >
                  🚀 Create Free Account
                </Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-xl font-bold text-white">TokenApp</span>
            </div>
            <p className="text-gray-400 mb-6">
              The future of cryptocurrency trading is here.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
              <Link href="/support" className="hover:text-cyan-400 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}