import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulate a price API response
    // In a real application, this would fetch from an external price API
    const basePrice = 0.0035;
    const variation = (Math.random() - 0.5) * 0.0001; // Small random variation
    const currentPrice = Math.max(0.0001, basePrice + variation);
    
    return NextResponse.json({
      success: true,
      price: parseFloat(currentPrice.toFixed(6)),
      timestamp: Date.now(),
      source: 'simulated'
    });
  } catch (error) {
    console.error('Price API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price',
      price: 0.0035, // Fallback price
      timestamp: Date.now()
    }, { status: 500 });
  }
}