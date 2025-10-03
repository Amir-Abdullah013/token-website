import { databaseHelpers } from '../../../lib/database.js';

export async function POST() {
  try {
    console.log('🚀 Creating database and collections...');
    console.log('Available methods on databases:', Object.getOwnPropertyNames(databases));
    console.log('Databases object:', databases);
    
    const results = {
      database: null,
      collections: {},
      errors: []
    };

    // Try to create database using the correct method
    try {
      console.log('Creating database wallets_db...');
      // Let's try the correct Appwrite method
      const database = await databases.create(
        'wallets_db',
        'Wallets Database',
        'Database for wallet and transaction management'
      );
      console.log('✅ Database created successfully:', database.$id);
      results.database = database;
    } catch (error) {
      console.error('❌ Error creating database:', error);
      console.error('Error details:', error.message, error.code);
      results.errors.push({ type: 'database', error: error.message });
      return Response.json({
        success: false,
        message: `Database creation failed: ${error.message}`,
        error: error.message,
        availableMethods: Object.getOwnPropertyNames(databases)
      }, { status: 500 });
    }

    // Create Wallets collection
    try {
      console.log('Creating Wallets collection...');
      const walletsCollection = await databases.createCollection(
        'wallets_db',
        'wallets',
        'Wallets',
        'User wallet information and balances'
      );
      console.log('✅ Wallets collection created successfully');
      results.collections.wallets = walletsCollection;
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Wallets collection already exists');
        results.collections.wallets = { $id: 'wallets' };
      } else {
        console.error('❌ Error creating Wallets collection:', error);
        results.errors.push({ type: 'wallets', error: error.message });
      }
    }

    // Create Transactions collection
    try {
      console.log('Creating Transactions collection...');
      const transactionsCollection = await databases.createCollection(
        'wallets_db',
        'transactions',
        'Transactions',
        'User transaction records'
      );
      console.log('✅ Transactions collection created successfully');
      results.collections.transactions = transactionsCollection;
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Transactions collection already exists');
        results.collections.transactions = { $id: 'transactions' };
      } else {
        console.error('❌ Error creating Transactions collection:', error);
        results.errors.push({ type: 'transactions', error: error.message });
      }
    }

    // Create Settings collection
    try {
      console.log('Creating Settings collection...');
      const settingsCollection = await databases.createCollection(
        'wallets_db',
        'settings',
        'Settings',
        'Application settings and configuration'
      );
      console.log('✅ Settings collection created successfully');
      results.collections.settings = settingsCollection;
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Settings collection already exists');
        results.collections.settings = { $id: 'settings' };
      } else {
        console.error('❌ Error creating Settings collection:', error);
        results.errors.push({ type: 'settings', error: error.message });
      }
    }

    // Create AdminLogs collection
    try {
      console.log('Creating AdminLogs collection...');
      const adminLogsCollection = await databases.createCollection(
        'wallets_db',
        'admin_logs',
        'Admin Logs',
        'Admin action logs for audit trail'
      );
      console.log('✅ AdminLogs collection created successfully');
      results.collections.admin_logs = adminLogsCollection;
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ AdminLogs collection already exists');
        results.collections.admin_logs = { $id: 'admin_logs' };
      } else {
        console.error('❌ Error creating AdminLogs collection:', error);
        results.errors.push({ type: 'admin_logs', error: error.message });
      }
    }

    // Create Prices collection
    try {
      console.log('Creating Prices collection...');
      const pricesCollection = await databases.createCollection(
        'wallets_db',
        'prices',
        'Prices',
        'Token price snapshots for historical data'
      );
      console.log('✅ Prices collection created successfully');
      results.collections.prices = pricesCollection;
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Prices collection already exists');
        results.collections.prices = { $id: 'prices' };
      } else {
        console.error('❌ Error creating Prices collection:', error);
        results.errors.push({ type: 'prices', error: error.message });
      }
    }

    console.log('✅ Database setup completed successfully!');
    
    return Response.json({
      success: true,
      message: 'Database setup completed successfully!',
      results
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return Response.json({
      success: false,
      message: `Database setup failed: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
