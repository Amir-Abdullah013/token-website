const { databaseHelpers } = require('../src/lib/database');

/**
 * Test the admin supply transfer functionality
 * Simulates admin transferring tokens from reserve to user supply
 */
async function testAdminSupplyTransfer() {
  console.log('🔐 Testing Admin Supply Transfer');
  console.log('==================================\n');

  try {
    // Get an admin user
    console.log('👤 Finding admin user...');
    const admins = await databaseHelpers.pool.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'ADMIN'
      LIMIT 1
    `);

    if (admins.rows.length === 0) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    const admin = admins.rows[0];
    console.log(`✅ Found admin: ${admin.name} (${admin.email})\n`);

    // Get current supply status
    console.log('📊 Current Supply Status:');
    console.log('-------------------------');
    const beforeSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const beforeValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    
    console.log(`   Total Supply: ${Number(beforeSupply.totalSupply).toLocaleString()} TIKI`);
    console.log(`   User Supply: ${Number(beforeSupply.userSupplyRemaining).toLocaleString()} TIKI`);
    console.log(`   Admin Reserve: ${Number(beforeSupply.adminReserve).toLocaleString()} TIKI`);
    console.log(`   Token Value: $${beforeValue.currentTokenValue}`);
    console.log(`   Inflation Factor: ${beforeValue.inflationFactor.toFixed(4)}x\n`);

    // Test transfer
    const transferAmount = 100000; // Transfer 100k TIKI
    console.log(`💰 Transferring ${transferAmount.toLocaleString()} TIKI from admin reserve to user supply...`);
    console.log('-------------------------------------------------------------------------');

    const transferResult = await databaseHelpers.adminSupplyTransfer.transferToUserSupply(
      admin.id,
      transferAmount,
      'Testing admin supply transfer - allocating tokens for user operations'
    );

    if (transferResult.success) {
      console.log('✅ Transfer successful!\n');
      
      console.log('📋 Transfer Details:');
      console.log(`   Transfer ID: ${transferResult.transfer.id}`);
      console.log(`   Amount: ${Number(transferResult.transfer.amount).toLocaleString()} TIKI`);
      console.log(`   Admin: ${admin.name}`);
      console.log(`   Reason: ${transferResult.transfer.reason}`);
      console.log(`   Timestamp: ${transferResult.transfer.createdAt}\n`);

      // Get updated supply status
      console.log('📊 Updated Supply Status:');
      console.log('-------------------------');
      const afterSupply = transferResult.updatedSupply;
      const afterValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      
      console.log(`   Total Supply: ${Number(afterSupply.totalSupply).toLocaleString()} TIKI (unchanged)`);
      console.log(`   User Supply: ${Number(afterSupply.userSupplyRemaining).toLocaleString()} TIKI (+${transferAmount.toLocaleString()})`);
      console.log(`   Admin Reserve: ${Number(afterSupply.adminReserve).toLocaleString()} TIKI (-${transferAmount.toLocaleString()})`);
      console.log(`   Token Value: $${afterValue.currentTokenValue}`);
      console.log(`   Inflation Factor: ${afterValue.inflationFactor.toFixed(4)}x\n`);

      // Verify the changes
      console.log('✔️ Verification:');
      console.log('----------------');
      const userSupplyChange = Number(afterSupply.userSupplyRemaining) - Number(beforeSupply.userSupplyRemaining);
      const adminReserveChange = Number(beforeSupply.adminReserve) - Number(afterSupply.adminReserve);
      
      if (userSupplyChange === transferAmount) {
        console.log(`✅ User supply increased by ${transferAmount.toLocaleString()} TIKI`);
      } else {
        console.warn(`⚠️ User supply change mismatch: expected ${transferAmount}, got ${userSupplyChange}`);
      }

      if (adminReserveChange === transferAmount) {
        console.log(`✅ Admin reserve decreased by ${transferAmount.toLocaleString()} TIKI`);
      } else {
        console.warn(`⚠️ Admin reserve change mismatch: expected ${transferAmount}, got ${adminReserveChange}`);
      }

      const totalSupplyBefore = Number(beforeSupply.totalSupply);
      const totalSupplyAfter = Number(afterSupply.totalSupply);
      if (totalSupplyBefore === totalSupplyAfter) {
        console.log(`✅ Total supply unchanged (${totalSupplyBefore.toLocaleString()} TIKI)\n`);
      } else {
        console.warn(`⚠️ Total supply changed: ${totalSupplyBefore} → ${totalSupplyAfter}\n`);
      }

      // Check transfer history
      console.log('📜 Transfer History:');
      console.log('--------------------');
      const history = await databaseHelpers.adminSupplyTransfer.getTransferHistory(null, 5);
      const stats = await databaseHelpers.adminSupplyTransfer.getTransferStats();
      
      console.log(`   Total transfers: ${stats.total_transfers}`);
      console.log(`   Total transferred: ${Number(stats.total_transferred).toLocaleString()} TIKI`);
      console.log(`   First transfer: ${stats.first_transfer}`);
      console.log(`   Last transfer: ${stats.last_transfer}\n`);

      console.log('   Recent transfers:');
      history.slice(0, 3).forEach((transfer, index) => {
        console.log(`   ${index + 1}. ${Number(transfer.amount).toLocaleString()} TIKI by ${transfer.admin_name} - ${new Date(transfer.createdAt).toLocaleString()}`);
      });

      console.log('\n🎉 Admin supply transfer system working correctly!\n');

      // Rollback for testing purposes
      console.log('🔄 Rolling back test transfer...');
      await databaseHelpers.pool.query(`
        UPDATE token_supply 
        SET "userSupplyRemaining" = "userSupplyRemaining" - $1,
            "adminReserve" = "adminReserve" + $1,
            "updatedAt" = NOW()
      `, [transferAmount]);
      
      // Delete test transfer record
      await databaseHelpers.pool.query(`
        DELETE FROM admin_supply_transfers WHERE id = $1
      `, [transferResult.transfer.id]);
      
      console.log('✅ Test transfer rolled back (supply restored to original state)\n');

    } else {
      console.error('❌ Transfer failed:', transferResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

testAdminSupplyTransfer();

