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
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 mb-1">
          {data.date} {data.time}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          ${data.price.toFixed(6)}
        </p>
        <p className="text-xs text-gray-500">
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
    <div className="h-64 bg-gray-200 rounded"></div>
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
    return priceChange >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Get price change icon
  const getPriceChangeIcon = () => {
    return priceChange >= 0 ? '📈' : '📉';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
           
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Time Range:</span>
              <div className="flex space-x-1">
                {TIME_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedFilter === filter.value ? 'default' : 'outline'}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`text-xs px-2 py-1 ${
                      selectedFilter === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current Price Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(currentPrice)}
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center text-sm ${getPriceChangeColor()}`}>
                  <span className="mr-1">{getPriceChangeIcon()}</span>
                  <span>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
                    ({((priceChange / (currentPrice - priceChange)) * 100).toFixed(2)}%)
                  </span>
                </div>
                <p className="text-xs text-gray-500">
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time"
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(6)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke="#10b981" 
                    strokeDasharray="2 2"
                    strokeOpacity={0.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart Info */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Price</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" style={{ opacity: 0.5 }}></div>
                <span>Current</span>
              </div>
            </div>
            <div>
              {chartData.length} data points
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceChart;












