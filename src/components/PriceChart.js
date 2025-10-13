'use client';

import { useState, useEffect } from 'react';
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
import { useTiki } from '../lib/tiki-context';

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

// Fallback data generator for when API fails
const generateFallbackData = (timeFilter) => {
  const now = new Date();
  const data = [];
  const currentPrice = 0.0035; // Default TIKI price
  let basePrice = currentPrice * 0.8;
  
  let points;
  let startTime;
  let interval;
  
  switch (timeFilter) {
    case '1min':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      interval = 60 * 1000;
      points = 60;
      break;
    case '1h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      interval = 24 * 60 * 1000;
      points = 24;
      break;
    case '1d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 7 * 24 * 60 * 1000;
      points = 7;
      break;
    case '7d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      interval = 30 * 24 * 60 * 1000;
      points = 30;
      break;
    case '30d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      interval = 90 * 24 * 60 * 1000;
      points = 90;
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 7 * 24 * 60 * 1000;
      points = 7;
  }
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * interval));
    const volatility = 0.05;
    const change = (Math.random() - 0.5) * volatility;
    basePrice = basePrice * (1 + change);
    basePrice = Math.max(currentPrice * 0.1, Math.min(currentPrice * 2.0, basePrice));
    
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
  
  // Add current price
  data.push({
    timestamp: now.toISOString(),
    price: currentPrice,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    time: now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    date: now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  });
  
  return {
    data,
    currentPrice,
    priceChange: data.length > 1 ? currentPrice - data[data.length - 2].price : 0
  };
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 backdrop-blur-md p-4 border border-white/20 rounded-lg shadow-xl">
        <p className="text-sm text-gray-300 mb-2">
          {data.date} {data.time}
        </p>
        <p className="text-xl font-bold text-white">
          ${data.price.toFixed(6)}
        </p>
        <p className="text-xs text-gray-400">
          Volume: {data.volume.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg"></div>
  </div>
);

const PriceChart = ({ className = '' }) => {
  const [selectedFilter, setSelectedFilter] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  // Fetch real data when filter changes
  useEffect(() => {
    const loadPriceData = async () => {
      setIsLoading(true);
      
      try {
        console.log('🔄 Loading price data for filter:', selectedFilter);
        const result = await fetchPriceData(selectedFilter);
        
        if (result.success) {
          setChartData(result.data);
          setCurrentPrice(result.currentPrice);
          setPriceChange(result.priceChange);
          
          console.log('✅ Price data loaded successfully:', {
            dataPoints: result.dataPoints,
            currentPrice: result.currentPrice,
            priceChange: result.priceChange,
            fallback: result.fallback
          });
        } else {
          console.error('❌ Failed to load price data');
          // Fallback to empty data
          setChartData([]);
          setCurrentPrice(0);
          setPriceChange(0);
        }
      } catch (error) {
        console.error('❌ Error loading price data:', error);
        // Use fallback data when API fails
        console.log('🔄 Using fallback data for timeFilter:', selectedFilter);
        const fallbackResult = generateFallbackData(selectedFilter);
        setChartData(fallbackResult.data);
        setCurrentPrice(fallbackResult.currentPrice);
        setPriceChange(fallbackResult.priceChange);
      } finally {
        setIsLoading(false);
      }
    };

    loadPriceData();
  }, [selectedFilter]);

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
      {/* Time Range Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">Time Range:</span>
          <div className="flex space-x-1">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(filter.value)}
                className={`text-xs px-3 py-1 rounded-md transition-all duration-200 ${
                  selectedFilter === filter.value
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Price Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300 mb-1">Current Price</p>
            <p className="text-3xl font-bold text-white">
              {formatPrice(currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm font-semibold ${getPriceChangeColor()}`}>
              <span className="mr-1 text-lg">{getPriceChangeIcon()}</span>
              <span>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} 
                ({((priceChange / (currentPrice - priceChange)) * 100).toFixed(2)}%)
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => `$${value.toFixed(6)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2 }}
                fill="url(#priceGradient)"
              />
              <ReferenceLine 
                y={currentPrice} 
                stroke="#10B981" 
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-white">Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" style={{ opacity: 0.7 }}></div>
            <span className="text-white">Current</span>
          </div>
        </div>
        <div className="text-gray-300">
          {chartData.length} data points
        </div>
      </div>
    </div>
  );
};

export default PriceChart;












