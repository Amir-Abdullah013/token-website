'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useTiki } from '../../../lib/tiki-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Coins,
  Calendar,
  Shield,
  Zap,
  Star
} from 'lucide-react';

export default function StakingPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki } = useTiki();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    duration: '7'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data state
  const [stakings, setStakings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Validation rules
  const MIN_AMOUNT = 100;
  const MAX_AMOUNT = 100000;

  // Staking duration options
  const STAKING_OPTIONS = [
    { days: 7, rewardPercent: 3, label: '7 Days', description: '3% APY - Quick Returns' },
    { days: 15, rewardPercent: 4, label: '15 Days', description: '4% APY - Short Term' },
    { days: 30, rewardPercent: 6, label: '30 Days', description: '6% APY - Monthly' },
    { days: 90, rewardPercent: 10, label: '90 Days', description: '10% APY - Maximum Returns' }
  ];

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchStakings();
    }
  }, [isAuthenticated]);

  const fetchStakings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stake');
      if (response.ok) {
      const data = await response.json();
        setStakings(data.stakings || []);
      } else {
        console.error('Failed to fetch stakings');
      }
    } catch (error) {
      console.error('Error fetching stakings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
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
    
    if (!formData.amount || parseFloat(formData.amount) < MIN_AMOUNT) {
      newErrors.amount = `Minimum staking amount is ${formatTiki(MIN_AMOUNT)} TIKI`;
    }
    
    if (parseFloat(formData.amount) > parseFloat(tikiBalance)) {
      newErrors.amount = 'Insufficient TIKI balance';
    }
    
    if (parseFloat(formData.amount) > MAX_AMOUNT) {
      newErrors.amount = `Maximum staking amount is ${formatTiki(MAX_AMOUNT)} TIKI`;
    }
    
    if (!formData.duration) {
      newErrors.duration = 'Please select a staking duration';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStake = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          durationDays: parseInt(formData.duration)
        }),
      });

      const result = await response.json();

      if (result.success) {
        success(`Successfully staked ${formatTiki(parseFloat(formData.amount))} TIKI for ${formData.duration} days!`);
        setFormData({ amount: '', duration: '7' });
        fetchStakings();
      } else {
        error(result.error || 'Failed to stake tokens');
      }
    } catch (error) {
      console.error('Staking error:', error);
      error('Failed to stake tokens. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (stakingId) => {
    try {
      const response = await fetch(`/api/stake/${stakingId}/claim`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        success('Successfully claimed staking rewards!');
        fetchStakings();
      } else {
        error(result.error || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Claim error:', error);
      error('Failed to claim rewards. Please try again.');
    }
  };

  const getSelectedOption = () => {
    return STAKING_OPTIONS.find(option => option.days.toString() === formData.duration) || STAKING_OPTIONS[0];
  };

  const calculateReward = () => {
    const amount = parseFloat(formData.amount) || 0;
    const selectedOption = getSelectedOption();
    const reward = (amount * selectedOption.rewardPercent) / 100;
    return reward;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-white border border-cyan-400/60';
      case 'COMPLETED':
        return 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 text-white border border-emerald-400/60';
      case 'CLAIMED':
        return 'bg-gradient-to-r from-violet-500/40 to-purple-500/40 text-white border border-violet-400/60';
      default:
        return 'bg-gradient-to-r from-slate-500/40 to-gray-500/40 text-white border border-slate-400/60';
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
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
              Please sign in to access the staking features.
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm shadow-xl border-b border-slate-600/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                TIKI Staking
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                Earn rewards by staking your TIKI tokens. Choose your preferred duration and start earning today.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Balance Card */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 border border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/30 backdrop-blur-sm">
          <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center">
                    <Coins className="h-5 w-5 mr-2" />
                    Your TIKI Balance
                  </CardTitle>
          </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {formatTiki(tikiBalance)}
                  </div>
                  <p className="text-slate-300 text-sm">
                    Available for staking
                  </p>
          </CardContent>
        </Card>
            </div>

        {/* Staking Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
          <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Stake TIKI Tokens
                  </CardTitle>
                  <p className="text-slate-300 text-sm">
                    Choose your staking amount and duration to start earning rewards
                  </p>
          </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Input */}
              <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Staking Amount (TIKI)
                </label>
                <Input
                  type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder={`Minimum ${formatTiki(MIN_AMOUNT)} TIKI`}
                      className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-lg"
                    />
                    {errors.amount && (
                      <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
                    )}
              </div>

                  {/* Duration Selection */}
              <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                  Staking Duration
                </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {STAKING_OPTIONS.map((option) => (
                        <button
                          key={option.days}
                          onClick={() => setFormData(prev => ({ ...prev, duration: option.days.toString() }))}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            formData.duration === option.days.toString()
                              ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-blue-500/20'
                              : 'border-slate-500/30 bg-gradient-to-r from-slate-700/30 to-slate-800/30 hover:border-slate-400/50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-white font-semibold">{option.label}</div>
                            <div className="text-cyan-400 font-bold text-lg">{option.rewardPercent}% APY</div>
                            <div className="text-slate-300 text-xs">{option.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.duration && (
                      <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
                    )}
              </div>

                  {/* Reward Preview */}
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-4 rounded-lg border border-emerald-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-emerald-200 text-sm font-medium">Expected Reward</div>
                          <div className="text-white text-xl font-bold">
                            {formatTiki(calculateReward())} TIKI
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-200 text-sm font-medium">APY</div>
                          <div className="text-white text-xl font-bold">
                            {getSelectedOption().rewardPercent}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stake Button */}
              <Button
                    onClick={handleStake}
                    disabled={isSubmitting || !formData.amount || !formData.duration}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/40 border border-cyan-400/60"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Staking...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Stake TIKI Tokens
                      </div>
                    )}
              </Button>
          </CardContent>
        </Card>
            </div>
          </div>

          {/* My Stakings Section */}
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
          <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  My Stakings
                </CardTitle>
                <p className="text-slate-300 text-sm">
                  Track your active staking positions and rewards
                </p>
          </CardHeader>
          <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : stakings.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Active Stakings</h3>
                    <p className="text-slate-300 mb-6">
                      Start staking your TIKI tokens to earn rewards
                    </p>
                    <Button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-cyan-500/40 border border-cyan-400/60"
                    >
                      Start Staking
                </Button>
              </div>
            ) : (
                  <div className="space-y-4">
                    {stakings.map((staking) => {
                      const daysRemaining = getDaysRemaining(staking.endDate);
                      return (
                        <div
                          key={staking.id}
                          className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 p-6 rounded-lg border border-slate-600/20 hover:border-slate-500/40 transition-all duration-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                            {/* Amount */}
                            <div>
                              <div className="text-sm text-slate-300">Amount</div>
                              <div className="text-white font-semibold">
                                {formatTiki(staking.amountStaked)} TIKI
                              </div>
                            </div>

                            {/* Duration */}
                            <div>
                              <div className="text-sm text-slate-300">Duration</div>
                              <div className="text-white font-semibold">
                                {staking.durationDays} days
                              </div>
                            </div>

                            {/* Reward */}
                            <div>
                              <div className="text-sm text-slate-300">Reward Rate</div>
                              <div className="text-white font-semibold">
                                {staking.rewardPercent}% APY
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <div className="text-sm text-slate-300">Status</div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(staking.status)}`}>
                                {staking.status}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="text-right">
                              {staking.status === 'COMPLETED' ? (
                                <Button
                                  onClick={() => handleClaim(staking.id)}
                                  className="bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-600/90 hover:to-green-600/90 text-white shadow-lg shadow-emerald-500/40 border border-emerald-400/60"
                                >
                                  Claim Reward
                                </Button>
                              ) : staking.status === 'ACTIVE' ? (
                                <div className="text-sm">
                                  <div className="text-slate-300">Time Remaining</div>
                                  <div className="text-white font-semibold">
                                    {daysRemaining} days
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-slate-400">
                                  {staking.status === 'CLAIMED' ? 'Claimed' : '—'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-4 pt-4 border-t border-slate-600/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-300">Start Date: </span>
                              <span className="text-white">{formatDate(staking.startDate)}</span>
                            </div>
                            <div>
                              <span className="text-slate-300">End Date: </span>
                              <span className="text-white">{formatDate(staking.endDate)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

          {/* Information Section */}
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Staking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-teal-500/30 p-4 rounded-lg border border-emerald-400/50">
                    <div className="flex items-center mb-3">
                      <Shield className="h-5 w-5 text-emerald-400 mr-2" />
                      <h3 className="text-sm font-medium text-white">How Staking Works</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                      Lock your TIKI tokens for a specified period to earn rewards. The longer you stake, the higher your returns.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-yellow-500/30 p-4 rounded-lg border border-amber-400/50">
                    <div className="flex items-center mb-3">
                      <TrendingUp className="h-5 w-5 text-amber-400 mr-2" />
                      <h3 className="text-sm font-medium text-white">Reward Structure</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                      Earn 3-10% APY based on your staking duration. Choose from 7, 15, 30, or 90 days. Rewards are calculated daily and paid upon completion.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 p-4 rounded-lg border border-violet-400/50">
                    <div className="flex items-center mb-3">
                      <Info className="h-5 w-5 text-violet-400 mr-2" />
                      <h3 className="text-sm font-medium text-white">Important Notes</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                      Staked tokens are locked until the end of the staking period. Early withdrawal is not possible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
