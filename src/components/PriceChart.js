'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { useVon } from '@/lib/Von-context';

// Time filter options
const TIME_FILTERS = [
  { label: '1M', value: '1min', hours: 1/60 },
  { label: '1H', value: '1h', hours: 1 },
  { label: '1D', value: '1d', hours: 24 },
  { label: '7D', value: '7d', hours: 168 },
  { label: '30D', value: '30d', hours: 720 }
];

// Generate dummy price data
// Fetch real price data from API
const fetchPriceData = async (timeFilter) => {
  try {
    console.log('📊 Fetching real price data for timeFilter:', timeFilter);
    
    const response = await fetch(`/api/price-chart?timeFilter=${timeFilter}&limit=50`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Real price data fetched:', {
        success: result.success,
        dataPoints: result.dataPoints,
        currentPrice: result.currentPrice,
        priceChange: result.priceChange,
        fallback: result.fallback
      });
      return result;
    } else {
      console.error('❌ Failed to fetch price data:', response.status);
      throw new Error('Failed to fetch price data');
    }
  } catch (error) {
    console.error('❌ Error fetching price data:', error);
    throw error;
  }
};

// Simple data generator like real token websites
const generateFallbackData = (timeFilter, currentPrice = 0.0035) => {
  const now = new Date();
  const data = [];
  const points = 50; // Number of data points
  
  let startTime;
  let interval;
  
  switch (timeFilter) {
    case '1min':
      startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      interval = 60 * 1000; // 1 minute intervals
      break;
    case '1h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      interval = 24 * 60 * 1000; // 1 hour intervals
      break;
    case '1d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      interval = 7 * 24 * 60 * 1000; // 1 day intervals
      break;
    case '7d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      interval = 30 * 24 * 60 * 1000; // 7 day intervals
      break;
    case '30d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      interval = 90 * 24 * 60 * 1000; // 30 day intervals
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 7 * 24 * 60 * 1000;
  }
  
  // Generate realistic price movement like real token websites
  // Start at current price (0.0035) and create visible fluctuations
  let basePrice = currentPrice; // Start at current price
  
  // Create a trend that starts at current price, fluctuates, and returns to current price
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * interval));
    
    // For the first point, use exact current price
    if (i === 0) {
      basePrice = currentPrice;
    } else if (i === points - 1) {
      // Last point should be current price
      basePrice = currentPrice;
    } else {
      // Create visible price movements with trend
      // Use a combination of trend and random volatility
      const progress = i / (points - 1); // 0 to 1
      
      // Create a wave pattern that starts and ends at current price
      // This creates visible up and down movements
      const wave = Math.sin(progress * Math.PI * 2) * 0.003; // Wave amplitude
      const trend = (progress - 0.5) * 0.002; // Slight trend
      const volatility = 0.002; // 0.2% random volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      
      // Combine wave, trend, and random changes
      basePrice = currentPrice * (1 + wave + trend + randomChange);
      
      // Keep price within reasonable range (2% above/below current price)
      const minPrice = currentPrice * 0.98; // 2% below
      const maxPrice = currentPrice * 1.02; // 2% above
      basePrice = Math.max(minPrice, Math.min(maxPrice, basePrice));
    }
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(basePrice.toFixed(6)),
      volume: Math.floor(Math.random() * 1000000) + 100000,
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    });
  }
  
  // Calculate baseline from minimum price in the dataset (excluding first point which will be forced to currentPrice)
  // This shows the change from the lowest point, which is more meaningful
  const pricesForBaseline = data.length > 1 ? data.slice(1, -1).map(d => d.price) : [currentPrice];
  const minPrice = Math.min(...pricesForBaseline, currentPrice);
  const maxPrice = Math.max(...pricesForBaseline, currentPrice);
  
  // Use minimum price as baseline to show gain from lowest point
  // This is more meaningful than using first point since first point is forced to currentPrice
  const baselinePrice = minPrice;
  
  // Calculate price change from baseline (min price) to current price
  // This shows the change over the selected time period
  const priceChange = currentPrice - baselinePrice;
  
  // Ensure the first point is exactly the current price (for visual consistency)
  if (data.length > 0) {
    data[0].price = currentPrice;
    data[0].timestamp = startTime.toISOString();
  }
  
  // Ensure the last point is exactly the current price
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice;
    data[data.length - 1].timestamp = now.toISOString();
    data[data.length - 1].time = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    data[data.length - 1].date = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  return {
    data,
    currentPrice,
    priceChange: priceChange,
    baselinePrice: baselinePrice
  };
};

// Premium custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-md p-3 border-2 border-cyan-500/50 rounded-lg shadow-2xl">
        <p className="text-xs text-slate-300 mb-1.5 font-medium">
          {data.date} {data.time}
        </p>
        <p className="text-lg font-bold text-cyan-400">
          ${data.price.toFixed(6)}
        </p>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Volume: {data.volume.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Premium loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-lg border border-slate-600/20 backdrop-blur-sm">
      <div className="h-full bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg"></div>
    </div>
  </div>
);

const PriceChart = ({ className = '' }) => {
  const { VonPrice } = useVon();
  const [selectedFilter, setSelectedFilter] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(VonPrice);
  const [priceChange, setPriceChange] = useState(0);
  const [baselinePrice, setBaselinePrice] = useState(VonPrice);
  
  // Calculate Y-axis domain based on current price to ensure proper display
  // Make sure domain shows the full range of price fluctuations
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0 || !currentPrice) {
      return [0, 0.01];
    }
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1 || currentPrice * 0.01; // 10% padding or 1% of current price
    
    // Ensure domain shows visible range around current price
    const domainMin = Math.max(0, Math.min(minPrice - padding, currentPrice * 0.98));
    const domainMax = Math.max(maxPrice + padding, currentPrice * 1.02);
    
    return [domainMin, domainMax];
  }, [chartData, currentPrice]);

  // Generate data when filter changes
  useEffect(() => {
    const loadPriceData = () => {
      setIsLoading(true);
      
      // Use fallback data with real Von price
      const result = generateFallbackData(selectedFilter, VonPrice);
      setChartData(result.data);
      setCurrentPrice(result.currentPrice);
      setPriceChange(result.priceChange);
      setBaselinePrice(result.baselinePrice || result.currentPrice); // Store baseline for percentage calculation
      
      setIsLoading(false);
    };

    loadPriceData();
  }, [selectedFilter, VonPrice]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  // Format price for display
  const formatPrice = (price) => {
    return `$${price.toFixed(6)}`;
  };

  // Get price change color
  const getPriceChangeColor = () => {
    return priceChange >= 0 ? 'text-green-400' : 'text-red-400';
  };

  // Get price change icon
  const getPriceChangeIcon = () => {
    return priceChange >= 0 ? '📈' : '📉';
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Premium Time Range Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-300 font-medium">Time Range:</span>
          <div className="flex space-x-1">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(filter.value)}
                className={`text-xs px-3 py-1 rounded-md transition-all duration-200 font-medium ${
                  selectedFilter === filter.value
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30'
                    : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Current Price Display */}
      <div className="mb-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-4 border border-slate-600/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300 mb-1 font-medium">Current Price</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {formatPrice(currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm font-semibold ${getPriceChangeColor()}`}>
              <span className="mr-1 text-lg">{getPriceChangeIcon()}</span>
              <span>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} 
                ({baselinePrice > 0 ? ((priceChange / baselinePrice) * 100).toFixed(2) : '0.00'}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {selectedFilter === '1min' ? 'Last hour' :
               selectedFilter === '1h' ? 'Last 24 hours' :
               selectedFilter === '1d' ? 'Last 7 days' :
               selectedFilter === '7d' ? 'Last 30 days' :
               'Last 90 days'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="h-80 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-4 border border-slate-600/20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#475569" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="time"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(6)}`}
                width={80}
                domain={yAxisDomain}
                allowDecimals={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="priceLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={1}/>
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="price"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: '#06B6D4', 
                  stroke: '#ffffff', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8))'
                }}
                fill="url(#priceGradient)"
                isAnimationActive={true}
                animationDuration={300}
              />
              <ReferenceLine 
                y={currentPrice} 
                stroke="#10B981" 
                strokeDasharray="5 5"
                strokeOpacity={0.6}
                strokeWidth={1.5}
                label={{ value: 'Current', position: 'right', fill: '#10B981', fontSize: 10 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Premium Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-lg p-3 border border-slate-600/20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mr-2 shadow-sm shadow-cyan-500/50"></div>
            <span className="text-slate-200 font-medium">Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-2 shadow-sm shadow-emerald-500/50" style={{ opacity: 0.8 }}></div>
            <span className="text-slate-200 font-medium">Current</span>
          </div>
        </div>
        <div className="text-slate-300 font-medium">
          {chartData.length} data points
        </div>
      </div>
    </div>
  );
};

export default PriceChart;












