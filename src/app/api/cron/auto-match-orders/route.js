import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { requireCronAuth } from '@/lib/cron-auth';

/**
 * PRODUCTION Auto Order Matching
 * Triggered via external cron (cron-job.org)
 * Runs every minute
 */

export async function GET(request) {
  const startTime = Date.now();

  try {
    // 🔐 Cron authentication
    const authError = requireCronAuth(request);
    if (authError) return authError;

    console.log(`[${new Date().toISOString()}] 🤖 Auto Match Orders START`);

    // ⏱️ Hard timeout protection (Vercel safe)
    const TIMEOUT_MS = 50_000;

    const result = await Promise.race([
      runAutoMatchLogic(startTime),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cron execution timeout')), TIMEOUT_MS)
      ),
    ]);

    return result;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Auto Match Orders FAILED`, error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Auto match failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 🔁 Shared logic (clean separation)
async function runAutoMatchLogic(startTime) {
  const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
  const currentPrice = tokenValue.currentTokenValue;

  console.log(`[${new Date().toISOString()}] 📊 Price: $${currentPrice}`);

  const pendingOrders = await databaseHelpers.order.getPendingLimitOrders();
  console.log(`[${new Date().toISOString()}] 📋 Pending orders: ${pendingOrders.length}`);

  if (!pendingOrders.length) {
    return NextResponse.json({
      success: true,
      message: 'No pending orders',
      executedCount: 0,
      executionTime: Date.now() - startTime,
    });
  }

  let executedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const batchSize = 10;

  for (let i = 0; i < pendingOrders.length; i += batchSize) {
    const batch = pendingOrders.slice(i, i + batchSize);

    for (const order of batch) {
      try {
        const limitPrice = Number(order.limitPrice);
        const amount = Number(order.amount);
        const userId = order.userId;

        let shouldExecute =
          (order.orderType === 'BUY' && currentPrice <= limitPrice) ||
          (order.orderType === 'SELL' && currentPrice >= limitPrice);

        if (!shouldExecute) {
          skippedCount++;
          continue;
        }

        const wallet = await databaseHelpers.wallet.getWalletByUserId(userId);
        if (!wallet) {
          await databaseHelpers.order.cancelOrder(order.id);
          errorCount++;
          continue;
        }

        if (order.orderType === 'BUY') {
          if (Number(wallet.usdBalance) < amount) {
            await databaseHelpers.order.cancelOrder(order.id);
            errorCount++;
            continue;
          }

          const tokens = amount / currentPrice;
          await databaseHelpers.wallet.updateUsdBalance(userId, -amount);
          await databaseHelpers.wallet.updateVonBalance(userId, tokens);
        } else {
          if (Number(wallet.VonBalance) < amount) {
            await databaseHelpers.order.cancelOrder(order.id);
            errorCount++;
            continue;
          }

          const usd = amount * currentPrice;
          await databaseHelpers.wallet.updateVonBalance(userId, -amount);
          await databaseHelpers.wallet.updateUsdBalance(userId, usd);
        }

        await databaseHelpers.order.updateOrderStatus(order.id, 'FILLED', new Date());
        executedCount++;

      } catch (err) {
        console.error('❌ Order error:', err);
        errorCount++;
      }
    }

    await new Promise(r => setTimeout(r, 100)); // DB safety
  }

  return NextResponse.json({
    success: true,
    executedCount,
    skippedCount,
    errorCount,
    currentPrice,
    executionTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
}

// Allow POST for manual secure testing
export async function POST(request) {
  return GET(request);
}

