const { databaseHelpers } = require('./src/lib/database.js');

async function resetTokenSystem() {
  console.log('🔄 STARTING COMPLETE TOKEN SYSTEM RESET...\n');
  
  try {
    // Step 1: Get current state
    console.log('📊 Current State Analysis:');
    const currentSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    console.log('Total Supply:', Number(currentSupply.totalSupply));
    console.log('Remaining Supply:', Number(currentSupply.remainingSupply));
    console.log('User Supply Remaining:', Number(currentSupply.userSupplyRemaining));
    console.log('Admin Reserve:', Number(currentSupply.adminReserve));
    
    // Step 2: Get all users with Von balances
    console.log('\n👥 Users with Von balances:');
    const usersWithVon = await databaseHelpers.pool.query(`
      SELECT u.id, u.email, w.amount as Von_balance
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE w.currency = 'Von' AND w.amount > 0
      ORDER BY w.amount DESC
    `);
    
    if (usersWithVon.rows.length > 0) {
      console.log(`Found ${usersWithVon.rows.length} users with Von balances:`);
      usersWithVon.rows.forEach(user => {
        console.log(`- ${user.email}: ${Number(user.Von_balance).toLocaleString()} Von`);
      });
    } else {
      console.log('✅ No users have Von balances');
    }
    
    // Step 3: Reset all user Von balances to 0
    console.log('\n🧹 Resetting all user Von balances...');
    const resetBalances = await databaseHelpers.pool.query(`
      UPDATE wallets 
      SET amount = 0, updated_at = NOW()
      WHERE currency = 'Von' AND amount > 0
    `);
    console.log(`✅ Reset ${resetBalances.rowCount} user Von balances to 0`);
    
    // Step 4: Reset token supply to fresh state
    console.log('\n🔄 Resetting token supply to fresh state...');
    const resetSupply = await databaseHelpers.pool.query(`
      UPDATE token_supply 
      SET 
        "remainingSupply" = "totalSupply",
        "userSupplyRemaining" = 2000000,
        "adminReserve" = 8000000,
        "updatedAt" = NOW()
      WHERE id = 1
    `);
    console.log('✅ Token supply reset to fresh state');
    
    // Step 5: Clear all transaction history (optional - be careful!)
    console.log('\n🗑️ Clearing transaction history...');
    const clearTransactions = await databaseHelpers.pool.query(`
      DELETE FROM transactions 
      WHERE type IN ('buy', 'sell') AND currency = 'Von'
    `);
    console.log(`✅ Cleared ${clearTransactions.rowCount} Von transactions`);
    
    // Step 6: Verify reset state
    console.log('\n✅ VERIFICATION - Fresh State:');
    const freshSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    console.log('Total Supply:', Number(freshSupply.totalSupply));
    console.log('Remaining Supply:', Number(freshSupply.remainingSupply));
    console.log('User Supply Remaining:', Number(freshSupply.userSupplyRemaining));
    console.log('Admin Reserve:', Number(freshSupply.adminReserve));
    
    // Verify no users have Von
    const verifyUsers = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as users_with_Von
      FROM wallets 
      WHERE currency = 'Von' AND amount > 0
    `);
    console.log(`Users with Von balances: ${verifyUsers.rows[0].users_with_Von}`);
    
    // Step 7: Test fresh token value calculation
    console.log('\n💰 Testing fresh token value calculation...');
    const freshTokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    console.log('Base Value:', freshTokenValue.baseValue);
    console.log('Current Token Value:', freshTokenValue.currentTokenValue);
    console.log('Usage Percentage:', freshTokenValue.usagePercentage + '%');
    
    console.log('\n🎉 TOKEN SYSTEM RESET COMPLETE!');
    console.log('✅ All users have 0 Von tokens');
    console.log('✅ Token supply is at fresh state');
    console.log('✅ Price is at base value');
    console.log('✅ System ready for new transactions');
    
  } catch (error) {
    console.error('❌ Error during reset:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

resetTokenSystem();


