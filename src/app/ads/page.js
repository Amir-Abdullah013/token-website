'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { Play, Clock, Gift, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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
  
  // Constants
  const REWARD_PER_AD = 10; // VON tokens
  const DAILY_LIMIT = 2; // ads per day
  const COOLDOWN_MINUTES = 30; // minutes between ads

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAdStats();
      fetchAdHistory();
    }
  }, [isAuthenticated, user?.id]);

  const fetchAdStats = async () => {
    try {
      const response = await fetch(`/api/ads/stats?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAdsWatchedToday(data.adsWatchedToday || 0);
        setNextAdAvailable(data.nextAdAvailable);
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

  const handleWatchAd = async () => {
    if (isWatchingAd) return;

    // Check if user can watch ad
    if (adsWatchedToday >= DAILY_LIMIT) {
      error('Daily limit reached! Come back tomorrow.');
      return;
    }

    if (nextAdAvailable && new Date() < new Date(nextAdAvailable)) {
      const minutesLeft = Math.ceil((new Date(nextAdAvailable) - new Date()) / 60000);
      error(`Please wait ${minutesLeft} minutes before watching another ad.`);
      return;
    }

    setIsWatchingAd(true);

    try {
      // TODO: ADMAVEN SDK INTEGRATION POINT
      // Insert AdMaven video ad SDK here
      // Example:
      // window.AdMaven.showVideoAd({
      //   zoneId: 'YOUR_ZONE_ID',
      //   onAdStarted: () => console.log('Ad started'),
      //   onAdCompleted: () => handleAdCompleted(),
      //   onAdError: (err) => handleAdError(err)
      // });

      // For now, simulate ad watching with a delay
      success('Loading ad...');
      
      // Simulate 30-second ad
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Call backend to verify and credit tokens
      await handleAdCompleted();

    } catch (err) {
      console.error('Error watching ad:', err);
      error('Failed to load ad. Please try again.');
      setIsWatchingAd(false);
    }
  };

  const handleAdCompleted = async () => {
    try {
      // TODO: SERVER-TO-SERVER POSTBACK VERIFICATION
      // In production, AdMaven will send a server-to-server postback to verify ad completion
      // The backend should validate the postback signature before crediting tokens
      // Endpoint: /api/ads/postback (receives AdMaven callback)
      
      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          // TODO: Include AdMaven transaction ID for verification
          // adTransactionId: window.AdMaven.getTransactionId(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        success(`🎉 Congratulations! You earned ${REWARD_PER_AD} VON tokens!`);
        
        // Update stats
        setAdsWatchedToday(result.adsWatchedToday);
        setNextAdAvailable(result.nextAdAvailable);
        
        // Refresh history
        await fetchAdHistory();
        
        // Trigger wallet refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('wallet-updated'));
        }
      } else {
        error(result.error || 'Failed to credit tokens');
      }
    } catch (err) {
      console.error('Error completing ad:', err);
      error('Failed to process reward. Please contact support.');
    } finally {
      setIsWatchingAd(false);
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
    if (adsWatchedToday >= DAILY_LIMIT) return false;
    if (nextAdAvailable && new Date() < new Date(nextAdAvailable)) return false;
    return true;
  };

  const getTimeUntilNextAd = () => {
    if (!nextAdAvailable) return null;
    const now = new Date();
    const next = new Date(nextAdAvailable);
    if (now >= next) return null;
    
    const diff = next - now;
    const minutes = Math.ceil(diff / 60000);
    return minutes;
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
              Please sign in to earn tokens by watching ads.
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

  const minutesUntilNext = getTimeUntilNextAd();

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Earn Tokens by Watching Ads
                </h1>
                <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                  BETA
                </span>
              </div>
              <p className="text-slate-300 mt-1">Watch video ads and earn VON tokens instantly!</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-teal-500/30 border border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Reward Per Ad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {REWARD_PER_AD} VON
              </div>
              <p className="text-emerald-200 text-sm">
                Instant credit to your wallet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 border border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Ads Watched Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {adsWatchedToday} / {DAILY_LIMIT}
              </div>
              <p className="text-cyan-200 text-sm">
                {DAILY_LIMIT - adsWatchedToday} remaining today
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
                {minutesUntilNext ? `${minutesUntilNext}m` : '0m'}
              </div>
              <p className="text-violet-200 text-sm">
                {minutesUntilNext ? 'Wait before next ad' : 'Ready to watch!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Watch Ad Button */}
        <Card className="mb-8 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <Button
                onClick={handleWatchAd}
                disabled={!canWatchAd() || isWatchingAd}
                className={`text-lg px-8 py-4 font-bold shadow-lg transition-all transform hover:scale-105 ${
                  canWatchAd() && !isWatchingAd
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-500/30 animate-pulse'
                    : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isWatchingAd ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Loading Ad...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2 inline-block" />
                    Watch Ad & Earn {REWARD_PER_AD} VON
                  </>
                )}
              </Button>

              {!canWatchAd() && !isWatchingAd && (
                <div className="mt-4 text-amber-400 text-sm">
                  {adsWatchedToday >= DAILY_LIMIT
                    ? '⏰ Daily limit reached. Come back tomorrow!'
                    : minutesUntilNext
                    ? `⏳ Please wait ${minutesUntilNext} minutes before watching another ad`
                    : 'Ready to watch!'}
                </div>
              )}

              <div className="mt-6 text-slate-400 text-sm space-y-1">
                <p>• Watch the full video to earn tokens</p>
                <p>• Tokens are credited instantly after completion</p>
                <p>• Maximum {DAILY_LIMIT} ads per day</p>
                <p>• {COOLDOWN_MINUTES} minute cooldown between ads</p>
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
                        <td className="px-4 py-3 text-sm font-medium text-emerald-400">
                          +{record.reward} VON
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
