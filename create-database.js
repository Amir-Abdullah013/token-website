import { databases } from './src/lib/appwrite.js';

async function createDatabase() {
  try {
    console.log('🚀 Creating database and collections...');
    
    // Create database
    try {
      console.log('Creating database wallets_db...');
      const database = await databases.create(
        'wallets_db',
        'Wallets Database',
        'Database for wallet and transaction management'
      );
      console.log('✅ Database created successfully:', database.$id);
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Database already exists');
      } else {
        throw error;
      }
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
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Wallets collection already exists');
      } else {
        throw error;
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
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Transactions collection already exists');
      } else {
        throw error;
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
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Settings collection already exists');
      } else {
        throw error;
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
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ AdminLogs collection already exists');
      } else {
        throw error;
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
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Prices collection already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Created:');
    console.log('  - Database: wallets_db');
    console.log('  - Collections: wallets, transactions, settings, admin_logs, prices');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

createDatabase();










