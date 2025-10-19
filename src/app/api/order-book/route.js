import { NextResponse } from 'next/server';
import databaseHelpers from '@/lib/database';

export async function GET() {
  try {
    // Get current token price
    const currentTokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = currentTokenValue?.value || 0.0035;

    // Generate realistic order book data based on current price
    const generateOrderBook = (basePrice) => {
      const bids = [];
      const asks = [];
      
      // Generate 10 levels for each side
      for (let i = 0; i < 10; i++) {
        // Bids (buy orders) - below current price
        const bidPrice = basePrice - (i + 1) * (basePrice * 0.001);
        const bidAmount = Math.random() * 100 + 10; // 10-110 tokens
        const bidTotal = bidPrice * bidAmount;
        
        bids.push({
          price: bidPrice.toFixed(4),
          amount: bidAmount.toFixed(2),
          total: bidTotal.toFixed(2),
          level: i + 1
        });

        // Asks (sell orders) - above current price
        const askPrice = basePrice + (i + 1) * (basePrice * 0.001);
        const askAmount = Math.random() * 100 + 10; // 10-110 tokens
        const askTotal = askPrice * askAmount;
        
        asks.push({
          price: askPrice.toFixed(4),
          amount: askAmount.toFixed(2),
          total: askTotal.toFixed(2),
          level: i + 1
        });
      }

      // Sort bids descending (highest first) and asks ascending (lowest first)
      bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

      return { bids, asks };
    };

    // Get recent transactions for trade history
    const transactionsResult = await databaseHelpers.transaction.getAllTransactions({ limit: 20 });
    const recentTransactions = transactionsResult.data || [];
    
    // Generate recent trades from transaction data
    const generateRecentTrades = (transactions, basePrice) => {
      const trades = [];
      
      transactions.forEach((tx, index) => {
        if (tx.type === 'BUY' || tx.type === 'SELL') {
          // Generate realistic price variation around base price
          const priceVariation = (Math.random() - 0.5) * basePrice * 0.02; // ±1% variation
          const tradePrice = (basePrice + priceVariation).toFixed(4);
          
          trades.push({
            id: tx.id,
            price: tradePrice,
            amount: tx.amount ? parseFloat(tx.amount).toFixed(2) : (Math.random() * 50 + 5).toFixed(2),
            time: new Date(tx.createdAt).toLocaleTimeString('en-PK', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            type: tx.type.toLowerCase(),
            timestamp: tx.createdAt,
            total: (parseFloat(tradePrice) * parseFloat(tx.amount || Math.random() * 50 + 5)).toFixed(2)
          });
        }
      });

      // If no real transactions, generate some sample data
      if (trades.length === 0) {
        for (let i = 0; i < 15; i++) {
          const priceVariation = (Math.random() - 0.5) * basePrice * 0.02;
          const tradePrice = (basePrice + priceVariation).toFixed(4);
          const amount = (Math.random() * 50 + 5).toFixed(2);
          
          trades.push({
            id: `sample_${i + 1}`,
            price: tradePrice,
            amount: amount,
            time: new Date(Date.now() - i * 60000).toLocaleTimeString('en-PK', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            total: (parseFloat(tradePrice) * parseFloat(amount)).toFixed(2)
          });
        }
      }

      // Sort by timestamp descending (most recent first)
      return trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const orderBook = generateOrderBook(currentPrice);
    const recentTrades = generateRecentTrades(recentTransactions, currentPrice);

    // Calculate spread
    const bestBid = parseFloat(orderBook.bids[0]?.price || 0);
    const bestAsk = parseFloat(orderBook.asks[0]?.price || 0);
    const spread = bestAsk - bestBid;
    const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    // Calculate market depth
    const totalBidVolume = orderBook.bids.reduce((sum, bid) => sum + parseFloat(bid.total), 0);
    const totalAskVolume = orderBook.asks.reduce((sum, ask) => sum + parseFloat(ask.total), 0);

    const orderBookData = {
      bids: orderBook.bids,
      asks: orderBook.asks,
      spread: {
        absolute: spread.toFixed(4),
        percentage: spreadPercentage.toFixed(2)
      },
      depth: {
        bidVolume: totalBidVolume.toFixed(2),
        askVolume: totalAskVolume.toFixed(2)
      },
      lastUpdate: new Date().toISOString()
    };

    const tradesData = {
      trades: recentTrades,
      totalTrades: recentTrades.length,
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        orderBook: orderBookData,
        recentTrades: tradesData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Order book API error:', error);
    
    // Fallback data in case of error
    const fallbackPrice = 0.0035;
    const fallbackOrderBook = {
      bids: Array.from({ length: 10 }, (_, i) => ({
        price: (fallbackPrice - (i + 1) * 0.0001).toFixed(4),
        amount: (Math.random() * 50 + 10).toFixed(2),
        total: ((fallbackPrice - (i + 1) * 0.0001) * (Math.random() * 50 + 10)).toFixed(2),
        level: i + 1
      })),
      asks: Array.from({ length: 10 }, (_, i) => ({
        price: (fallbackPrice + (i + 1) * 0.0001).toFixed(4),
        amount: (Math.random() * 50 + 10).toFixed(2),
        total: ((fallbackPrice + (i + 1) * 0.0001) * (Math.random() * 50 + 10)).toFixed(2),
        level: i + 1
      })),
      spread: { absolute: '0.0002', percentage: '0.06' },
      depth: { bidVolume: '1000.00', askVolume: '1000.00' },
      lastUpdate: new Date().toISOString()
    };

    const fallbackTrades = Array.from({ length: 15 }, (_, i) => ({
      id: `fallback_${i + 1}`,
      price: (fallbackPrice + (Math.random() - 0.5) * 0.0001).toFixed(4),
      amount: (Math.random() * 50 + 5).toFixed(2),
      time: new Date(Date.now() - i * 60000).toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      total: (fallbackPrice * (Math.random() * 50 + 5)).toFixed(2)
    }));

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live data',
      data: {
        orderBook: fallbackOrderBook,
        recentTrades: {
          trades: fallbackTrades,
          totalTrades: fallbackTrades.length,
          lastUpdate: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}
