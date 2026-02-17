import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * POST /api/ads/converter/convert
 * Convert ad points to USD balance
 * Requirements already verified by frontend
 */
export async function POST(request) {
  try {
    const { userId, pointsToConvert } = await request.json();

    if (!userId || !pointsToConvert) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and points to convert are required' 
      }, { status: 400 });
    }

    if (pointsToConvert <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Points to convert must be greater than 0' 
      }, { status: 400 });
    }

    const CONVERSION_RATE = 1000 / 0.36; // 1000 points = $0.36 USD (so ~2777.78 points per $1)
    const usdAmount = pointsToConvert * (0.36 / 1000); // Convert points to USD

    // Verify eligibility one more time (server-side check)
    const eligibilityCheck = await databaseHelpers.pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE "referrerId" = $1) as referral_count,
        (SELECT COALESCE(SUM(w."adPoints"), 0) 
         FROM wallets w 
         INNER JOIN users u ON w."userId" = u.id 
         WHERE u."referrerId" = $1) as total_referral_points,
        w."adPoints"
       FROM wallets w
       WHERE w."userId" = $1`,
      [userId]
    );

    const check = eligibilityCheck.rows[0];
    const referralCount = parseInt(check?.referral_count || 0);
    const totalReferralPoints = parseFloat(check?.total_referral_points || 0);
    const userAdPoints = parseFloat(check?.adPoints || 0);

    // Verify eligibility
    if (referralCount < 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'You must have at least 1 referrals to convert points' 
      }, { status: 403 });
    }

    if (totalReferralPoints < 2000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Your referrals must have collectively earned at least 2000 points' 
      }, { status: 403 });
    }

    // Check if user has enough points
    if (userAdPoints < pointsToConvert) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient points. You have ${userAdPoints} points but trying to convert ${pointsToConvert}` 
      }, { status: 400 });
    }

    // Start transaction
    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      const now = new Date();

      // Deduct ad points
      await client.query(
        `UPDATE wallets 
         SET "adPoints" = "adPoints" - $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [pointsToConvert, now, userId]
      );

      // Add USD balance
      await client.query(
        `UPDATE wallets 
         SET balance = balance + $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [usdAmount, now, userId]
      );

      // Create transaction record
      await databaseHelpers.transaction.createTransaction({
        userId,
        type: 'BUY', // Using BUY type as it's adding to USD balance
        amount: usdAmount,
        currency: 'USD',
        status: 'COMPLETED',
        gateway: 'Points_Converter',
        description: `Converted ${pointsToConvert} ad points to $${usdAmount.toFixed(2)} USD`,
        feeAmount: 0,
        netAmount: usdAmount
      });

      await client.query('COMMIT');

      console.log('✅ Points converted successfully');
      console.log('User:', userId);
      console.log('Points converted:', pointsToConvert);
      console.log('USD received:', usdAmount);

      return NextResponse.json({
        success: true,
        message: `Successfully converted ${pointsToConvert} points to $${usdAmount.toFixed(2)} USD!`,
        pointsConverted: pointsToConvert,
        usdReceived: usdAmount,
        remainingPoints: userAdPoints - pointsToConvert
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error converting points:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to convert points' 
    }, { status: 500 });
  }
}
