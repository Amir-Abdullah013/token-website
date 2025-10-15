import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

export async function GET(request) {
  try {
    console.log('🔄 Processing automatic staking completions...');
    
    // Get all active stakings that have reached their end date
    const completedStakings = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email, u."referrerId"
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s.status = 'ACTIVE' 
      AND s."endDate" <= NOW()
      ORDER BY s."endDate" ASC
    `);

    console.log(`📊 Found ${completedStakings.rows.length} stakings ready for completion`);

    const processedStakings = [];
    const errors = [];

    for (const staking of completedStakings.rows) {
      try {
        console.log(`🔄 Processing staking ${staking.id} for user ${staking.user_name}`);
        
        // Mark staking as completed
        await databaseHelpers.pool.query(`
          UPDATE staking 
          SET status = 'COMPLETED', "updatedAt" = NOW()
          WHERE id = $1
        `, [staking.id]);

        // Calculate reward amount
        const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
        const profit = rewardAmount;
        const totalAmount = staking.amountStaked + rewardAmount;

        // Get user's wallet
        const userWallet = await databaseHelpers.wallet.getWalletByUserId(staking.userId);
        if (!userWallet) {
          throw new Error(`Wallet not found for user ${staking.userId}`);
        }

        // Get token supply
        const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
        if (!tokenSupply) {
          throw new Error('Token supply not initialized');
        }

        // Calculate total tokens needed (profit + referral bonus if applicable)
        let totalTokensNeeded = profit;
        let referrerBonus = 0;
        
        if (staking.referrerId) {
          referrerBonus = (profit * 10) / 100; // 10% of staking profit
          totalTokensNeeded += referrerBonus;
        }

        // Check if sufficient tokens are available
        if (Number(tokenSupply.userSupplyRemaining) < totalTokensNeeded) {
          console.log(`⚠️ Insufficient user supply for staking ${staking.id}. Required: ${totalTokensNeeded}, Available: ${tokenSupply.userSupplyRemaining}. Admin needs to unlock tokens.`);
          // Mark as completed but don't process rewards yet
          await databaseHelpers.pool.query(`
            UPDATE staking 
            SET status = 'COMPLETED', "updatedAt" = NOW()
            WHERE id = $1
          `, [staking.id]);
          continue;
        }

        // Process the staking completion in a transaction
        let client;
        try {
          client = await databaseHelpers.pool.connect();
          await client.query('BEGIN');

          // Deduct tokens from supply
          await client.query(`
            UPDATE token_supply 
            SET "userSupplyRemaining" = "userSupplyRemaining" - $1, "updatedAt" = NOW()
            WHERE id = $2
          `, [totalTokensNeeded, tokenSupply.id]);

          // Add staked amount + reward back to user's wallet
          const newTikiBalance = userWallet.tikiBalance + totalAmount;
          await client.query(
            'UPDATE wallets SET "tikiBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
            [newTikiBalance, staking.userId]
          );

          // Process referral bonus if applicable
          if (staking.referrerId && referrerBonus > 0) {
            console.log(`🔗 Processing referral bonus for referrer ${staking.referrerId}`);
            
            // Get the referral record
            const referral = await client.query(
              'SELECT * FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2',
              [staking.referrerId, staking.userId]
            );

            if (referral.rows.length > 0) {
              const referralRecord = referral.rows[0];
              
              // Get referrer's wallet
              const referrerWalletResult = await client.query(
                'SELECT * FROM wallets WHERE "userId" = $1',
                [staking.referrerId]
              );
              
              if (referrerWalletResult.rows.length > 0) {
                const referrerWallet = referrerWalletResult.rows[0];
                const referrerNewBalance = referrerWallet.tikiBalance + referrerBonus;
                
                // Update referrer's wallet balance
                await client.query(
                  'UPDATE wallets SET "tikiBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
                  [referrerNewBalance, staking.referrerId]
                );
                
                // Create referral earning record
                await client.query(`
                  INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
                  VALUES ($1, $2, $3, $4, NOW())
                `, [require('crypto').randomUUID(), referralRecord.id, staking.id, referrerBonus]);
                
                // Send notification to referrer
                try {
                  await client.query(`
                    INSERT INTO notifications (id, "userId", title, message, type, status, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                  `, [
                    require('crypto').randomUUID(),
                    staking.referrerId,
                    'Referral Bonus Earned!',
                    `You earned ${referrerBonus.toFixed(2)} TIKI referral bonus from ${staking.user_name}'s staking profit!`,
                    'SUCCESS',
                    'UNREAD'
                  ]);
                } catch (notificationError) {
                  console.error('❌ Error sending referral notification:', notificationError);
                }
              }
            }
          }

          // Update staking record with profit and mark as claimed
          await client.query(`
            UPDATE staking 
            SET status = 'CLAIMED', claimed = true, profit = $1, "updatedAt" = NOW()
            WHERE id = $2
          `, [profit, staking.id]);

          await client.query('COMMIT');
          console.log(`✅ Staking ${staking.id} processed successfully`);

          // Create transaction record
          await databaseHelpers.transaction.createTransaction({
            userId: staking.userId,
            type: 'UNSTAKE',
            amount: totalAmount,
            currency: 'TIKI',
            status: 'COMPLETED',
            gateway: 'Staking',
            description: `Auto-claimed staking rewards: ${staking.amountStaked} TIKI + ${rewardAmount} TIKI reward`
          });

          // Send notification to user
          await databaseHelpers.notification.createNotification({
            userId: staking.userId,
            title: 'Staking Rewards Auto-Claimed',
            message: `Your staking has completed and rewards have been automatically claimed! Received ${totalAmount} TIKI (${staking.amountStaked} staked + ${rewardAmount} reward).`,
            type: 'STAKE'
          });

          processedStakings.push({
            id: staking.id,
            userId: staking.userId,
            userName: staking.user_name,
            amountStaked: staking.amountStaked,
            rewardAmount: rewardAmount,
            totalAmount: totalAmount,
            referrerBonus: referrerBonus
          });

        } catch (transactionError) {
          if (client) {
            await client.query('ROLLBACK');
          }
          throw transactionError;
        } finally {
          if (client) {
            client.release();
          }
        }

      } catch (error) {
        console.error(`❌ Error processing staking ${staking.id}:`, error);
        errors.push({
          stakingId: staking.id,
          userId: staking.userId,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedStakings.length} stakings automatically`,
      processed: processedStakings,
      errors: errors,
      totalFound: completedStakings.rows.length,
      totalProcessed: processedStakings.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('❌ Error in automatic staking processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process automatic stakings',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
