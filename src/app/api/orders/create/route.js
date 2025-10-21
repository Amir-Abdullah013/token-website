import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderType, priceType, amount, limitPrice } = await request.json();

    // Validation
    if (!orderType || !priceType || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data' },
        { status: 400 }
      );
    }

    if (priceType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Limit price is required for limit orders' },
        { status: 400 }
      );
    }

    // Get current token price for calculating token amount
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;

    // Calculate token amount based on order type
    let tokenAmount;
    if (orderType === 'BUY') {
      // For buy orders, amount is in USD, calculate how many tokens
      const priceToUse = priceType === 'LIMIT' ? limitPrice : currentPrice;
      tokenAmount = amount / priceToUse;
    } else {
      // For sell orders, amount is in tokens
      tokenAmount = amount;
    }

    // For market orders, execute immediately
    if (priceType === 'MARKET') {
      // Market orders are executed immediately via the existing buy/sell APIs
      // So we don't create an order record for them
      return NextResponse.json({
        success: false,
        error: 'Market orders should be executed via buy/sell endpoints',
        message: 'Use /api/Von/buy or /api/Von/sell for market orders'
      }, { status: 400 });
    }

    // Validate user has sufficient balance for the order
    const wallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (orderType === 'BUY') {
      if (wallet.usdBalance < amount) {
        return NextResponse.json(
          { success: false, error: `Insufficient USD balance. You have $${wallet.usdBalance.toFixed(2)}, but need $${amount.toFixed(2)}` },
          { status: 400 }
        );
      }
      
      // Reserve the USD amount (we'll implement fund locking later if needed)
      // For now, just check balance
    } else if (orderType === 'SELL') {
      if (wallet.VonBalance < amount) {
        return NextResponse.json(
          { success: false, error: `Insufficient Von balance. You have ${wallet.VonBalance.toFixed(2)} Von, but need ${amount.toFixed(2)} Von` },
          { status: 400 }
        );
      }
    }

    // Create the limit order
    const order = await databaseHelpers.order.createOrder({
      userId: session.id,
      orderType,
      priceType,
      amount,
      tokenAmount,
      limitPrice: priceType === 'LIMIT' ? limitPrice : null
    });

    console.log('✅ Limit order created:', {
      orderId: order.id,
      userId: session.id,
      orderType,
      amount,
      limitPrice
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderType: order.orderType,
        priceType: order.priceType,
        amount: parseFloat(order.amount),
        tokenAmount: parseFloat(order.tokenAmount),
        limitPrice: order.limitPrice ? parseFloat(order.limitPrice) : null,
        status: order.status,
        createdAt: order.createdAt
      },
      message: `Limit order created successfully. Your order will execute when the price reaches $${limitPrice}`
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}


