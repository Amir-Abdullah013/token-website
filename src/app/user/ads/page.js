'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { Play, Clock, Gift, TrendingUp, AlertCircle, CheckCircle, Lock, ExternalLink } from 'lucide-react';
import AdsterraAd from '@/components/AdsterraAd';

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
  const [adPoints, setAdPoints] = useState(0); // Changed from lockedPoints
  const [adWindow, setAdWindow] = useState(null);
  const [adStartTime, setAdStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canCloseAd, setCanCloseAd] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [totalReferralAds, setTotalReferralAds] = useState(0);
  const [hasReferrals, setHasReferrals] = useState(false);
  // Converter state
  const [converterEligible, setConverterEligible] = useState(false);
  const [converterData, setConverterData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState('');
  
  // Constants
  const REWARD_PER_AD = 10; // Points (immediately usable)
  const COOLDOWN_MINUTES = 20; // minutes between ads
  const ADSTERRA_URL = 'https://www.effectivegatecpm.com/hjjxn97b?key=3a6e1a82e551092c43248e0fac7bc362';
  const MIN_AD_TIME = 15; // Minimum seconds user must spend on ad (changed from 30 to 15)
  
  // Computed values - check if user is currently on cooldown
  const isOnCooldown = nextAdAvailable && new Date() < new Date(nextAdAvailable);
  
  const checkIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  const [visitRewardStatus, setVisitRewardStatus] = useState(null);
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setMounted(true);
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // Load Adsterra scripts on mount
  useEffect(() => {
    if (!mounted) return;

    // Popunder script
    const popunderScript = document.createElement('script');
    popunderScript.src = 'https://pl28727620.effectivegatecpm.com/07/59/0d/07590da5cc78582398c926e80ac997d4.js';
    popunderScript.async = true;
    document.body.appendChild(popunderScript);

    return () => {
      // Cleanup scripts on unmount
      if (popunderScript.parentNode) popunderScript.parentNode.removeChild(popunderScript);
    };
  }, [mounted]);

  // Load Native Banner 1 script
  useEffect(() => {
    if (!mounted) return;

    const nativeBannerScript = document.createElement('script');
    nativeBannerScript.src = 'https://pl28727644.effectivegatecpm.com/417361b7b935487420113f3245829f9c/invoke.js';
    nativeBannerScript.async = true;
    nativeBannerScript.setAttribute('data-cfasync', 'false');
    document.body.appendChild(nativeBannerScript);

    return () => {
      if (nativeBannerScript.parentNode) nativeBannerScript.parentNode.removeChild(nativeBannerScript);
    };
  }, [mounted]);

  // Load Banner 300x250 script
  useEffect(() => {
    if (!mounted) return;

    const bannerOptions = document.createElement('script');
    bannerOptions.innerHTML = `
      atOptions = {
        'key' : '151dda20cf9e38cad1655fc08c47a3fc',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    document.body.appendChild(bannerOptions);

    const bannerInvoke = document.createElement('script');
    bannerInvoke.src = 'https://www.highperformanceformat.com/151dda20cf9e38cad1655fc08c47a3fc/invoke.js';
    bannerInvoke.async = true;
    document.body.appendChild(bannerInvoke);

    return () => {
      if (bannerOptions.parentNode) bannerOptions.parentNode.removeChild(bannerOptions);
      if (bannerInvoke.parentNode) bannerInvoke.parentNode.removeChild(bannerInvoke);
    };
  }, [mounted]);

  // Load Social Bar script
  useEffect(() => {
    if (!mounted) return;

    const socialBarScript = document.createElement('script');
    socialBarScript.src = 'https://pl28727664.effectivegatecpm.com/e1/9b/43/e19b43377e709368676187a26a23cf25.js';
    socialBarScript.async = true;
    document.body.appendChild(socialBarScript);

    return () => {
      if (socialBarScript.parentNode) socialBarScript.parentNode.removeChild(socialBarScript);
    };
  }, [mounted]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAdStats();
      fetchAdHistory();
      fetchAdPoints(); // Changed from fetchLockedPoints
      fetchReferralEarnings();
      checkHasReferrals();
      checkConverterEligibility();
    }
  }, [isAuthenticated, user?.id]);

  // Track page viewing time and reward user for engagement
  // Reward user for visiting the page (30 min cooldown handled by API)
  useEffect(() => {
    if (!mounted || !isAuthenticated || !user?.id) return;

    // Initial page visit reward and status check
    const checkAndRewardVisit = async () => {
      // 1. Try to reward
      await rewardInteraction('page_visit', 0);
      
      // 2. Fetch status for timer
      try {
        const res = await fetch(`/api/ads/visit-status?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setVisitRewardStatus({
            available: data.available,
            remainingSeconds: data.remainingSeconds,
            lastChecked: Date.now()
          });
        }
      } catch (err) {
        console.error('Error fetching visit status:', err);
      }
    };
    
    checkAndRewardVisit();

    // Timer interval for visit reward
    const timer = setInterval(() => {
      setVisitRewardStatus(prev => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted, isAuthenticated, user?.id]);

  // Function to reward interaction
  const rewardInteraction = async (interactionType, durationSeconds) => {
    try {
      const response = await fetch('/api/ads/interaction-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType,
          durationSeconds
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Interaction reward:', result.message);
        // Refresh ad points silently
        await fetchAdPoints();
      }
    } catch (err) {
      console.error('Error rewarding interaction:', err);
    }
  };

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

  const fetchAdPoints = async () => {
    try {
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const points = parseFloat(data.adPoints || 0);
        setAdPoints(points);
        console.log('Ad points:', points);
      }
    } catch (err) {
      console.error('Error fetching ad points:', err);
    }
  };

  const fetchReferralEarnings = async () => {
    try {
      const response = await fetch(`/api/ads/referral-earnings?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferralEarnings(parseFloat(data.totalEarnings || 0));
        setTotalReferralAds(parseInt(data.totalReferralAds || 0));
        console.log('Referral ad earnings:', data.totalEarnings);
      }
    } catch (err) {
      console.error('Error fetching referral earnings:', err);
    }
  };

  const checkHasReferrals = async () => {
    try {
      const response = await fetch(`/api/referrals/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const hasAnyReferrals = data.referrals && data.referrals.length > 0;
        setHasReferrals(hasAnyReferrals);
        console.log('Has referrals:', hasAnyReferrals);
        console.log('Referral count:', data.referralCount);
      }
    } catch (err) {
      console.error('Error checking referrals:', err);
    }
  };

  const checkConverterEligibility = async () => {
    try {
      const response = await fetch(`/api/ads/converter/check?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setConverterEligible(data.isEligible);
        setConverterData(data);
        console.log('Converter eligibility:', data);
      }
    } catch (err) {
      console.error('Error checking converter eligibility:', err);
    }
  };

  const handleConvertPoints = async () => {
    const points = parseFloat(pointsToConvert);
    if (!points || points <= 0) {
      error('Please enter a valid amount of points to convert');
      return;
    }

    if (points > adPoints) {
      error(`You only have ${adPoints} points available`);
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch('/api/ads/converter/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pointsToConvert: points
        })
      });

      const result = await response.json();
      if (result.success) {
        success(result.message);
        setPointsToConvert('');
        setShowConverter(false);
        // Refresh balances
        await fetchAdPoints();
        await checkConverterEligibility();
        // Trigger wallet refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('wallet-updated'));
        }
      } else {
        error(result.error || 'Failed to convert points');
      }
    } catch (err) {
      console.error('Error converting points:', err);
      error('Failed to convert points. Please try again.');
    } finally {
      setIsConverting(false);
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
    // Calculate time spent
    const timeSpent = adStartTime ? (Date.now() - adStartTime) / 1000 : 0;
    
    try {
      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          timeSpent: timeSpent
        }),
      });

      const result = await response.json();
      
      console.log('=== Ad Completion Response ===');
      console.log('Full response:', result);

      if (result.success) {
        success(`🎉 ${result.message}`);
        
        // IMPORTANT: Update nextAdAvailable immediately
        console.log('Setting nextAdAvailable from response:', result.nextAdAvailable);
        setNextAdAvailable(result.nextAdAvailable);
        setAdsWatchedToday(result.adsWatchedToday);
        
        // Refresh data
        await fetchAdHistory();
        await fetchAdPoints(); // Changed from fetchLockedPoints
        await fetchReferralEarnings();
        
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
      <div className="max-w-7xl mx-auto pb-24">{/* Added pb-24 for social bar space */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Earn Points by Watching Ads
                </h1>
              </div>
              <p className="text-slate-300 mt-1">Visit ads and earn locked points!</p>
            </div>
          </div>
        </div>

        {/* Visit Reward Section (New) */}
        <Card className="mb-8 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
            <CardContent className="p-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full border border-blue-400/30 animate-pulse">
                            <Gift className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center mb-1">
                                Daily Visit Reward
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/30 border border-blue-400/30 rounded text-blue-200">
                                    +20 Points
                                </span>
                            </h2>
                            <p className="text-slate-300 text-sm">
                                Visit this page every 30 minutes to automatically earn rewards!
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-auto text-center md:text-right">
                        {visitRewardStatus?.remainingSeconds > 0 ? (
                            <div className="bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-xl backdrop-blur-md">
                                <p className="text-amber-400 text-sm font-medium mb-1 uppercase tracking-wider">Next Reward In</p>
                                <span className="text-3xl font-bold text-white font-mono tracking-widest text-shadow-glow">
                                    {formatTime(visitRewardStatus.remainingSeconds)}
                                </span>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-3 rounded-xl backdrop-blur-md">
                                <p className="text-emerald-400 text-sm font-medium mb-1 uppercase tracking-wider">Status</p>
                                <span className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                                    Reward Claimed!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-${hasReferrals ? '5' : '4'} gap-6 mb-8`}>
          <Card className="bg-gradient-to-br from-amber-500/30 via-yellow-500/30 to-orange-500/30 border border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Ad Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {adPoints.toFixed(2)}
              </div>
              <p className="text-amber-200 text-sm">
                Usable right away!
              </p>
              <p className="text-amber-300 text-xs mt-1 font-medium">
                1 point = $0.00036 USD
              </p>
              <p className="text-amber-400 text-xs">
                ({adPoints.toFixed(2)} pts ≈ ${(adPoints * 0.00036).toFixed(4)} USD)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-teal-500/30 border border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Watch Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {MIN_AD_TIME}s
              </div>
              <p className="text-emerald-200 text-sm">
                Minimum per ad
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

          {/* Referral Earnings Card - Only shown to users with referrals */}
          {hasReferrals && (
            <Card className="bg-gradient-to-br from-rose-500/30 via-pink-500/30 to-fuchsia-500/30 border border-rose-400/50 hover:shadow-xl hover:shadow-rose-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Referral Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {referralEarnings.toFixed(2)}
                </div>
                <p className="text-rose-200 text-sm">
                  From {totalReferralAds} referral ads
                </p>
                <p className="text-rose-300 text-xs mt-1 font-medium">
                  20% bonus per ad
                </p>
              </CardContent>
            </Card>
          )}
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
                <p>• Wait for at least {MIN_AD_TIME} seconds</p>
                <p>• Close the ad window when timer completes</p>
                <p>• {COOLDOWN_MINUTES} minute cooldown between ads</p>
                <p className="text-emerald-400">• Points are immediately usable - no waiting!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points to USD Converter */}
        <Card className="mb-8 bg-gradient-to-br from-purple-800/40 via-violet-700/30 to-purple-800/40 border border-purple-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-purple-400" />
              Convert Points to USD
            </CardTitle>
          </CardHeader>
          <CardContent>
            {converterEligible ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                  <p className="text-emerald-300 font-medium flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    ✅ You're eligible to convert points to USD!
                  </p>
                  <p className="text-emerald-200 text-sm mt-2">
                    You have {converterData?.requirements?.referralCount || 0} referrals with {converterData?.requirements?.totalReferralPoints?.toFixed(2) || 0} total points
                  </p>
                </div>

                {!showConverter ? (
                  <Button
                    onClick={() => setShowConverter(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
                  >
                    <TrendingUp className="h-5 w-5 mr-2 inline-block" />
                    Convert Points Now
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <label className="text-white text-sm font-medium block mb-2">
                        Points to Convert:
                      </label>
                      <input
                        type="number"
                        value={pointsToConvert}
                        onChange={(e) => setPointsToConvert(e.target.value)}
                        placeholder="Enter points amount"
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-purple-400 focus:outline-none"
                        min="0"
                        max={adPoints}
                      />
                      <p className="text-slate-400 text-xs mt-2">
                        Available: {adPoints.toFixed(2)} points • Conversion Rate: 1000 points = $0.36 USD
                      </p>
                      {pointsToConvert && (
                        <p className="text-purple-300 text-sm mt-2 font-medium">
                          You'll receive: ${(parseFloat(pointsToConvert) * 0.00036).toFixed(4)} USD
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleConvertPoints}
                        disabled={isConverting || !pointsToConvert || parseFloat(pointsToConvert) <= 0}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold"
                      >
                        {isConverting ? 'Converting...' : 'Confirm Conversion'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowConverter(false);
                          setPointsToConvert('');
                        }}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                      <p className="text-amber-200 font-medium text-lg">
                        Amazing opportunity ahead! 🎯
                      </p>
                      <p className="text-slate-300">
                        Refer <span className="text-amber-400 font-bold">5 users</span> who create accounts and watch ads. 
                        Once they collectively earn <span className="text-amber-400 font-bold">2000 points</span>, you'll unlock the ability to:
                      </p>
                      <ul className="space-y-2 text-slate-300 ml-4">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
                          Convert points to USD dollars
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
                          Buy premium plans with your earnings
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
                          Withdraw your earnings as cash
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {converterData && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
                      <p className="text-slate-400 text-sm mb-1">Your Referrals</p>
                      <p className="text-2xl font-bold text-white">
                        {converterData.requirements?.referralCount || 0} / 5
                      </p>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((converterData.requirements?.referralCount / 5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30">
                      <p className="text-slate-400 text-sm mb-1">Referral Points</p>
                      <p className="text-2xl font-bold text-white">
                        {converterData.requirements?.totalReferralPoints?.toFixed(0) || 0} / 2000
                      </p>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((converterData.requirements?.totalReferralPoints / 2000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Native Banner Ad #1 */}
        <Card className="mb-8 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Advertisement</p>
              {/* Container for Adsterra Native Banner - Script loaded via useEffect */}
              <div id="container-417361b7b935487420113f3245829f9c"></div>
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

        {/* Banner 300x250 */}
        <Card className="mt-8 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Advertisement</p>
              {/* Container for Adsterra Banner - Script loaded via useEffect */}
              <div id="adsterra-banner-300x250"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Adsterra Social Bar - Fixed at bottom */}
      {mounted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center">
              <p className="text-xs text-slate-400">Advertisement - Social Bar loaded via script</p>
              {/* Script loaded via useEffect */}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
