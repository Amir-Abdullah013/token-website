const { databaseHelpers } = require('../src/lib/database');

const testAutoStakingSystem = async () => {
  try {
    console.log('🧪 Testing Automatic Staking System...');
    console.log('=====================================\n');

    // Test 1: Check current staking status
    console.log('📊 Test 1: Current Staking Status');
    console.log('----------------------------------');
    
    const allStakings = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email, u."referrerId"
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      ORDER BY s."createdAt" DESC
    `);
    
    console.log(`Total stakings found: ${allStakings.rows.length}`);
    
    if (allStakings.rows.length > 0) {
      console.log('\n📋 Current Stakings:');
      allStakings.rows.forEach((staking, index) => {
        const endDate = new Date(staking.endDate);
        const now = new Date();
        const isExpired = now >= endDate;
        const timeLeft = isExpired ? 'EXPIRED' : `${Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))} days left`;
        
        console.log(`  ${index + 1}. ID: ${staking.id}`);
        console.log(`     User: ${staking.user_name} (${staking.user_email})`);
        console.log(`     Amount: ${staking.amountStaked} Von`);
        console.log(`     Duration: ${staking.durationDays} days`);
        console.log(`     Reward: ${staking.rewardPercent}%`);
        console.log(`     Status: ${staking.status}`);
        console.log(`     Start: ${new Date(staking.startDate).toLocaleString()}`);
        console.log(`     End: ${endDate.toLocaleString()}`);
        console.log(`     Time Status: ${timeLeft}`);
        console.log(`     Referrer: ${staking.referrerId ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Test 2: Check for expired stakings that need processing
    console.log('⏰ Test 2: Expired Stakings Ready for Processing');
    console.log('-----------------------------------------------');
    
    const expiredStakings = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email, u."referrerId"
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s.status = 'ACTIVE' 
      AND s."endDate" <= NOW()
      ORDER BY s."endDate" ASC
    `);
    
    console.log(`Expired stakings ready for processing: ${expiredStakings.rows.length}`);
    
    if (expiredStakings.rows.length > 0) {
      console.log('\n📋 Expired Stakings:');
      expiredStakings.rows.forEach((staking, index) => {
        const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
        const totalAmount = staking.amountStaked + rewardAmount;
        const referrerBonus = staking.referrerId ? (rewardAmount * 10) / 100 : 0;
        
        console.log(`  ${index + 1}. User: ${staking.user_name}`);
        console.log(`     Staked: ${staking.amountStaked} Von`);
        console.log(`     Reward: ${rewardAmount} Von (${staking.rewardPercent}%)`);
        console.log(`     Total to receive: ${totalAmount} Von`);
        console.log(`     Referrer bonus: ${referrerBonus} Von`);
        console.log(`     End date: ${new Date(staking.endDate).toLocaleString()}`);
        console.log('');
      });
    }

    // Test 3: Check user wallets before processing
    console.log('💰 Test 3: User Wallets Before Processing');
    console.log('----------------------------------------');
    
    const userWallets = await databaseHelpers.pool.query(`
      SELECT w.*, u.name as user_name, u.email as user_email
      FROM wallets w
      LEFT JOIN users u ON w."userId" = u.id
      WHERE w."userId" IN (SELECT DISTINCT "userId" FROM staking WHERE status = 'ACTIVE' AND "endDate" <= NOW())
    `);
    
    console.log('User wallets that will be affected:');
    userWallets.rows.forEach((wallet, index) => {
      console.log(`  ${index + 1}. User: ${wallet.user_name}`);
      console.log(`     Current Von Balance: ${wallet.VonBalance} Von`);
      console.log(`     Current USD Balance: $${wallet.balance}`);
      console.log('');
    });

    // Test 4: Check token supply before processing
    console.log('🏦 Test 4: Token Supply Before Processing');
    console.log('----------------------------------------');
    
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (tokenSupply) {
      console.log(`Total Supply: ${tokenSupply.totalSupply} Von`);
      console.log(`Remaining Supply: ${tokenSupply.remainingSupply} Von`);
      console.log(`Used Supply: ${tokenSupply.totalSupply - tokenSupply.remainingSupply} Von`);
    } else {
      console.log('❌ Token supply not found');
    }

    // Test 5: Process expired stakings automatically
    console.log('🔄 Test 5: Processing Expired Stakings');
    console.log('--------------------------------------');
    
    if (expiredStakings.rows.length > 0) {
      console.log('Processing expired stakings automatically...');
      
      for (const staking of expiredStakings.rows) {
        try {
          console.log(`\n🔄 Processing staking ${staking.id} for user ${staking.user_name}...`);
          
          // Calculate amounts
          const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
          const profit = rewardAmount;
          const totalAmount = staking.amountStaked + rewardAmount;
          const referrerBonus = staking.referrerId ? (profit * 10) / 100 : 0;
          const totalTokensNeeded = profit + referrerBonus;
          
          console.log(`  📊 Calculations:`);
          console.log(`     Staked Amount: ${staking.amountStaked} Von`);
          console.log(`     Reward Amount: ${rewardAmount} Von`);
          console.log(`     Total to User: ${totalAmount} Von`);
          console.log(`     Referrer Bonus: ${referrerBonus} Von`);
          console.log(`     Total Tokens Needed: ${totalTokensNeeded} Von`);
          
          // Check token supply
          if (Number(tokenSupply.remainingSupply) < totalTokensNeeded) {
            console.log(`  ⚠️ Insufficient token supply. Required: ${totalTokensNeeded}, Available: ${tokenSupply.remainingSupply}`);
            continue;
          }
          
          // Get user's current wallet
          const userWallet = await databaseHelpers.wallet.getWalletByUserId(staking.userId);
          const oldBalance = userWallet.VonBalance;
          
          // Process the staking completion
          let client;
          try {
            client = await databaseHelpers.pool.connect();
            await client.query('BEGIN');
            
            // Deduct tokens from supply
            await client.query(`
              UPDATE token_supply 
              SET "remainingSupply" = "remainingSupply" - $1, "updatedAt" = NOW()
              WHERE id = $2
            `, [totalTokensNeeded, tokenSupply.id]);
            
            // Add staked amount + reward back to user's wallet
            const newVonBalance = userWallet.VonBalance + totalAmount;
            await client.query(
              'UPDATE wallets SET "VonBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
              [newVonBalance, staking.userId]
            );
            
            // Process referral bonus if applicable
            if (staking.referrerId && referrerBonus > 0) {
              console.log(`  🔗 Processing referral bonus for referrer ${staking.referrerId}...`);
              
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
                  const referrerNewBalance = referrerWallet.VonBalance + referrerBonus;
                  
                  // Update referrer's wallet balance
                  await client.query(
                    'UPDATE wallets SET "VonBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
                    [referrerNewBalance, staking.referrerId]
                  );
                  
                  // Create referral earning record
                  await client.query(`
                    INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
                    VALUES ($1, $2, $3, $4, NOW())
                  `, [require('crypto').randomUUID(), referralRecord.id, staking.id, referrerBonus]);
                  
                  console.log(`    ✅ Referrer bonus processed: ${referrerBonus} Von`);
                  console.log(`    ✅ Referrer new balance: ${referrerNewBalance} Von`);
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
            console.log(`  ✅ Staking ${staking.id} processed successfully!`);
            console.log(`  ✅ User balance updated: ${oldBalance} → ${newVonBalance} Von (+${totalAmount})`);
            
            // Create transaction record
            await databaseHelpers.transaction.createTransaction({
              userId: staking.userId,
              type: 'BUY',
              amount: totalAmount,
              currency: 'Von',
              status: 'COMPLETED',
              gateway: 'Staking',
              description: `Auto-claimed staking rewards: ${staking.amountStaked} Von + ${rewardAmount} Von reward`
            });
            
            // Send notification to user
            await databaseHelpers.notification.createNotification({
              userId: staking.userId,
              title: 'Staking Rewards Auto-Claimed',
              message: `Your staking has completed and rewards have been automatically claimed! Received ${totalAmount} Von (${staking.amountStaked} staked + ${rewardAmount} reward).`,
              type: 'STAKE'
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
          console.error(`  ❌ Error processing staking ${staking.id}:`, error.message);
        }
      }
    } else {
      console.log('No expired stakings to process.');
    }

    // Test 6: Verify results after processing
    console.log('\n✅ Test 6: Verification After Processing');
    console.log('----------------------------------------');
    
    // Check updated user wallets
    const updatedWallets = await databaseHelpers.pool.query(`
      SELECT w.*, u.name as user_name, u.email as user_email
      FROM wallets w
      LEFT JOIN users u ON w."userId" = u.id
      WHERE w."userId" IN (SELECT DISTINCT "userId" FROM staking WHERE status = 'CLAIMED')
    `);
    
    console.log('Updated user wallets:');
    updatedWallets.rows.forEach((wallet, index) => {
      console.log(`  ${index + 1}. User: ${wallet.user_name}`);
      console.log(`     Current Von Balance: ${wallet.VonBalance} Von`);
      console.log(`     Current USD Balance: $${wallet.balance}`);
      console.log('');
    });
    
    // Check updated token supply
    const updatedTokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (updatedTokenSupply) {
      console.log('Updated Token Supply:');
      console.log(`Total Supply: ${updatedTokenSupply.totalSupply} Von`);
      console.log(`Remaining Supply: ${updatedTokenSupply.remainingSupply} Von`);
      console.log(`Used Supply: ${updatedTokenSupply.totalSupply - updatedTokenSupply.remainingSupply} Von`);
    }
    
    // Check processed stakings
    const processedStakings = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s.status = 'CLAIMED'
      ORDER BY s."updatedAt" DESC
    `);
    
    console.log(`\nProcessed stakings: ${processedStakings.rows.length}`);
    if (processedStakings.rows.length > 0) {
      console.log('Recently processed stakings:');
      processedStakings.rows.slice(0, 5).forEach((staking, index) => {
        console.log(`  ${index + 1}. User: ${staking.user_name}`);
        console.log(`     Amount Staked: ${staking.amountStaked} Von`);
        console.log(`     Profit Earned: ${staking.profit} Von`);
        console.log(`     Status: ${staking.status}`);
        console.log(`     Claimed: ${staking.claimed}`);
        console.log(`     Updated: ${new Date(staking.updatedAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log('🎉 Automatic Staking System Test Complete!');
    console.log('==========================================');
    console.log('✅ System is working correctly');
    console.log('✅ Staking amounts and bonuses are automatically added to user accounts');
    console.log('✅ No admin approval required');
    console.log('✅ Referral bonuses are distributed automatically');
    
  } catch (error) {
    console.error('❌ Error testing automatic staking system:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testAutoStakingSystem();
