import { databaseHelpers, authHelpers } from './appwrite.js';

// Test database functionality
export const testDatabase = {
  // Test wallet operations
  async testWalletOperations() {
    try {
      console.log('🧪 Testing wallet operations...');
      
      // Get current user
      const session = await getServerSession();
    const user = session;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const userId = user.$id;
      console.log('👤 Testing with user:', userId);
      
      // Test creating wallet
      console.log('📝 Creating wallet...');
      const wallet = await databaseHelpers.wallet.createWallet(userId, 'PKR');
      console.log('✅ Wallet created:', wallet);
      
      // Test adding funds
      console.log('💰 Adding 100 PKR to wallet...');
      const updatedWallet = await databaseHelpers.wallet.addFunds(wallet.$id, 100);
      console.log('✅ Funds added. New balance:', updatedWallet.balance);
      
      // Test deducting funds
      console.log('💸 Deducting 25 PKR from wallet...');
      const finalWallet = await databaseHelpers.wallet.deductFunds(wallet.$id, 25);
      console.log('✅ Funds deducted. Final balance:', finalWallet.balance);
      
      return finalWallet;
    } catch (error) {
      console.error('❌ Wallet operations test failed:', error);
      throw error;
    }
  },

  // Test transaction operations
  async testTransactionOperations() {
    try {
      console.log('🧪 Testing transaction operations...');
      
      // Get current user
      const session = await getServerSession();
    const user = session;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const userId = user.$id;
      
      // Test creating transactions
      console.log('📝 Creating deposit transaction...');
      const depositTx = await databaseHelpers.transactions.createTransaction(
        userId,
        'deposit',
        50,
        'test-gateway'
      );
      console.log('✅ Deposit transaction created:', depositTx);
      
      // Test updating transaction status
      console.log('🔄 Updating transaction status to completed...');
      const completedTx = await databaseHelpers.transactions.updateTransactionStatus(
        depositTx.$id,
        'completed'
      );
      console.log('✅ Transaction status updated:', completedTx);
      
      // Test getting user transactions
      console.log('📋 Getting user transactions...');
      const transactions = await databaseHelpers.transactions.getUserTransactions(userId, 10);
      console.log('✅ User transactions retrieved:', transactions.length, 'transactions');
      
      // Test getting transaction statistics
      console.log('📊 Getting transaction statistics...');
      const stats = await databaseHelpers.transactions.getTransactionStats(userId);
      console.log('✅ Transaction statistics:', stats);
      
      return { transactions, stats };
    } catch (error) {
      console.error('❌ Transaction operations test failed:', error);
      throw error;
    }
  },

  // Test combined operations
  async testCombinedOperations() {
    try {
      console.log('🧪 Testing combined operations...');
      
      // Get current user
      const session = await getServerSession();
    const user = session;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const userId = user.$id;
      
      // Test processing a transaction
      console.log('🔄 Processing deposit transaction...');
      const result = await databaseHelpers.combined.processTransaction(
        userId,
        'deposit',
        75,
        'test-gateway'
      );
      console.log('✅ Transaction processed:', result);
      
      // Test getting financial overview
      console.log('📊 Getting financial overview...');
      const overview = await databaseHelpers.combined.getUserFinancialOverview(userId);
      console.log('✅ Financial overview:', overview);
      
      return overview;
    } catch (error) {
      console.error('❌ Combined operations test failed:', error);
      throw error;
    }
  },

  // Run all tests
  async runAllTests() {
    try {
      console.log('🚀 Starting comprehensive database tests...');
      
      // Test wallet operations
      const wallet = await this.testWalletOperations();
      
      // Test transaction operations
      const transactionData = await this.testTransactionOperations();
      
      // Test combined operations
      const overview = await this.testCombinedOperations();
      
      console.log('✅ All database tests completed successfully!');
      console.log('📊 Test Summary:');
      console.log('  - Wallet operations: ✅');
      console.log('  - Transaction operations: ✅');
      console.log('  - Combined operations: ✅');
      
      return {
        wallet,
        transactionData,
        overview
      };
    } catch (error) {
      console.error('❌ Database tests failed:', error);
      throw error;
    }
  }
};

// Export for use in other files
export default testDatabase;















