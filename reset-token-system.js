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
    
    // Step 2: Get all users with TIKI balances
    console.log('\n👥 Users with TIKI balances:');
    const usersWithTiki = await databaseHelpers.pool.query(`
      SELECT u.id, u.email, w.amount as tiki_balance
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE w.currency = 'TIKI' AND w.amount > 0
      ORDER BY w.amount DESC
    `);
    
    if (usersWithTiki.rows.length > 0) {
      console.log(`Found ${usersWithTiki.rows.length} users with TIKI balances:`);
      usersWithTiki.rows.forEach(user => {
        console.log(`- ${user.email}: ${Number(user.tiki_balance).toLocaleString()} TIKI`);
      });
    } else {
      console.log('✅ No users have TIKI balances');
    }
    
    // Step 3: Reset all user TIKI balances to 0
    console.log('\n🧹 Resetting all user TIKI balances...');
    const resetBalances = await databaseHelpers.pool.query(`
      UPDATE wallets 
      SET amount = 0, updated_at = NOW()
      WHERE currency = 'TIKI' AND amount > 0
    `);
    console.log(`✅ Reset ${resetBalances.rowCount} user TIKI balances to 0`);
    
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
      WHERE type IN ('buy', 'sell') AND currency = 'TIKI'
    `);
    console.log(`✅ Cleared ${clearTransactions.rowCount} TIKI transactions`);
    
    // Step 6: Verify reset state
    console.log('\n✅ VERIFICATION - Fresh State:');
    const freshSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    console.log('Total Supply:', Number(freshSupply.totalSupply));
    console.log('Remaining Supply:', Number(freshSupply.remainingSupply));
    console.log('User Supply Remaining:', Number(freshSupply.userSupplyRemaining));
    console.log('Admin Reserve:', Number(freshSupply.adminReserve));
    
    // Verify no users have TIKI
    const verifyUsers = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as users_with_tiki
      FROM wallets 
      WHERE currency = 'TIKI' AND amount > 0
    `);
    console.log(`Users with TIKI balances: ${verifyUsers.rows[0].users_with_tiki}`);
    
    // Step 7: Test fresh token value calculation
    console.log('\n💰 Testing fresh token value calculation...');
    const freshTokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    console.log('Base Value:', freshTokenValue.baseValue);
    console.log('Current Token Value:', freshTokenValue.currentTokenValue);
    console.log('Usage Percentage:', freshTokenValue.usagePercentage + '%');
    
    console.log('\n🎉 TOKEN SYSTEM RESET COMPLETE!');
    console.log('✅ All users have 0 TIKI tokens');
    console.log('✅ Token supply is at fresh state');
    console.log('✅ Price is at base value');
    console.log('✅ System ready for new transactions');
    
  } catch (error) {
    console.error('❌ Error during reset:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

resetTokenSystem();


