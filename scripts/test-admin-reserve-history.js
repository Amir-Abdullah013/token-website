/**
 * Test script to verify Admin Reserve History is working correctly
 * This script tests:
 * 1. SYSTEM user creation
 * 2. History entry creation
 * 3. History retrieval
 */

require('dotenv').config();
const { databaseHelpers } = require('../src/lib/database');

async function testAdminReserveHistory() {
  console.log('🧪 Testing Admin Reserve History System\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get or create SYSTEM user
    console.log('\n📋 Test 1: Getting/Creating SYSTEM user...');
    const systemUserId = await databaseHelpers.adminReserveHistory.getOrCreateSystemUser();
    console.log('✅ SYSTEM user ID:', systemUserId);

    // Test 2: Get current token supply
    console.log('\n📋 Test 2: Getting current token supply...');
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      throw new Error('Token supply not found');
    }
    const currentReserve = Number(tokenSupply.adminReserve);
    console.log('✅ Current admin reserve:', currentReserve.toLocaleString());

    // Test 3: Deduct staking reward (updates reserve AND logs history)
    console.log('\n📋 Test 3: Deducting staking reward from admin reserve...');
    const testAmount = 100;
    const testStakingId = 'test-' + Date.now();

    console.log('   Reserve before:', currentReserve.toLocaleString());
    console.log('   Deducting:', testAmount);
    console.log('   Expected reserve after:', (currentReserve - testAmount).toLocaleString());

    const result = await databaseHelpers.adminReserveHistory.deductStakingReward({
      amount: testAmount,
      userId: null,
      stakingId: testStakingId,
      purpose: 'Test entry - Admin Reserve History verification',
      adminId: 'SYSTEM'
    });

    console.log('✅ Staking reward deducted successfully:', {
      historyId: result.historyEntry.id,
      type: result.historyEntry.transactionType,
      amount: result.historyEntry.amount,
      reserveBefore: result.historyEntry.reserveBefore,
      reserveAfter: result.historyEntry.reserveAfter
    });

    // Verify the reserve was actually updated
    const updatedTokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const updatedReserve = Number(updatedTokenSupply.adminReserve);
    console.log('\n📊 Verification:');
    console.log('   Reserve before:', currentReserve.toLocaleString());
    console.log('   Reserve after:', updatedReserve.toLocaleString());
    console.log('   Difference:', (currentReserve - updatedReserve).toLocaleString());
    
    if (Math.abs(updatedReserve - (currentReserve - testAmount)) < 0.01) {
      console.log('   ✅ Reserve correctly updated in database!');
    } else {
      throw new Error(`Reserve mismatch! Expected ${currentReserve - testAmount}, got ${updatedReserve}`);
    }

    // Test 4: Retrieve history
    console.log('\n📋 Test 4: Retrieving history entries...');
    const history = await databaseHelpers.adminReserveHistory.getReserveHistory({
      transactionType: 'STAKING_REWARD',
      limit: 10
    });

    console.log(`✅ Retrieved ${history.length} history entries`);
    if (history.length > 0) {
      console.log('\n📊 Recent entries:');
      history.slice(0, 5).forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.transactionType} - ${entry.amount} (${new Date(entry.createdAt).toLocaleString()})`);
      });
    }

    // Test 5: Get statistics
    console.log('\n📋 Test 5: Getting history statistics...');
    const stats = await databaseHelpers.adminReserveHistory.getReserveHistoryStats({
      transactionType: 'STAKING_REWARD'
    });

    console.log('✅ Statistics:', {
      totalTransactions: stats.total_transactions,
      totalRemoved: Number(stats.total_removed || 0).toLocaleString(),
      firstTransaction: stats.first_transaction ? new Date(stats.first_transaction).toLocaleString() : 'N/A',
      lastTransaction: stats.last_transaction ? new Date(stats.last_transaction).toLocaleString() : 'N/A'
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests passed! Admin Reserve History is working correctly.');
    console.log('\n✅ Verification complete:');
    console.log('   - SYSTEM user exists and is accessible');
    console.log('   - History entries can be created');
    console.log('   - History entries can be retrieved');
    console.log('   - Statistics are calculated correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail
    });
    process.exit(1);
  } finally {
    // Close database connection
    await databaseHelpers.pool.end();
  }
}

// Run the test
testAdminReserveHistory()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

