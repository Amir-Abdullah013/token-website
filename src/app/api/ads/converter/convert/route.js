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
        u.id,
        COALESCE(w."adPoints", w."lockedAdPoints", 0) as ad_points,
        w."adPoints" as user_ad_points
       FROM users u
       LEFT JOIN wallets w ON w."userId" = u.id
       WHERE u."referrerId" = $1`,
      [userId]
    );

    const referralRows = eligibilityCheck.rows;
    const referralCount = referralRows.length;
    const qualifiedReferrals = referralRows.filter(r => parseFloat(r.ad_points || 0) >= 2000);
    const qualifiedCount = qualifiedReferrals.length;

    // Get user's own ad points
    const userWalletResult = await databaseHelpers.pool.query(
      `SELECT COALESCE("adPoints", 0) as "adPoints" FROM wallets WHERE "userId" = $1`,
      [userId]
    );
    const check = userWalletResult.rows[0];
    const userAdPoints = parseFloat(check?.adPoints || 0);

    // Verify eligibility: need 5 referrals that EACH have >= 2000 points
    if (referralCount < 1) {
      return NextResponse.json({ 
        success: false, 
        error: 'You must have at least 1 referral to convert points' 
      }, { status: 403 });
    }

    if (qualifiedCount < 5) {
      return NextResponse.json({ 
        success: false, 
        error: `You need 5 referrals with 2000+ points each. Currently ${qualifiedCount}/5 qualify.` 
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
