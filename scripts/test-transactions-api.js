const { databaseHelpers } = require('../src/lib/database');

const testTransactionsAPI = async () => {
  try {
    console.log('🔍 Testing transactions API...');
    
    // Test getAllTransactions function
    console.log('📊 Testing getAllTransactions function...');
    const result = await databaseHelpers.transaction.getAllTransactions({});
    console.log('✅ getAllTransactions result:', {
      dataLength: result.data?.length || 0,
      pagination: result.pagination,
      hasData: !!result.data
    });
    
    if (result.data && result.data.length > 0) {
      console.log('📋 Sample transaction:', result.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error testing transactions API:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testTransactionsAPI();
