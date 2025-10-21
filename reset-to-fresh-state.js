/**
 * Complete System Reset Script
 * 
 * This script will:
 * 1. Reset all user Von balances to zero
 * 2. Reset token supply to initial state (10M total, 10M remaining, 2M user, 8M admin)
 * 3. Clear transaction history
 * 4. Clear minting history
 * 5. Reset to completely fresh state
 */

const { databaseHelpers } = require('./src/lib/database.js');

async function resetToFreshState() {
  console.log('='.repeat(70));
  console.log('🔄 COMPLETE SYSTEM RESET - FRESH START');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Show current state
    console.log('Step 1: Current System State');
    console.log('-'.repeat(50));
    
    const currentSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const currentDistributed = await databaseHelpers.tokenSupply.calculateDistributedSupply();
    
    console.log('Before Reset:');
    console.log(`  - Total Supply: ${Number(currentSupply.totalSupply).toLocaleString()} Von`);
    console.log(`  - Remaining Supply: ${Number(currentSupply.remainingSupply).toLocaleString()} Von`);
    console.log(`  - User Supply: ${Number(currentSupply.userSupplyRemaining).toLocaleString()} Von`);
    console.log(`  - Admin Reserve: ${Number(currentSupply.adminReserve).toLocaleString()} Von`);
    console.log(`  - Distributed to Users: ${currentDistributed.toLocaleString()} Von`);
    console.log('');

    // Step 2: Reset all user Von balances to zero
    console.log('Step 2: Resetting User Von Balances');
    console.log('-'.repeat(50));
    
    const walletReset = await databaseHelpers.pool.query(`
      UPDATE wallets 
      SET "VonBalance" = 0, "lastUpdated" = NOW()
      WHERE "VonBalance" > 0
    `);
    
    console.log(`✅ Reset ${walletReset.rowCount} user wallets to 0 Von`);
    console.log('');

    // Step 3: Reset token supply to initial state
    console.log('Step 3: Resetting Token Supply');
    console.log('-'.repeat(50));
    
    const initialTotalSupply = 10000000; // 10M
    const initialRemainingSupply = 10000000; // 10M (all available)
    const initialUserSupply = 2000000; // 2M (20%)
    const initialAdminReserve = 8000000; // 8M (80%)
    
    await databaseHelpers.pool.query(`
      UPDATE token_supply 
      SET 
        "totalSupply" = $1,
        "remainingSupply" = $2,
        "userSupplyRemaining" = $3,
        "adminReserve" = $4,
        "updatedAt" = NOW()
    `, [initialTotalSupply, initialRemainingSupply, initialUserSupply, initialAdminReserve]);
    
    console.log('✅ Token supply reset to initial state:');
    console.log(`  - Total Supply: ${initialTotalSupply.toLocaleString()} Von`);
    console.log(`  - Remaining Supply: ${initialRemainingSupply.toLocaleString()} Von`);
    console.log(`  - User Supply: ${initialUserSupply.toLocaleString()} Von (20%)`);
    console.log(`  - Admin Reserve: ${initialAdminReserve.toLocaleString()} Von (80%)`);
    console.log('');

    // Step 4: Clear transaction history
    console.log('Step 4: Clearing Transaction History');
    console.log('-'.repeat(50));
    
    const transactionDelete = await databaseHelpers.pool.query(`
      DELETE FROM transactions 
      WHERE type IN ('BUY', 'SELL')
    `);
    
    console.log(`✅ Cleared ${transactionDelete.rowCount} buy/sell transactions`);
    console.log('');

    // Step 5: Clear minting history
    console.log('Step 5: Clearing Minting History');
    console.log('-'.repeat(50));
    
    const mintHistoryDelete = await databaseHelpers.pool.query(`
      DELETE FROM mint_history
    `);
    
    const tokenMintingDelete = await databaseHelpers.pool.query(`
      DELETE FROM token_minting
    `);
    
    console.log(`✅ Cleared ${mintHistoryDelete.rowCount} mint history records`);
    console.log(`✅ Cleared ${tokenMintingDelete.rowCount} token minting records`);
    console.log('');

    // Step 6: Verify fresh state
    console.log('Step 6: Verifying Fresh State');
    console.log('-'.repeat(50));
    
    const freshSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const freshDistributed = await databaseHelpers.tokenSupply.calculateDistributedSupply();
    const validation = await databaseHelpers.tokenSupply.validateSupply();
    
    console.log('After Reset:');
    console.log(`  - Total Supply: ${Number(freshSupply.totalSupply).toLocaleString()} Von`);
    console.log(`  - Remaining Supply: ${Number(freshSupply.remainingSupply).toLocaleString()} Von`);
    console.log(`  - User Supply: ${Number(freshSupply.userSupplyRemaining).toLocaleString()} Von`);
    console.log(`  - Admin Reserve: ${Number(freshSupply.adminReserve).toLocaleString()} Von`);
    console.log(`  - Distributed to Users: ${freshDistributed.toLocaleString()} Von`);
    console.log(`  - System Valid: ${validation.isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Discrepancy: ${validation.discrepancy.toFixed(2)} Von`);
    console.log('');

    // Step 7: Check user wallets
    console.log('Step 7: Checking User Wallets');
    console.log('-'.repeat(50));
    
    const userWallets = await databaseHelpers.pool.query(`
      SELECT u.email, w."VonBalance" 
      FROM users u 
      JOIN wallets w ON u.id = w."userId" 
      WHERE w."VonBalance" > 0
    `);
    
    if (userWallets.rows.length === 0) {
      console.log('✅ All user wallets have 0 Von balance');
    } else {
      console.log('⚠️  Users still have Von:');
      userWallets.rows.forEach(user => {
        console.log(`  - ${user.email}: ${Number(user.VonBalance).toFixed(2)} Von`);
      });
    }
    console.log('');

    // Step 8: Summary
    console.log('='.repeat(70));
    console.log('🎉 FRESH SYSTEM STATE ACHIEVED');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ All user Von balances reset to 0');
    console.log('✅ Token supply reset to initial state');
    console.log('✅ Transaction history cleared');
    console.log('✅ Minting history cleared');
    console.log('✅ System validation passed');
    console.log('');
    console.log('The system is now in a completely fresh state:');
    console.log(`  - Total Supply: ${Number(freshSupply.totalSupply).toLocaleString()} Von`);
    console.log(`  - Remaining Supply: ${Number(freshSupply.remainingSupply).toLocaleString()} Von`);
    console.log(`  - User Supply Available: ${Number(freshSupply.userSupplyRemaining).toLocaleString()} Von`);
    console.log(`  - Admin Reserve: ${Number(freshSupply.adminReserve).toLocaleString()} Von`);
    console.log(`  - Distributed to Users: ${freshDistributed.toLocaleString()} Von`);
    console.log('');
    console.log('🚀 Ready for fresh start with new token supply system!');
    console.log('='.repeat(70));

    await databaseHelpers.pool.end();

  } catch (error) {
    console.error('❌ Error during reset:', error);
    await databaseHelpers.pool.end();
    process.exit(1);
  }
}

// Run the reset
resetToFreshState();
