import { databases } from './appwrite.js';

// Minimal database setup function
export async function createDatabase() {
  try {
    console.log('Creating database...');
    const database = await databases.create(
      'wallets_db',
      'Wallets Database',
      'Database for wallet and transaction management'
    );
    console.log('✅ Database created successfully:', database.$id);
    return database;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Database already exists');
      return { $id: 'wallets_db' };
    }
    throw error;
  }
}

export async function createWalletsCollection() {
  try {
    console.log('Creating Wallets collection...');
    const collection = await databases.createCollection(
      'wallets_db',
      'wallets',
      'Wallets',
      'User wallet information and balances'
    );
    console.log('✅ Wallets collection created successfully');
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Wallets collection already exists');
      return { $id: 'wallets' };
    }
    throw error;
  }
}

export async function createTransactionsCollection() {
  try {
    console.log('Creating Transactions collection...');
    const collection = await databases.createCollection(
      'wallets_db',
      'transactions',
      'Transactions',
      'User transaction records'
    );
    console.log('✅ Transactions collection created successfully');
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Transactions collection already exists');
      return { $id: 'transactions' };
    }
    throw error;
  }
}

export async function createSettingsCollection() {
  try {
    console.log('Creating Settings collection...');
    const collection = await databases.createCollection(
      'wallets_db',
      'settings',
      'Settings',
      'Application settings and configuration'
    );
    console.log('✅ Settings collection created successfully');
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Settings collection already exists');
      return { $id: 'settings' };
    }
    throw error;
  }
}

export async function createAdminLogsCollection() {
  try {
    console.log('Creating AdminLogs collection...');
    const collection = await databases.createCollection(
      'wallets_db',
      'admin_logs',
      'Admin Logs',
      'Admin action logs for audit trail'
    );
    console.log('✅ AdminLogs collection created successfully');
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ AdminLogs collection already exists');
      return { $id: 'admin_logs' };
    }
    throw error;
  }
}

export async function createPricesCollection() {
  try {
    console.log('Creating Prices collection...');
    const collection = await databases.createCollection(
      'wallets_db',
      'prices',
      'Prices',
      'Token price snapshots for historical data'
    );
    console.log('✅ Prices collection created successfully');
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Prices collection already exists');
      return { $id: 'prices' };
    }
    throw error;
  }
}

export async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Create database
    await createDatabase();
    
    // Create collections
    await createWalletsCollection();
    await createTransactionsCollection();
    await createSettingsCollection();
    await createAdminLogsCollection();
    await createPricesCollection();
    
    console.log('✅ Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}










