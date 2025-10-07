import { databases, DATABASE_ID, WALLETS_COLLECTION_ID, TRANSACTIONS_COLLECTION_ID, SETTINGS_COLLECTION_ID, ADMIN_LOGS_COLLECTION_ID, PRICES_COLLECTION_ID } from './appwrite.js';

// Simple database setup for browser environment
export async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Step 1: Create database
    console.log('Creating database...');
    try {
      const database = await databases.create(
        DATABASE_ID,
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

    // Step 2: Create Wallets collection
    console.log('Creating Wallets collection...');
    try {
      const walletsCollection = await databases.createCollection(
        DATABASE_ID,
        WALLETS_COLLECTION_ID,
        'Wallets',
        'User wallet information and balances'
      );
      console.log('✅ Wallets collection created successfully');
      
      // Create attributes
      await createWalletsAttributes();
      await createWalletsIndexes();
      await createWalletsPermissions();
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Wallets collection already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Create Transactions collection
    console.log('Creating Transactions collection...');
    try {
      const transactionsCollection = await databases.createCollection(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        'Transactions',
        'User transaction records'
      );
      console.log('✅ Transactions collection created successfully');
      
      // Create attributes
      await createTransactionsAttributes();
      await createTransactionsIndexes();
      await createTransactionsPermissions();
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Transactions collection already exists');
      } else {
        throw error;
      }
    }

    // Step 4: Create Settings collection
    console.log('Creating Settings collection...');
    try {
      const settingsCollection = await databases.createCollection(
        DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        'Settings',
        'Application settings and configuration'
      );
      console.log('✅ Settings collection created successfully');
      
      // Create attributes
      await createSettingsAttributes();
      await createSettingsIndexes();
      await createSettingsPermissions();
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Settings collection already exists');
      } else {
        throw error;
      }
    }

    // Step 5: Create AdminLogs collection
    console.log('Creating AdminLogs collection...');
    try {
      const adminLogsCollection = await databases.createCollection(
        DATABASE_ID,
        ADMIN_LOGS_COLLECTION_ID,
        'Admin Logs',
        'Admin action logs for audit trail'
      );
      console.log('✅ AdminLogs collection created successfully');
      
      // Create attributes
      await createAdminLogsAttributes();
      await createAdminLogsIndexes();
      await createAdminLogsPermissions();
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ AdminLogs collection already exists');
      } else {
        throw error;
      }
    }

    // Step 6: Create Prices collection
    console.log('Creating Prices collection...');
    try {
      const pricesCollection = await databases.createCollection(
        DATABASE_ID,
        PRICES_COLLECTION_ID,
        'Prices',
        'Token price snapshots for historical data'
      );
      console.log('✅ Prices collection created successfully');
      
      // Create attributes
      await createPricesAttributes();
      await createPricesIndexes();
      await createPricesPermissions();
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Prices collection already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Wallets collection setup
async function createWalletsAttributes() {
  const attributes = [
    { key: 'userId', type: 'string', size: 255, required: true },
    { key: 'balance', type: 'double', required: true, default: 0 },
    { key: 'currency', type: 'string', size: 10, required: true, default: 'PKR' },
    { key: 'lastUpdated', type: 'datetime', required: true }
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          WALLETS_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required,
          attr.default
        );
      } else if (attr.type === 'double') {
        await databases.createFloatAttribute(
          DATABASE_ID,
          WALLETS_COLLECTION_ID,
          attr.key,
          attr.required,
          attr.default
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          WALLETS_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating attribute ${attr.key}:`, error);
      }
    }
  }
}

async function createWalletsIndexes() {
  const indexes = [
    { key: 'userId_index', type: 'key', attributes: ['userId'] },
    { key: 'currency_index', type: 'key', attributes: ['currency'] }
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        WALLETS_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating index ${index.key}:`, error);
      }
    }
  }
}

async function createWalletsPermissions() {
  const permissions = [
    { permission: 'read', role: 'user', condition: 'userId == $userId' },
    { permission: 'create', role: 'user', condition: 'userId == $userId' },
    { permission: 'update', role: 'user', condition: 'userId == $userId' },
    { permission: 'delete', role: 'user', condition: 'userId == $userId' },
    { permission: 'read', role: 'admin' },
    { permission: 'create', role: 'admin' },
    { permission: 'update', role: 'admin' },
    { permission: 'delete', role: 'admin' }
  ];

  for (const perm of permissions) {
    try {
      await databases.createPermission(
        DATABASE_ID,
        WALLETS_COLLECTION_ID,
        perm.permission,
        perm.role,
        perm.condition
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating permission ${perm.permission} for ${perm.role}:`, error);
      }
    }
  }
}

// Transactions collection setup
async function createTransactionsAttributes() {
  const attributes = [
    { key: 'userId', type: 'string', size: 255, required: true },
    { key: 'type', type: 'enum', elements: ['deposit', 'withdraw', 'buy', 'sell'], required: true },
    { key: 'amount', type: 'double', required: true },
    { key: 'status', type: 'enum', elements: ['pending', 'completed', 'failed'], required: true },
    { key: 'gateway', type: 'string', size: 100, required: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'enum') {
        await databases.createEnumAttribute(
          DATABASE_ID,
          TRANSACTIONS_COLLECTION_ID,
          attr.key,
          attr.elements,
          attr.required
        );
      } else if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          TRANSACTIONS_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'double') {
        await databases.createFloatAttribute(
          DATABASE_ID,
          TRANSACTIONS_COLLECTION_ID,
          attr.key,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          TRANSACTIONS_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating attribute ${attr.key}:`, error);
      }
    }
  }
}

async function createTransactionsIndexes() {
  const indexes = [
    { key: 'userId_index', type: 'key', attributes: ['userId'] },
    { key: 'type_index', type: 'key', attributes: ['type'] },
    { key: 'status_index', type: 'key', attributes: ['status'] },
    { key: 'createdAt_index', type: 'key', attributes: ['createdAt'] },
    { key: 'userId_createdAt_index', type: 'key', attributes: ['userId', 'createdAt'] }
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating index ${index.key}:`, error);
      }
    }
  }
}

async function createTransactionsPermissions() {
  const permissions = [
    { permission: 'read', role: 'user', condition: 'userId == $userId' },
    { permission: 'create', role: 'user', condition: 'userId == $userId' },
    { permission: 'update', role: 'user', condition: 'userId == $userId' },
    { permission: 'delete', role: 'user', condition: 'userId == $userId' },
    { permission: 'read', role: 'admin' },
    { permission: 'create', role: 'admin' },
    { permission: 'update', role: 'admin' },
    { permission: 'delete', role: 'admin' }
  ];

  for (const perm of permissions) {
    try {
      await databases.createPermission(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        perm.permission,
        perm.role,
        perm.condition
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating permission ${perm.permission} for ${perm.role}:`, error);
      }
    }
  }
}

// Settings collection setup
async function createSettingsAttributes() {
  const attributes = [
    { key: 'key', type: 'string', size: 100, required: true },
    { key: 'value', type: 'string', size: 1000, required: true },
    { key: 'description', type: 'string', size: 500, required: false },
    { key: 'updatedAt', type: 'datetime', required: true }
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          SETTINGS_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          SETTINGS_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating attribute ${attr.key}:`, error);
      }
    }
  }
}

async function createSettingsIndexes() {
  const indexes = [
    { key: 'key_index', type: 'key', attributes: ['key'] }
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating index ${index.key}:`, error);
      }
    }
  }
}

async function createSettingsPermissions() {
  const permissions = [
    { permission: 'read', role: 'user' },
    { permission: 'read', role: 'admin' },
    { permission: 'create', role: 'admin' },
    { permission: 'update', role: 'admin' },
    { permission: 'delete', role: 'admin' }
  ];

  for (const perm of permissions) {
    try {
      await databases.createPermission(
        DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        perm.permission,
        perm.role,
        perm.condition
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating permission ${perm.permission} for ${perm.role}:`, error);
      }
    }
  }
}

// AdminLogs collection setup
async function createAdminLogsAttributes() {
  const attributes = [
    { key: 'adminId', type: 'string', size: 255, required: true },
    { key: 'action', type: 'string', size: 100, required: true },
    { key: 'targetType', type: 'string', size: 50, required: true },
    { key: 'targetId', type: 'string', size: 255, required: true },
    { key: 'details', type: 'string', size: 1000, required: false },
    { key: 'ipAddress', type: 'string', size: 45, required: false },
    { key: 'userAgent', type: 'string', size: 500, required: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          ADMIN_LOGS_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          ADMIN_LOGS_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating attribute ${attr.key}:`, error);
      }
    }
  }
}

async function createAdminLogsIndexes() {
  const indexes = [
    { key: 'adminId_index', type: 'key', attributes: ['adminId'] },
    { key: 'action_index', type: 'key', attributes: ['action'] },
    { key: 'targetType_index', type: 'key', attributes: ['targetType'] },
    { key: 'createdAt_index', type: 'key', attributes: ['createdAt'] }
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        ADMIN_LOGS_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating index ${index.key}:`, error);
      }
    }
  }
}

async function createAdminLogsPermissions() {
  const permissions = [
    { permission: 'read', role: 'admin' },
    { permission: 'create', role: 'admin' },
    { permission: 'update', role: 'admin' },
    { permission: 'delete', role: 'admin' }
  ];

  for (const perm of permissions) {
    try {
      await databases.createPermission(
        DATABASE_ID,
        ADMIN_LOGS_COLLECTION_ID,
        perm.permission,
        perm.role,
        perm.condition
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating permission ${perm.permission} for ${perm.role}:`, error);
      }
    }
  }
}

// Prices collection setup
async function createPricesAttributes() {
  const attributes = [
    { key: 'symbol', type: 'string', size: 20, required: true },
    { key: 'price', type: 'double', required: true },
    { key: 'volume', type: 'double', required: false },
    { key: 'marketCap', type: 'double', required: false },
    { key: 'timestamp', type: 'datetime', required: true },
    { key: 'source', type: 'string', size: 50, required: false }
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          PRICES_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'double') {
        await databases.createFloatAttribute(
          DATABASE_ID,
          PRICES_COLLECTION_ID,
          attr.key,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          PRICES_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating attribute ${attr.key}:`, error);
      }
    }
  }
}

async function createPricesIndexes() {
  const indexes = [
    { key: 'symbol_index', type: 'key', attributes: ['symbol'] },
    { key: 'timestamp_index', type: 'key', attributes: ['timestamp'] },
    { key: 'symbol_timestamp_index', type: 'key', attributes: ['symbol', 'timestamp'] }
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        PRICES_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating index ${index.key}:`, error);
      }
    }
  }
}

async function createPricesPermissions() {
  const permissions = [
    { permission: 'read', role: 'user' },
    { permission: 'read', role: 'admin' },
    { permission: 'create', role: 'admin' },
    { permission: 'update', role: 'admin' },
    { permission: 'delete', role: 'admin' }
  ];

  for (const perm of permissions) {
    try {
      await databases.createPermission(
        DATABASE_ID,
        PRICES_COLLECTION_ID,
        perm.permission,
        perm.role,
        perm.condition
      );
    } catch (error) {
      if (error.code !== 409) {
        console.error(`Error creating permission ${perm.permission} for ${perm.role}:`, error);
      }
    }
  }
}













