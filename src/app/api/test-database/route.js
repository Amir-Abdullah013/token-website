export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Try to access wallets collection
    console.log('1. Testing access to wallets collection...');
    try {
      const walletsResponse = await databases.listDocuments('wallets_db', 'wallets', []);
      console.log('✅ Wallets collection accessible, documents:', walletsResponse.total);
    } catch (error) {
      console.log('❌ Wallets collection not accessible:', error.message);
      return Response.json({
        success: false,
        message: 'Wallets collection not accessible',
        error: error.message,
        code: error.code
      });
    }
    
    // Test 2: Try to access transactions collection
    console.log('2. Testing access to transactions collection...');
    try {
      const transactionsResponse = await databases.listDocuments('wallets_db', 'transactions', []);
      console.log('✅ Transactions collection accessible, documents:', transactionsResponse.total);
    } catch (error) {
      console.log('❌ Transactions collection not accessible:', error.message);
      return Response.json({
        success: false,
        message: 'Transactions collection not accessible',
        error: error.message,
        code: error.code
      });
    }
    
    return Response.json({
      success: true,
      message: 'Database connection successful',
      database: {
        id: 'wallets_db',
        name: 'Wallets Database'
      },
      collections: {
        wallets: 'accessible',
        transactions: 'accessible'
      },
      status: 'complete'
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return Response.json({
      success: false,
      message: `Database test failed: ${error.message}`,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}
