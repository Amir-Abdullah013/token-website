/**
 * Token Supply Data Migration Script
 * 
 * This script fixes the token supply data to ensure consistency between:
 * - totalSupply (total tokens in existence)
 * - distributedSupply (actual tokens in user wallets)
 * - remainingSupply (totalSupply - distributedSupply)
 * - userSupplyRemaining (user allocation tracking)
 * - adminReserve (admin locked tokens)
 */

const { databaseHelpers } = require('./src/lib/database.js');

async function fixTokenSupply() {
  console.log('='.repeat(60));
  console.log('🔧 TOKEN SUPPLY DATA MIGRATION');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Get current supply state
    console.log('Step 1: Analyzing current supply state...');
    const currentSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!currentSupply) {
      console.error('❌ Error: Token supply record not found!');
      process.exit(1);
    }

    console.log('Current Supply Record:');
    console.log('  - Total Supply:', Number(currentSupply.totalSupply).toLocaleString());
    console.log('  - Remaining Supply:', Number(currentSupply.remainingSupply).toLocaleString());
    console.log('  - User Supply Remaining:', Number(currentSupply.userSupplyRemaining).toLocaleString());
    console.log('  - Admin Reserve:', Number(currentSupply.adminReserve).toLocaleString());
    console.log('');

    // Step 2: Calculate actual distributed supply
    console.log('Step 2: Calculating actual distributed supply...');
    const distributedSupply = await databaseHelpers.tokenSupply.calculateDistributedSupply();
    console.log('  - Distributed to Users:', distributedSupply.toLocaleString(), 'Von');
    console.log('');

    // Step 3: Calculate correct values
    console.log('Step 3: Calculating correct values...');
    const totalSupply = Number(currentSupply.totalSupply);
    const correctRemainingSupply = totalSupply - distributedSupply;
    const userSupplyRemaining = Number(currentSupply.userSupplyRemaining);
    const adminReserve = Number(currentSupply.adminReserve);
    
    // Calculate what should be tracked
    const totalUserSupply = 10000000; // 20% allocation
    const usedUserSupply = totalUserSupply - userSupplyRemaining;
    const discrepancy = distributedSupply - usedUserSupply;

    console.log('Correct Values:');
    console.log('  - Total Supply:', totalSupply.toLocaleString());
    console.log('  - Distributed Supply:', distributedSupply.toLocaleString());
    console.log('  - Correct Remaining Supply:', correctRemainingSupply.toLocaleString());
    console.log('');

    console.log('Allocation Tracking:');
    console.log('  - User Supply Allocation:', totalUserSupply.toLocaleString());
    console.log('  - Used from User Supply:', usedUserSupply.toLocaleString());
    console.log('  - User Supply Remaining:', userSupplyRemaining.toLocaleString());
    console.log('  - Admin Reserve:', adminReserve.toLocaleString());
    console.log('');

    // Step 4: Check for discrepancies
    console.log('Step 4: Checking for discrepancies...');
    const remainingDiscrepancy = Number(currentSupply.remainingSupply) - correctRemainingSupply;
    
    if (Math.abs(remainingDiscrepancy) < 1) {
      console.log('✅ No discrepancy found! Supply is already correct.');
    } else {
      console.log('⚠️  Discrepancy Found:');
      console.log('  - Current Remaining Supply:', Number(currentSupply.remainingSupply).toLocaleString());
      console.log('  - Correct Remaining Supply:', correctRemainingSupply.toLocaleString());
      console.log('  - Difference:', remainingDiscrepancy.toLocaleString());
      console.log('');

      if (discrepancy > 0) {
        console.log('⚠️  Distribution Discrepancy:');
        console.log(`  - ${discrepancy.toLocaleString()} Von distributed beyond user supply tracking`);
        console.log('  - This likely came from admin operations or direct wallet updates');
        console.log('');
      }
    }

    // Step 5: Apply fix
    console.log('Step 5: Applying fix...');
    console.log('Do you want to update the remainingSupply? (yes/no)');
    console.log('This will update remainingSupply to:', correctRemainingSupply.toLocaleString());
    console.log('');

    // Auto-apply fix (remove readline for automation)
    console.log('Auto-applying fix...');
    
    const updatedSupply = await databaseHelpers.tokenSupply.syncRemainingSupply();
    
    console.log('✅ Supply updated successfully!');
    console.log('New values:');
    console.log('  - Total Supply:', Number(updatedSupply.totalSupply).toLocaleString());
    console.log('  - Remaining Supply:', Number(updatedSupply.remainingSupply).toLocaleString());
    console.log('  - User Supply Remaining:', Number(updatedSupply.userSupplyRemaining).toLocaleString());
    console.log('  - Admin Reserve:', Number(updatedSupply.adminReserve).toLocaleString());
    console.log('  - Distributed Supply:', distributedSupply.toLocaleString());
    console.log('');

    // Step 6: Validate the fix
    console.log('Step 6: Validating the fix...');
    const validation = await databaseHelpers.tokenSupply.validateSupply();
    
    console.log('Validation Results:');
    console.log('  - Total Supply:', validation.totalSupply.toLocaleString());
    console.log('  - Distributed Supply:', validation.distributedSupply.toLocaleString());
    console.log('  - Remaining Supply:', validation.remainingSupply.toLocaleString());
    console.log('  - Expected Remaining:', validation.expectedRemaining.toLocaleString());
    console.log('  - Discrepancy:', validation.discrepancy.toLocaleString());
    console.log('  - Valid:', validation.isValid ? '✅ YES' : '❌ NO');
    console.log('');

    // Step 7: Show summary
    console.log('='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Supply:         ${validation.totalSupply.toLocaleString()} Von`);
    console.log(`Distributed Supply:   ${validation.distributedSupply.toLocaleString()} Von`);
    console.log(`Remaining Supply:     ${validation.remainingSupply.toLocaleString()} Von`);
    console.log(`User Supply Remaining: ${validation.userSupplyRemaining.toLocaleString()} Von`);
    console.log(`Admin Reserve:        ${validation.adminReserve.toLocaleString()} Von`);
    console.log('');
    console.log(`Status: ${validation.isValid ? '✅ VALID' : '⚠️ NEEDS ATTENTION'}`);
    console.log('='.repeat(60));
    console.log('');

    if (discrepancy > 0) {
      console.log('⚠️  NOTE: There is still a discrepancy in distribution tracking:');
      console.log(`   ${discrepancy.toLocaleString()} Von were distributed outside the user supply system.`);
      console.log('   This is tracked correctly now, but allocation percentages may be off.');
      console.log('   Consider investigating where these tokens came from.');
      console.log('');
    }

    await databaseHelpers.pool.end();
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    await databaseHelpers.pool.end();
    process.exit(1);
  }
}

// Run the migratio
fixTokenSupply();

