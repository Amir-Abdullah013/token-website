'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { Play, Clock, Gift, TrendingUp, AlertCircle, CheckCircle, Lock, ExternalLink } from 'lucide-react';

export default function AdsPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Ad state
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [nextAdAvailable, setNextAdAvailable] = useState(null);
  const [adHistory, setAdHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [lockedPoints, setLockedPoints] = useState(0);
  const [adWindow, setAdWindow] = useState(null);
  const [adStartTime, setAdStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canCloseAd, setCanCloseAd] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  // Constants
  const REWARD_PER_AD = 10; // Locked Points
  const COOLDOWN_MINUTES = 5; // minutes between ads
  const ADSTERRA_URL = 'https://www.effectivegatecpm.com/hjjxn97b?key=3a6e1a82e551092c43248e0fac7bc362';
  const MIN_AD_TIME = 30; // Minimum seconds user must spend on ad
  
  // Computed values - check if user is currently on cooldown
  const isOnCooldown = nextAdAvailable && new Date() < new Date(nextAdAvailable);
  
  const checkIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAdStats();
      fetchAdHistory();
      fetchLockedPoints();
    }
  }, [isAuthenticated, user?.id]);

  // Update cooldown display every second
  useEffect(() => {
    if (nextAdAvailable) {
      const updateCooldown = () => {
        const now = new Date();
        const next = new Date(nextAdAvailable);
        const diff = next - now;
        
        if (diff <= 0) {
          setCooldownMinutes(0);
          setCooldownSeconds(0);
          setNextAdAvailable(null);
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
          }
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setCooldownMinutes(minutes);
          setCooldownSeconds(seconds);
        }
      };
      
      updateCooldown();
      cooldownIntervalRef.current = setInterval(updateCooldown, 1000);
      
      return () => {
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
        }
      };
    } else {
      setCooldownMinutes(0);
      setCooldownSeconds(0);
    }
  }, [nextAdAvailable]);

  // Timer countdown for ad viewing
  useEffect(() => {
    if (adStartTime && !canCloseAd) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - adStartTime) / 1000);
        const remaining = Math.max(0, MIN_AD_TIME - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setCanCloseAd(true);
          clearInterval(timerIntervalRef.current);
        }
      }, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [adStartTime, canCloseAd]);

  // Check if ad window is closed
  useEffect(() => {
    if (adWindow && isWatchingAd) {
      checkIntervalRef.current = setInterval(() => {
        if (adWindow.closed) {
          clearInterval(checkIntervalRef.current);
          handleAdWindowClosed();
        }
      }, 500);

      return () => {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      };
    }
  }, [adWindow, isWatchingAd]);

  const fetchAdStats = async () => {
    try {
      const response = await fetch(`/api/ads/stats?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('=== Fetched Ad Stats ===');
        console.log('Response:', data);
        
        setAdsWatchedToday(data.adsWatchedToday || 0);
        
        if (data.nextAdAvailable) {
          console.log('Setting nextAdAvailable to:', data.nextAdAvailable);
          setNextAdAvailable(data.nextAdAvailable);
        } else {
          console.log('No cooldown - can watch immediately');
          setNextAdAvailable(null);
        }
      }
    } catch (err) {
      console.error('Error fetching ad stats:', err);
    }
  };

  const fetchAdHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/ads/history?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAdHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching ad history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchLockedPoints = async () => {
    try {
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const points = parseFloat(data.lockedAdPoints || 0);
        setLockedPoints(points);
        console.log('Locked ad points:', points);
      }
    } catch (err) {
      console.error('Error fetching locked points:', err);
    }
  };

  const handleWatchAd = async () => {
    console.log('=== Button Clicked: Attempting to watch ad ===');
    console.log('isWatchingAd:', isWatchingAd);
    console.log('isOnCooldown:', isOnCooldown);
    console.log('nextAdAvailable:', nextAdAvailable);
    
    if (isWatchingAd) {
      console.log('❌ Already watching an ad');
      return;
    }

    // CRITICAL: Check cooldown FIRST before doing anything
    if (nextAdAvailable) {
      const now = new Date();
      const next = new Date(nextAdAvailable);
      
      console.log('Current time:', now.toISOString());
      console.log('Next available:', next.toISOString());
      console.log('Is future?', now < next);
      
      if (now < next) {
        const diffMs = next - now;
        const minutesLeft = Math.floor(diffMs / 60000);
        const secondsLeft = Math.floor((diffMs % 60000) / 1000);
        
        const timeMessage = minutesLeft > 0 
          ? `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} and ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}`
          : `${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}`;
        
        console.log('❌ Cooldown active - BLOCKING ad');
        console.log('Time remaining:', timeMessage);
        error(`⏳ Please wait ${timeMessage} before watching another ad.`);
        
        // STOP HERE - do NOT open ad
        return;
      } else {
        console.log('✅ Cooldown expired - allowing ad');
      }
    } else {
      console.log('✅ No cooldown - first ad or cooldown passed');
    }

    setIsWatchingAd(true);
    setCanCloseAd(false);
    
    // Record start time
    const startTime = Date.now();
    setAdStartTime(startTime);
    setTimeRemaining(MIN_AD_TIME);

    try {
      // Open Adsterra smartlink in new window
      const width = 900;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const newWindow = window.open(
        ADSTERRA_URL,
        'adsterraAd',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=yes`
      );

      if (newWindow) {
        setAdWindow(newWindow);
        success(`Ad opened! Keep this page open and watch the timer below.`);
        newWindow.focus();
      } else {
        error('Please allow popups for this site to watch ads.');
        resetAdState();
      }
    } catch (err) {
      console.error('Error opening ad:', err);
      error('Failed to open ad. Please allow popups and try again.');
      resetAdState();
    }
  };

  const resetAdState = () => {
    setIsWatchingAd(false);
    setAdStartTime(null);
    setTimeRemaining(0);
    setCanCloseAd(false);
    setAdWindow(null);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleAdWindowClosed = async () => {
    if (!adStartTime) {
      resetAdState();
      return;
    }

    const timeSpent = (Date.now() - adStartTime) / 1000;
    console.log(`User spent ${timeSpent.toFixed(1)} seconds on ad (minimum: ${MIN_AD_TIME}s)`);

    if (timeSpent >= MIN_AD_TIME) {
      await handleAdCompleted();
    } else {
      error(`Please spend at least ${MIN_AD_TIME} seconds viewing the ad. You only spent ${Math.floor(timeSpent)} seconds.`);
      resetAdState();
    }
  };

  const handleAdCompleted = async () => {
    try {
      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await response.json();
      
      console.log('=== Ad Completion Response ===');
      console.log('Full response:', result);

      if (result.success) {
        success(`🎉 Congratulations! You earned ${REWARD_PER_AD} locked points!`);
        
        // IMPORTANT: Update nextAdAvailable immediately
        console.log('Setting nextAdAvailable from response:', result.nextAdAvailable);
        setNextAdAvailable(result.nextAdAvailable);
        setAdsWatchedToday(result.adsWatchedToday);
        
        // Refresh data
        await fetchAdHistory();
        await fetchLockedPoints();
        
        // Trigger wallet refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('wallet-updated'));
        }
      } else {
        error(result.error || 'Failed to credit points');
      }
    } catch (err) {
      console.error('Error completing ad:', err);
      error('Failed to process reward. Please contact support.');
    } finally {
      resetAdState();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canWatchAd = () => {
    if (!nextAdAvailable) return true;
    return new Date() >= new Date(nextAdAvailable);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-lg p-8 border border-slate-600/30 shadow-xl">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              Authentication Required
            </h1>
            <p className="text-slate-300 mb-6">
              Please sign in to earn points by watching ads.
            </p>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Earn Points by Watching Ads
                </h1>
                <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                  BETA
                </span>
                <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full">
                  ✓ Powered by Adsterra
                </span>
              </div>
              <p className="text-slate-300 mt-1">Visit ads and earn locked points!</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-500/30 via-yellow-500/30 to-orange-500/30 border border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Locked Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {lockedPoints.toFixed(2)}
              </div>
              <p className="text-amber-200 text-sm">
                From ad rewards
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-teal-500/30 border border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Points Per Ad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {REWARD_PER_AD}
              </div>
              <p className="text-emerald-200 text-sm">
                Locked for now
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 border border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Ads Watched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {adsWatchedToday}
              </div>
              <p className="text-cyan-200 text-sm">
                Today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/30 via-purple-500/30 to-indigo-500/30 border border-violet-400/50 hover:shadow-xl hover:shadow-violet-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Cooldown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {isOnCooldown ? `${cooldownMinutes}m ${cooldownSeconds}s` : '0m'}
              </div>
              <p className="text-violet-200 text-sm">
                {isOnCooldown ? 'Wait before next ad' : 'Ready to watch!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Watch Ad Section */}
        <Card className="mb-8 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Ad Viewing Timer - Shown when watching ad */}
              {isWatchingAd && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-2">
                    {canCloseAd ? (
                      <span className="text-emerald-400">✅ You can close the ad now!</span>
                    ) : (
                      <span className="text-amber-400">⏱️ Keep ad open: {timeRemaining}s remaining</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mt-4">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        canCloseAd 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${((MIN_AD_TIME - timeRemaining) / MIN_AD_TIME) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-slate-300 text-sm mt-4">
                    {canCloseAd 
                      ? 'Close the ad window to receive your points!' 
                      : 'Do not close this page or the ad window!'}
                  </p>
                </div>
              )}

              <Button
                onClick={handleWatchAd}
                disabled={isOnCooldown || isWatchingAd}
                className={`text-lg px-8 py-4 font-bold shadow-lg transition-all transform hover:scale-105 ${
                  !isOnCooldown && !isWatchingAd
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-500/30 animate-pulse'
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isWatchingAd ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 inline-block" />
                    Watching Ad...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5 mr-2 inline-block" />
                    Visit Ad & Earn {REWARD_PER_AD} Points
                  </>
                )}
              </Button>

              {isOnCooldown && !isWatchingAd && (
                <div className="mt-4 p-4 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                  <p className="text-amber-400 text-lg font-medium">
                    ⏳ Next ad available in: <span className="font-bold">{cooldownMinutes}m {cooldownSeconds}s</span>
                  </p>
                </div>
              )}

              <div className="mt-6 text-slate-400 text-sm space-y-1">
                <p>• Click the button to open an ad in a new window</p>
                <p>• Keep THIS page open and watch the timer above</p>
                <p>• Wait for the timer to reach 0 seconds</p>
                <p>• Close the ad window when timer completes</p>
                <p>• {COOLDOWN_MINUTES} minute cooldown between ads</p>
                <p className="text-amber-400">• Locked points will be converted to VON tokens later</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad History */}
        <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Your Reward History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading history...</p>
              </div>
            ) : adHistory.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No ads watched yet. Start earning now!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gradient-to-br from-slate-800/20 to-slate-900/20 divide-y divide-slate-600/20">
                    {adHistory.map((record, index) => (
                      <tr key={record.id || index} className="hover:bg-slate-700/20 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-white">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-amber-400">
                          <div className="flex items-center">
                            <Lock className="h-3 w-3 mr-1" />
                            +{record.reward} Points
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
