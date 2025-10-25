import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('filter') || '1d';
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    // Get current price
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    
    // Generate realistic historical data based on current price and time filter
    const now = new Date();
    const data = [];
    
    let startTime;
    let interval;
    let points = limit;
    
    switch (timeFilter) {
      case '1min':
        startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        interval = 60 * 1000; // 1 minute intervals
        points = Math.min(60, limit);
        break;
      case '1h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        interval = 24 * 60 * 1000; // 1 hour intervals
        points = Math.min(24, limit);
        break;
      case '1d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        interval = 7 * 24 * 60 * 1000; // 1 day intervals
        points = Math.min(7, limit);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        interval = 30 * 24 * 60 * 1000; // 7 day intervals
        points = Math.min(30, limit);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        interval = 90 * 24 * 60 * 1000; // 30 day intervals
        points = Math.min(90, limit);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 7 * 24 * 60 * 1000;
        points = Math.min(7, limit);
    }
    
    // Generate historical data based on current price
    let basePrice = currentPrice; // Start with the actual current price
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(startTime.getTime() + (i * interval));
      
      // Generate realistic price movement with very small variations
      const volatility = 0.002; // 0.2% volatility for more stable prices
      const change = (Math.random() - 0.5) * volatility;
      basePrice = basePrice * (1 + change);
      
      // Keep prices very close to current price for accuracy
      const minPrice = currentPrice * 0.998; // 0.2% below current
      const maxPrice = currentPrice * 1.002; // 0.2% above current
      basePrice = Math.max(minPrice, Math.min(maxPrice, basePrice));
      
      data.push({
        timestamp: timestamp.toISOString(),
        price: parseFloat(basePrice.toFixed(6)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
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
    
    // Ensure the first and last points are accurate
    if (data.length > 0) {
      // Set first point to current price for accuracy
      data[0].price = currentPrice;
      
      // Set last point to current price
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
    
    console.log('📊 Price History API:', {
      timeFilter,
      points: data.length,
      currentPrice,
      firstPrice: data[0]?.price,
      lastPrice: data[data.length - 1]?.price,
      priceRange: {
        min: Math.min(...data.map(d => d.price)),
        max: Math.max(...data.map(d => d.price))
      },
      priceValues: data.slice(0, 3).map(d => d.price) // First 3 price values
    });
    
    return NextResponse.json({
      success: true,
      data: data,
      currentPrice: currentPrice,
      timeFilter,
      points: data.length,
      priceRange: {
        min: Math.min(...data.map(d => d.price)),
        max: Math.max(...data.map(d => d.price))
      }
    });
    
  } catch (error) {
    console.error('Price History API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price history',
      data: [],
      currentPrice: 0.0035
    }, { status: 500 });
  }
}
