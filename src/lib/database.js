import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Parse DATABASE_URL to handle special characters in password
const parseDatabaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      password: urlObj.password,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

// Database connection pool with improved configuration
const createPool = () => {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔗 DATABASE_URL found:', process.env.DATABASE_URL.substring(0, 50) + '...');
  
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    throw new Error('Invalid DATABASE_URL configuration');
  }

  console.log('✅ Database configuration parsed successfully');
  console.log('   Host:', dbConfig.host);
  console.log('   Port:', dbConfig.port);
  console.log('   Database:', dbConfig.database);
  console.log('   User:', dbConfig.user);

  return new Pool({
    ...dbConfig,
    max: 5, // Reduced max connections for better stability
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    acquireTimeoutMillis: 15000, // 15 seconds
    allowExitOnIdle: true
  });
};

const pool = createPool();

// Test database connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
};

// Initialize connection
testConnection();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  process.on('SIGINT', async () => {
    console.log('Closing database pool...');
    await pool.end();
    process.exit(0);
  });
}

export const databaseHelpers = {
  // Export pool for direct queries
  pool,
  
  // User operations
  user: {
    async getUserByEmail(email) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user by email:', error);
        throw error;
      }
    },

    async getUserById(id) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user by id:', error);
        throw error;
      }
    },

    async createUser(userData) {
      try {
        const { email, password, name, emailVerified = true, role = 'USER', referrerId = null } = userData;
        
        // First check if user already exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log('👤 User already exists, returning existing user:', email);
          return existingUser.rows[0];
        }
        
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO users (id, email, password, name, "emailVerified", role, "referrerId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [id, email, password, name, emailVerified, role, referrerId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    async getUserById(userId) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
      }
    },

    async updateUser(userId, updateData) {
      try {
        const fields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            fields.push(`"${key}" = $${paramCount}`);
            values.push(value);
            paramCount++;
          }
        }

        if (fields.length === 0) {
          throw new Error('No fields to update');
        }

        fields.push(`"updatedAt" = NOW()`);
        values.push(userId);

        const query = `
          UPDATE users 
          SET ${fields.join(', ')} 
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    },

    async getAllUsers() {
      try {
        const result = await pool.query('SELECT * FROM users ORDER BY "createdAt" DESC');
        return result.rows;
      } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
      }
    },

    async updateLastLogin(userId) {
      try {
        const result = await pool.query(`
          UPDATE users 
          SET "lastLogin" = NOW(), "updatedAt" = NOW() 
          WHERE id = $1 
          RETURNING *
        `, [userId]);
        
        console.log('✅ Last login updated for user:', userId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating last login:', error);
        throw error;
      }
    },

    async deleteUser(userId) {
      try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        console.log('✅ User deleted:', userId);
        return result.rows[0];
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    },

    async updateUserStatus(userId, status) {
      try {
        const result = await pool.query(`
          UPDATE users 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, userId]);
        
        console.log('✅ User status updated:', userId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    },

    async getAdminUser() {
      try {
        const result = await pool.query('SELECT * FROM users WHERE role = $1 OR "isAdmin" = $2 LIMIT 1', ['ADMIN', true]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting admin user:', error);
        return null;
      }
    },

    /**
     * Update user password
     * @param {string} userId - User ID
     * @param {string} hashedPassword - New hashed password (must be hashed with bcrypt before calling)
     * @returns {Promise<Object>} Updated user record
     */
    async updatePassword(userId, hashedPassword) {
      try {
        const result = await pool.query(`
          UPDATE users 
          SET password = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING id, email, name, role, status, "createdAt", "updatedAt"
        `, [hashedPassword, userId]);
        
        if (result.rows.length === 0) {
          throw new Error(`User not found: ${userId}`);
        }
        
        console.log('✅ User password updated:', userId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating user password:', error);
        throw error;
      }
    }
  },

  // Token stats operations
  // Token stats operations (DEPRECATED - Buy-based inflation removed)
  // Now using supply-based economy with tokenValue.getCurrentTokenValue()
  tokenStats: {
    async getTokenStats() {
      console.warn('⚠️ tokenStats.getTokenStats() is deprecated. Use tokenValue.getCurrentTokenValue() instead.');
      try {
        const result = await pool.query('SELECT * FROM "TokenStats" ORDER BY "createdAt" DESC LIMIT 1');
        return result.rows[0] || {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      } catch (error) {
        console.log('⚠️ TokenStats table not found, using default values:', error.message);
        return {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      }
    },

    // REMOVED: Deprecated methods - use tokenValue.getCurrentTokenValue() instead
    // These methods have been removed to prevent confusion and ensure
    // all price calculations use the unified supply-based system.
  },

  // Wallet operations
  wallet: {
    async getUserWallet(userId) {
      try {
        const result = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting user wallet:', error);
        return null;
      }
    },

    async createWallet(userId, currency = 'USD') {
      try {
        // Generate a CUID for the wallet ID
        const walletId = randomUUID();
        
        console.log('🔧 Creating wallet with ID:', walletId, 'for user:', userId);
        
        // First check if wallet already exists
        const existingWallet = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        if (existingWallet.rows.length > 0) {
          console.log('⚠️ Wallet already exists for user:', userId);
          return existingWallet.rows[0];
        }
        
        // Create wallet without foreign key constraint check for now
        const result = await pool.query(`
          INSERT INTO wallets (id, "userId", balance, "VonBalance", "stakingTokensAmount", currency, "lastUpdated", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
          RETURNING *
        `, [walletId, userId, 0, 0, 0, currency]);
        
        if (result.rows.length === 0) {
          throw new Error('Wallet creation failed - no rows returned');
        }
        
        console.log('✅ Wallet created successfully:', { 
          walletId: result.rows[0].id, 
          userId: result.rows[0].userId, 
          currency: result.rows[0].currency 
        });
        return result.rows[0];
      } catch (error) {
        console.error('❌ Error creating wallet:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          constraint: error.constraint,
          detail: error.detail
        });
        
        // If it's a foreign key constraint error, try to create the user first
        if (error.constraint && error.constraint.includes('userId')) {
          console.log('🔧 Foreign key constraint error, attempting to create user first...');
          try {
            // Create a basic user record
            const userResult = await pool.query(`
              INSERT INTO users (id, email, name, "emailVerified", role, "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
              RETURNING *
            `, [userId, 'user@example.com', 'User', true, 'USER']);
            
            console.log('✅ User created for wallet:', userId);
            
            // Try creating wallet again
            const retryResult = await pool.query(`
              INSERT INTO wallets (id, "userId", balance, "VonBalance", "stakingTokensAmount", currency, "lastUpdated", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
              RETURNING *
            `, [randomUUID(), userId, 0, 0, 0, currency]);
            
            if (retryResult.rows.length > 0) {
              console.log('✅ Wallet created on retry:', retryResult.rows[0].id);
              return retryResult.rows[0];
            }
          } catch (retryError) {
            console.error('❌ Retry failed:', retryError);
          }
        }
        
        throw error;
      }
    },

    async updateWallet(userId, balance, VonBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "VonBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [balance, VonBalance, userId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating wallet:', error);
        throw error;
      }
    },

    async updateBothBalances(userId, usdBalance, VonBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "VonBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [usdBalance, VonBalance, userId]);
        
        console.log('✅ Wallet balances updated:', { userId, usdBalance, VonBalance });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating both balances:', error);
        throw error;
      }
    },

    async updateUsdBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ USD balance updated:', { userId, amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating USD balance:', error);
        throw error;
      }
    },

    async updateVonBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "VonBalance" = "VonBalance" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ Von balance updated:', { userId, amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating Von balance:', error);
        throw error;
      }
    },

    async updateBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = balance + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ Balance updated:', userId, { amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating balance:', error);
        throw error;
      }
    },

    async getWalletByUserId(userId) {
      try {
        const result = await pool.query('SELECT * FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting wallet by user ID:', error);
        return null;
      }
    },

    async getVonBalance(userId) {
      try {
        const result = await pool.query('SELECT "VonBalance" FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0]?.VonBalance || 0;
      } catch (error) {
        console.error('Error getting Von balance:', error);
        return 0;
      }
    },

    async updateVonBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "VonBalance" = "VonBalance" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ Von balance updated:', userId, { amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating Von balance:', error);
        throw error;
      }
    },

    // Staking tokens management functions
    async lockStakingTokens(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "stakingTokensAmount" = "stakingTokensAmount" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ Staking tokens locked:', { userId, amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error locking staking tokens:', error);
        throw error;
      }
    },

    async unlockStakingTokens(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "stakingTokensAmount" = "stakingTokensAmount" - $1, 
              "VonBalance" = "VonBalance" + $1,
              "lastUpdated" = NOW(), 
              "updatedAt" = NOW()
          WHERE "userId" = $2 AND "stakingTokensAmount" >= $1
          RETURNING *
        `, [amount, userId]);
        
        if (result.rowCount === 0) {
          throw new Error('Insufficient staking tokens to unlock');
        }
        
        console.log('✅ Staking tokens unlocked and added to VonBalance:', { userId, amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error unlocking staking tokens:', error);
        throw error;
      }
    },

    async getStakingTokensAmount(userId) {
      try {
        const result = await pool.query(
          'SELECT "stakingTokensAmount" FROM wallets WHERE "userId" = $1', 
          [userId]
        );
        return Number(result.rows[0]?.stakingTokensAmount || 0);
      } catch (error) {
        console.error('Error getting staking tokens amount:', error);
        return 0;
      }
    }
  },

  // Transaction operations
  transaction: {
    async createTransaction(transactionData) {
      let client;
      try {
        const { 
          userId, type, amount, currency = 'USD', status = 'PENDING', description = null, 
          gateway = null, binanceAddress = null, network = null, screenshot = null,
          feeAmount = null, netAmount = null, feeReceiverId = null, transactionType = null
        } = transactionData;
        const id = randomUUID();
        const normalizedFeeAmount = feeAmount ?? 0;
        
        // CRITICAL: Calculate netAmount if not provided (amount - feeAmount)
        // netAmount is required (NOT NULL) in database
        const normalizedNetAmount = netAmount !== null && netAmount !== undefined 
          ? netAmount 
          : (amount - normalizedFeeAmount);
        
        // Validate required fields
        if (!userId || !type || !amount) {
          throw new Error('Missing required fields for transaction');
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount for transaction');
        }
        
        // Validate netAmount
        if (isNaN(normalizedNetAmount) || normalizedNetAmount < 0) {
          throw new Error('Invalid netAmount for transaction');
        }

        client = await pool.connect();
        
        // Normalize enum-like fields to uppercase by default
        const txTypePrimary = typeof type === 'string' ? type.toUpperCase() : type;
        const txStatusPrimary = typeof status === 'string' ? status.toUpperCase() : status;

        try {
          const result = await client.query(`
            INSERT INTO transactions (id, "userId", type, amount, currency, status, description, gateway, "binanceAddress", network, screenshot, "feeAmount", "netAmount", "feeReceiverId", "transactionType", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
            RETURNING *
          `, [id, userId, txTypePrimary, amount, currency, txStatusPrimary, description, gateway, binanceAddress, network, screenshot, normalizedFeeAmount, normalizedNetAmount, feeReceiverId, transactionType]);
          console.log('✅ Transaction created:', id);
          return result.rows[0];
        } catch (enumErr) {
          if (enumErr && enumErr.code === '22P02') {
            // Fallback to lowercase variants if enum casing mismatches
            const txTypeFallback = typeof type === 'string' ? type.toLowerCase() : type;
            const txStatusFallback = typeof status === 'string' ? status.toLowerCase() : status;
            const result = await client.query(`
              INSERT INTO transactions (id, "userId", type, amount, currency, status, description, gateway, "binanceAddress", network, screenshot, "feeAmount", "netAmount", "feeReceiverId", "transactionType", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
              RETURNING *
            `, [id, userId, txTypeFallback, amount, currency, txStatusFallback, description, gateway, binanceAddress, network, screenshot, normalizedFeeAmount, normalizedNetAmount, feeReceiverId, transactionType]);
            console.log('✅ Transaction created with fallback enum casing:', id);
            return result.rows[0];
          }
          throw enumErr;
        }
      } catch (error) {
        console.error('Error creating transaction:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('Transaction with this ID already exists');
        } else if (error.code === '23503') {
          throw new Error('User not found for transaction');
        } else if (error.code === '23514') {
          throw new Error('Invalid data for transaction');
        } else if (error.message.includes('SASL')) {
          throw new Error('Database authentication failed. Please check your database credentials.');
        } else if (error.message.includes('connection')) {
          throw new Error('Database connection failed. Please try again.');
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getUserTransactions(userId, limit = 10) {
      try {
        const result = await pool.query(`
          SELECT * FROM transactions 
          WHERE "userId" = $1 
          ORDER BY "createdAt" DESC 
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }
    },

    async getTransactionStats(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as totalTransactions,
            SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
            SUM(CASE WHEN type = 'WITHDRAW' THEN amount ELSE 0 END) as totalWithdrawals,
            SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
            SUM(CASE WHEN type = 'SELL' THEN amount ELSE 0 END) as totalSells
          FROM transactions 
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0] || {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      } catch (error) {
        console.error('Error getting transaction stats:', error);
        return {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      }
    },

    async getUserTransactionStats(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as totalTransactions,
            SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
            SUM(CASE WHEN type = 'WITHDRAW' THEN amount ELSE 0 END) as totalWithdrawals,
            SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
            SUM(CASE WHEN type = 'SELL' THEN amount ELSE 0 END) as totalSells
          FROM transactions 
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0] || {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      } catch (error) {
        console.error('Error getting user transaction stats:', error);
        return {
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalBuys: 0,
          totalSells: 0
        };
      }
    },

    async getAllTransactions({ type = null, page = 1, limit = 10, status = '' } = {}) {
      try {
        let query = `
          SELECT t.*, u.name as "userName", u.email as "userEmail"
          FROM transactions t
          LEFT JOIN users u ON t."userId" = u.id
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (type) {
          paramCount++;
          query += ` AND t.type = $${paramCount}`;
          params.push(type);
        }

        if (status) {
          paramCount++;
          query += ` AND t.status = $${paramCount}`;
          params.push(status);
        }

        query += ` ORDER BY t."createdAt" DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);
        
        // Transform the data to include user information in the expected format
        const transformedData = result.rows.map(row => ({
          ...row,
          user: {
            id: row.userId,
            name: row.userName,
            email: row.userEmail
          }
        }));
        
        // Get total count for pagination
        let countQuery = `
          SELECT COUNT(*) as total
          FROM transactions t
          WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;

        if (type) {
          countParamCount++;
          countQuery += ` AND t.type = $${countParamCount}`;
          countParams.push(type);
        }

        if (status) {
          countParamCount++;
          countQuery += ` AND t.status = $${countParamCount}`;
          countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        return {
          data: transformedData,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all transactions:', error);
        throw error;
      }
    },

    async updateTransactionStatus(transactionId, status) {
      try {
        const result = await pool.query(`
          UPDATE transactions 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, transactionId]);
        
        console.log('✅ Transaction status updated:', transactionId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating transaction status:', error);
        throw error;
      }
    },

    async getTransactionById(transactionId) {
      try {
        const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting transaction by ID:', error);
        return null;
      }
    },

    async getUserTransactions(userId, type = null) {
      try {
        let query = `
          SELECT * FROM transactions 
          WHERE "userId" = $1
        `;
        let params = [userId];
        
        if (type) {
          query += ` AND type = $2`;
          params.push(type);
        }
        
        query += ` ORDER BY "createdAt" DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
      }
    },

    async getTransactionStats(type = null) {
      try {
        let whereClause = '';
        let params = [];
        
        if (type) {
          whereClause = 'WHERE type = $1';
          params.push(type);
        }

        const query = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as totalCompletedAmount,
            COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount END), 0) as totalPendingAmount,
            COALESCE(SUM(amount), 0) as totalAmount
          FROM transactions
          ${whereClause}
        `;
        
        console.log('🔍 Executing transaction stats query:', { query, params, type });
        const result = await pool.query(query, params);
        console.log('🔍 Transaction stats query result:', result.rows[0]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting transaction stats:', error);
        return {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          totalCompletedAmount: 0,
          totalPendingAmount: 0,
          totalAmount: 0
        };
      }
    }
  },

  // Notification operations
  notification: {
    async createNotification(notificationData) {
      try {
        const { userId, title, message, type, isGlobal = false, createdBy } = notificationData;
        const id = randomUUID();
        
        // Normalize type casing to maximize compatibility across enum variants
        const primaryType = typeof type === 'string' ? type.toUpperCase() : type;
        try {
          const result = await pool.query(`
            INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *
          `, [id, userId, title, message, primaryType, isGlobal, createdBy]);
          
          console.log('✅ Notification created:', id);
          return result.rows[0];
        } catch (enumErr) {
          // Fallback for enum mismatch (lowercase variant)
          if (enumErr && enumErr.code === '22P02') {
            const fallbackType = typeof type === 'string' ? type.toLowerCase() : type;
            const result = await pool.query(`
              INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
              RETURNING *
            `, [id, userId, title, message, fallbackType, isGlobal, createdBy]);
            console.log('✅ Notification created with fallback type casing:', id, fallbackType);
            return result.rows[0];
          }
          throw enumErr;
        }
      } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    },

    async createGlobalNotification(notificationData) {
      try {
        const { title, message, type, createdBy } = notificationData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
          VALUES ($1, NULL, $2, $3, $4, true, $5, NOW(), NOW())
          RETURNING *
        `, [id, title, message, type, createdBy]);
        
        console.log('✅ Global notification created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating global notification:', error);
        throw error;
      }
    },

    async getUserNotifications(userId, limit = 20) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          WHERE n."userId" = $1 OR n."isGlobal" = true
          ORDER BY n."createdAt" DESC
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user notifications:', error);
        return [];
      }
    },

    async getAllNotifications(limit = 50) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          ORDER BY n."createdAt" DESC
          LIMIT $1
        `, [limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting all notifications:', error);
        return [];
      }
    },

    async updateNotificationStatus(notificationId, status) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [status, notificationId]);
        
        console.log('✅ Notification status updated:', notificationId, 'to', status);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating notification status:', error);
        throw error;
      }
    },

    async deleteNotification(notificationId) {
      try {
        const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [notificationId]);
        console.log('✅ Notification deleted:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    },

    async updateNotification(notificationId, updateData) {
      try {
        const { title, message, type } = updateData;
        const result = await pool.query(`
          UPDATE notifications 
          SET title = $1, message = $2, type = $3, "updatedAt" = NOW()
          WHERE id = $4
          RETURNING *
        `, [title, message, type, notificationId]);
        
        console.log('✅ Notification updated:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating notification:', error);
        throw error;
      }
    },

    async getNotificationById(notificationId) {
      try {
        const result = await pool.query(`
          SELECT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n."createdBy" = u.id
          WHERE n.id = $1
        `, [notificationId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting notification by ID:', error);
        return null;
      }
    },

    async getUnreadCount(userId) {
      try {
        const result = await pool.query(`
          SELECT COUNT(*) as count
          FROM notifications
          WHERE ("userId" = $1 OR "userId" IS NULL) AND status = 'UNREAD'
        `, [userId]);
        return parseInt(result.rows[0].count) || 0;
      } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }
    },

    async markAsRead(notificationId) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = 'READ', "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [notificationId]);
        
        console.log('✅ Notification marked as read:', notificationId);
        return result.rows[0];
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },

    async markAllAsRead(userId) {
      try {
        const result = await pool.query(`
          UPDATE notifications 
          SET status = 'READ', "updatedAt" = NOW()
          WHERE ("userId" = $1 OR "userId" IS NULL) AND status = 'UNREAD'
          RETURNING COUNT(*) as updated
        `, [userId]);
        
        const updated = result.rowCount || 0;
        console.log('✅ All notifications marked as read for user:', userId, 'Updated:', updated);
        return { updated };
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    }
  },

  // Deposit operations
  deposit: {
    async createDepositRequest(depositData) {
      let client;
      try {
        const { userId, amount, screenshot, binanceAddress } = depositData;
        const id = randomUUID();
        
        // Validate required fields
        if (!userId || !amount || !screenshot || !binanceAddress) {
          throw new Error('Missing required fields for deposit request');
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount for deposit request');
        }

        // Verify user exists before creating deposit request
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
          throw new Error(`User with ID ${userId} not found in database`);
        }

        client = await pool.connect();
        
        const result = await client.query(`
          INSERT INTO deposit_requests (id, "userId", amount, screenshot, "binanceAddress", status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
          RETURNING *
        `, [id, userId, amount, screenshot, binanceAddress]);
        
        console.log('✅ Deposit request created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating deposit request:', error);
        
        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error('Deposit request with this ID already exists');
        } else if (error.code === '23503') {
          throw new Error('User not found for deposit request');
        } else if (error.code === '23514') {
          throw new Error('Invalid data for deposit request');
        } else if (error.message.includes('SASL')) {
          throw new Error('Database authentication failed. Please check your database credentials.');
        } else if (error.message.includes('connection')) {
          throw new Error('Database connection failed. Please try again.');
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getUserDepositRequests(userId, limit = 20) {
      try {
        const result = await pool.query(`
          SELECT * FROM deposit_requests 
          WHERE "userId" = $1 
          ORDER BY "createdAt" DESC 
          LIMIT $2
        `, [userId, limit]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting user deposit requests:', error);
        return [];
      }
    },

    async getAllDepositRequests({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE dr.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT dr.*, u.name as user_name, u.email as user_email
          FROM deposit_requests dr
          LEFT JOIN users u ON dr."userId" = u.id
          ${whereClause}
          ORDER BY dr."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        // Get total count
        const countResult = await pool.query(`
          SELECT COUNT(*) as total FROM deposit_requests dr
          ${whereClause}
        `, status ? [status] : []);

        const total = parseInt(countResult.rows[0].total);
        
        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all deposit requests:', error);
        return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
      }
    },

    async getDepositRequestById(depositId) {
      try {
        const result = await pool.query(`
          SELECT dr.*, u.name as user_name, u.email as user_email
          FROM deposit_requests dr
          LEFT JOIN users u ON dr."userId" = u.id
          WHERE dr.id = $1
        `, [depositId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting deposit request by ID:', error);
        return null;
      }
    },

    async updateDepositRequest(depositId, updateData) {
      try {
        const { status, adminNotes } = updateData;
        const result = await pool.query(`
          UPDATE deposit_requests 
          SET status = $1, "adminNotes" = $2, "updatedAt" = NOW()
          WHERE id = $3
          RETURNING *
        `, [status, adminNotes, depositId]);
        
        console.log('✅ Deposit request updated:', depositId);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating deposit request:', error);
        throw error;
      }
    },

    async getDepositStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as rejected,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as totalApprovedAmount
          FROM deposit_requests
        `);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting deposit stats:', error);
        return {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalApprovedAmount: 0
        };
      }
    }
  },

  // Transfer operations
  transfer: {
    async createTransfer(transferData) {
      try {
        const { senderId, recipientId, senderEmail, recipientEmail, amount, note } = transferData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO transfers (id, "senderId", "recipientId", "senderEmail", "recipientEmail", amount, note, status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', NOW(), NOW())
          RETURNING *
        `, [id, senderId, recipientId, senderEmail, recipientEmail, amount, note]);

        console.log('✅ Transfer created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating transfer:', error);
        throw error;
      }
    },

    async getUserTransfers(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            recipient.name as recipient_name
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          WHERE t."senderId" = $1 OR t."recipientId" = $1
          ORDER BY t."createdAt" DESC
        `, [userId]);

        return result.rows;
      } catch (error) {
        console.error('Error getting user transfers:', error);
        throw error;
      }
    },

    async getAllTransfers({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE t.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            sender.email as sender_email,
            recipient.name as recipient_name,
            recipient.email as recipient_email
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          ${whereClause}
          ORDER BY t."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        const countResult = await pool.query(`
          SELECT COUNT(*) as total
          FROM transfers t
          ${whereClause}
        `, status ? [status] : []);

        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(countResult.rows[0].total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all transfers:', error);
        throw error;
      }
    },

    async getTransferById(transferId) {
      try {
        const result = await pool.query(`
          SELECT 
            t.*,
            sender.name as sender_name,
            recipient.name as recipient_name
          FROM transfers t
          LEFT JOIN users sender ON t."senderId" = sender.id
          LEFT JOIN users recipient ON t."recipientId" = recipient.id
          WHERE t.id = $1
        `, [transferId]);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting transfer by ID:', error);
        throw error;
      }
    },

    async getTransferStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COALESCE(SUM(amount), 0) as totalAmount
          FROM transfers
        `);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting transfer stats:', error);
        throw error;
      }
    }
  },

  // System settings operations
  system: {
    async getSetting(key) {
      try {
        const result = await pool.query('SELECT * FROM system_settings WHERE key = $1', [key]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting system setting:', error);
        return null;
      }
    },

    async setSetting(key, value, description = null) {
      try {
        const result = await pool.query(`
          INSERT INTO system_settings (id, key, value, description, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (key) 
          DO UPDATE SET value = $3, description = $4, "updatedAt" = NOW()
          RETURNING *
        `, [randomUUID(), key, value, description]);
        
        console.log('✅ System setting updated:', key);
        return result.rows[0];
      } catch (error) {
        console.error('Error setting system setting:', error);
        throw error;
      }
    }
  },

  staking: {
    async createStaking(stakingData) {
      try {
        const { 
          userId, 
          amountStaked, 
          durationDays, 
          rewardPercent, 
          startDate, 
          endDate,
          rewardAmount: rewardAmountInput,
          dailyRewardAmount: dailyRewardInput,
          nextRewardDate
        } = stakingData;
        const id = randomUUID();
        const computedRewardAmount = typeof rewardAmountInput === 'number' 
          ? rewardAmountInput 
          : (amountStaked * rewardPercent) / 100;
        const computedDailyReward = typeof dailyRewardInput === 'number' 
          ? dailyRewardInput 
          : (durationDays > 0 ? computedRewardAmount / durationDays : 0);
        
        const result = await pool.query(`
          INSERT INTO staking (
            id, "userId", "amountStaked", "durationDays", "rewardPercent", 
            "startDate", "endDate", status, claimed, "rewardAmount", 
            "dailyRewardAmount", "rewardAccrued", "daysRewarded", 
            "nextRewardDate", "createdAt", "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, 'ACTIVE', false, $8,
            $9, 0, 0,
            $10, NOW(), NOW()
          )
          RETURNING *
        `, [
          id, 
          userId, 
          amountStaked, 
          durationDays, 
          rewardPercent, 
          startDate, 
          endDate,
          computedRewardAmount,
          computedDailyReward,
          nextRewardDate || (startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000) : null)
        ]);

        console.log('✅ Staking created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating staking:', error);
        throw error;
      }
    },

    async getUserStakings(userId) {
      let client;
      try {
        console.log('🔍 Database: Getting stakings for user:', userId);
        
        // Get a client from the pool with timeout
        client = await pool.connect();
        
        const result = await client.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          WHERE s."userId" = $1
          ORDER BY s."createdAt" DESC
        `, [userId]);

        console.log('📊 Database: Found stakings:', result.rows.length);
        if (result.rows.length > 0) {
          console.log('📋 Sample staking:', {
            id: result.rows[0].id,
            userId: result.rows[0].userId,
            amountStaked: result.rows[0].amountStaked,
            status: result.rows[0].status
          });
        }
        return result.rows;
      } catch (error) {
        console.error('Error getting user stakings:', error);
        
        // If it's a connection error, return empty array instead of throwing
        if (error.message.includes('Connection terminated') || 
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET')) {
          console.log('🔄 Connection error - returning empty stakings array');
          return [];
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
      }
    },

    async getAllStakings({ page = 1, limit = 10, status = '' } = {}) {
      try {
        const offset = (page - 1) * limit;
        let whereClause = '';
        let params = [limit, offset];
        
        if (status) {
          whereClause = 'WHERE s.status = $3';
          params.push(status);
        }

        const result = await pool.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          ${whereClause}
          ORDER BY s."createdAt" DESC
          LIMIT $1 OFFSET $2
        `, params);

        // Get total count
        const countResult = await pool.query(`
          SELECT COUNT(*) as total FROM staking s
          ${whereClause}
        `, status ? [status] : []);

        const total = parseInt(countResult.rows[0].total);
        
        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      } catch (error) {
        console.error('Error getting all stakings:', error);
        return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
      }
    },

    async getStakingById(stakingId) {
      try {
        const result = await pool.query(`
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM staking s
          LEFT JOIN users u ON s."userId" = u.id
          WHERE s.id = $1
        `, [stakingId]);

        return result.rows[0];
      } catch (error) {
        console.error('Error getting staking by ID:', error);
        throw error;
      }
    },

    async updateStakingStatus(stakingId, status, rewardAmount = null) {
      try {
        let query = 'UPDATE staking SET status = $2, "updatedAt" = NOW()';
        let params = [stakingId, status];
        
        if (rewardAmount !== null) {
          query += ', "rewardAmount" = $3';
          params.push(rewardAmount);
        }
        
        query += ' WHERE id = $1 RETURNING *';
        
        const result = await pool.query(query, params);
        console.log('✅ Staking status updated:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating staking status:', error);
        throw error;
      }
    },

    async claimStaking(stakingId) {
      try {
        const result = await pool.query(`
          UPDATE staking 
          SET status = 'CLAIMED', claimed = true, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [stakingId]);

        console.log('✅ Staking claimed:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error claiming staking:', error);
        throw error;
      }
    },

    async getStakingStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'CLAIMED' THEN 1 END) as claimed,
            COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN "amountStaked" END), 0) as totalStaked,
            COALESCE(SUM("rewardAccrued"), 0) as totalRewards,
            COALESCE(SUM("rewardAmount"), 0) as totalRewardsPlanned
          FROM staking
        `);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting staking stats:', error);
        return {
          total: 0,
          active: 0,
          completed: 0,
          claimed: 0,
          totalStaked: 0,
          totalRewards: 0
        };
      }
    }
  },

  // Referral operations
  referral: {
    async createReferral(referralData) {
      try {
        const { referrerId, referredId } = referralData;
        
        const result = await pool.query(`
          INSERT INTO referrals (id, "referrerId", "referredId", "createdAt")
          VALUES ($1, $2, $3, NOW())
          RETURNING *
        `, [randomUUID(), referrerId, referredId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating referral:', error);
        throw error;
      }
    },

    async getReferralByUsers(referrerId, referredId) {
      try {
        const result = await pool.query(
          'SELECT * FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2',
          [referrerId, referredId]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting referral by users:', error);
        throw error;
      }
    },

    async getUserReferrals(userId) {
      try {
        const result = await pool.query(`
          SELECT r.*, u.name as referred_name, u.email as referred_email
          FROM referrals r
          LEFT JOIN users u ON r."referredId" = u.id
          WHERE r."referrerId" = $1
          ORDER BY r."createdAt" DESC
        `, [userId]);
        return result.rows;
      } catch (error) {
        console.error('Error getting user referrals:', error);
        throw error;
      }
    },

    async getUserReferralEarnings(userId) {
      try {
        const result = await pool.query(`
          SELECT re.*, r."referredId", u.name as referred_name, u.email as referred_email
          FROM referral_earnings re
          LEFT JOIN referrals r ON re."referralId" = r.id
          LEFT JOIN users u ON r."referredId" = u.id
          WHERE r."referrerId" = $1
          ORDER BY re."createdAt" DESC
        `, [userId]);
        return result.rows;
      } catch (error) {
        console.error('Error getting user referral earnings:', error);
        throw error;
      }
    }
  },

  // Referral earning operations
  referralEarning: {
    async createReferralEarning(earningData) {
      try {
        const { referralId, stakingId, amount } = earningData;
        
        const result = await pool.query(`
          INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        `, [randomUUID(), referralId, stakingId, amount]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating referral earning:', error);
        throw error;
      }
    },

    async getReferralEarningsByReferral(referralId) {
      try {
        const result = await pool.query(
          'SELECT * FROM referral_earnings WHERE "referralId" = $1 ORDER BY "createdAt" DESC',
          [referralId]
        );
        return result.rows;
      } catch (error) {
        console.error('Error getting referral earnings by referral:', error);
        throw error;
      }
    },

    async getReferralAnalytics(userId) {
      try {
        const result = await pool.query(`
          WITH referral_stats AS (
            SELECT 
              r."referrerId",
              r."referredId",
              r."createdAt" as signup_date,
              u.name as referred_name,
              u.email as referred_email,
              (
                SELECT COALESCE(SUM(CASE WHEN s.status = 'CLAIMED' THEN s.profit ELSE 0 END), 0)
                FROM staking s
                WHERE s."userId" = r."referredId"
              ) as total_staking_profit,
              (
                SELECT COALESCE(SUM(re.amount), 0)
                FROM referral_earnings re
                WHERE re."referralId" = r.id
              ) as total_earnings_from_user
            FROM referrals r
            LEFT JOIN users u ON r."referredId" = u.id
            WHERE r."referrerId" = $1
          ),
          total_earnings AS (
            SELECT COALESCE(SUM(re.amount), 0) as total_referral_earnings
            FROM referral_earnings re
            INNER JOIN referrals r ON re."referralId" = r.id
            WHERE r."referrerId" = $1
          )
          SELECT 
            rs.*,
            te.total_referral_earnings
          FROM referral_stats rs
          CROSS JOIN total_earnings te
          ORDER BY rs.signup_date DESC
        `, [userId]);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting referral analytics:', error);
        throw error;
      }
    }
  },

  // TokenSupply operations
  tokenSupply: {
    async getTokenSupply() {
      try {
        const result = await pool.query('SELECT * FROM token_supply ORDER BY id DESC LIMIT 1');
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting token supply:', error);
        throw error;
      }
    },

    async adjustAdminReserve(amountDelta) {
      try {
        if (!amountDelta || Number(amountDelta) === 0) {
          return await this.getTokenSupply();
        }

        const tokenSupply = await this.getTokenSupply();
        if (!tokenSupply) {
          throw new Error('TokenSupply record not found');
        }

        const currentReserve = Number(tokenSupply.adminReserve);
        const newReserve = currentReserve + Number(amountDelta);

        if (newReserve < 0) {
          throw new Error(`Insufficient admin reserve. Available: ${currentReserve}, Requested: ${Math.abs(amountDelta)}`);
        }

        const result = await pool.query(`
          UPDATE token_supply
          SET "adminReserve" = "adminReserve" + $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [amountDelta, tokenSupply.id]);

        const updatedReserve = Number(result.rows[0].adminReserve);

        // Log admin reserve history for manual adjustments
        await databaseHelpers.adminReserveHistory.logReserveTransaction({
          transactionType: 'MANUAL_ADJUST',
          amount: amountDelta, // Can be positive or negative
          purpose: `Manual admin reserve adjustment`,
          adminId: 'SYSTEM', // Will be set by admin when calling
          reserveBefore: currentReserve,
          reserveAfter: updatedReserve,
          referenceType: 'MANUAL_ADJUSTMENT'
        });

        console.log('🔄 Admin reserve adjusted:', {
          delta: amountDelta,
          previous: currentReserve,
          updated: updatedReserve
        });

        return result.rows[0];
      } catch (error) {
        console.error('Error adjusting admin reserve:', error);
        throw error;
      }
    },

    async depositStakeToAdminReserve(amount) {
      if (!amount || amount <= 0) {
        return this.getTokenSupply();
      }
      return this.adjustAdminReserve(Math.abs(Number(amount)));
    },

    async releaseStakeFromAdminReserve(amount) {
      if (!amount || amount <= 0) {
        return this.getTokenSupply();
      }
      return this.adjustAdminReserve(-Math.abs(Number(amount)));
    },

    async createTokenSupply(totalSupply = 10000000, remainingSupply = 10000000) {
      try {
        const result = await pool.query(`
          INSERT INTO token_supply ("totalSupply", "remainingSupply", "createdAt", "updatedAt")
          VALUES ($1, $2, NOW(), NOW())
          RETURNING *
        `, [totalSupply, remainingSupply]);
        
        console.log('✅ TokenSupply created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating token supply:', error);
        throw error;
      }
    },

    // NEW: Calculate actual distributed supply from all user wallets
    async calculateDistributedSupply() {
      try {
        const result = await pool.query(`
          SELECT COALESCE(SUM("VonBalance"), 0) as total_distributed
          FROM wallets
        `);
        return Number(result.rows[0].total_distributed) || 0;
      } catch (error) {
        console.error('Error calculating distributed supply:', error);
        throw error;
      }
    },

    // NEW: Sync remainingSupply based on actual distributed tokens
    async syncRemainingSupply() {
      try {
        const currentSupply = await this.getTokenSupply();
        if (!currentSupply) {
          throw new Error('TokenSupply record not found');
        }

        const distributedSupply = await this.calculateDistributedSupply();
        const totalSupply = Number(currentSupply.totalSupply);
        const correctRemainingSupply = Math.floor(totalSupply - distributedSupply);

        const result = await pool.query(`
          UPDATE token_supply 
          SET "remainingSupply" = $1, "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [correctRemainingSupply, currentSupply.id]);

        console.log('✅ Supply synced:', {
          totalSupply,
          distributedSupply: Math.floor(distributedSupply),
          remainingSupply: correctRemainingSupply,
          updated: new Date()
        });

        return result.rows[0];
      } catch (error) {
        console.error('Error syncing remaining supply:', error);
        throw error;
      }
    },

    // NEW: Comprehensive supply update for buy transactions
    async deductSupply(tokenAmount) {
      try {
        const currentSupply = await this.getTokenSupply();
        if (!currentSupply) {
          throw new Error('TokenSupply record not found');
        }

        // Convert to integer for BigInt column
        const tokenAmountInt = Math.floor(tokenAmount);
        
        // Validate we have enough supply
        const currentRemaining = Number(currentSupply.remainingSupply);
        const currentUserSupply = Number(currentSupply.userSupplyRemaining);
        
        if (currentRemaining < tokenAmountInt) {
          throw new Error('Insufficient total supply');
        }
        
        if (currentUserSupply < tokenAmountInt) {
          throw new Error('Insufficient user supply. Admin needs to release more tokens from reserve.');
        }

        // Update both remainingSupply AND userSupplyRemaining
        const result = await pool.query(`
          UPDATE token_supply 
          SET 
            "remainingSupply" = "remainingSupply" - $1,
            "userSupplyRemaining" = "userSupplyRemaining" - $1,
            "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [tokenAmountInt, currentSupply.id]);

        console.log('✅ Supply deducted:', {
          amount: tokenAmountInt,
          newRemainingSupply: Number(result.rows[0].remainingSupply),
          newUserSupplyRemaining: Number(result.rows[0].userSupplyRemaining)
        });

        return result.rows[0];
      } catch (error) {
        console.error('Error deducting supply:', error);
        throw error;
      }
    },

    // NEW: Comprehensive supply update for sell transactions
    async addSupply(tokenAmount) {
      try {
        const currentSupply = await this.getTokenSupply();
        if (!currentSupply) {
          throw new Error('TokenSupply record not found');
        }

        // Convert to integer for BigInt column
        const tokenAmountInt = Math.floor(tokenAmount);

        // Update both remainingSupply AND userSupplyRemaining
        const result = await pool.query(`
          UPDATE token_supply 
          SET 
            "remainingSupply" = "remainingSupply" + $1,
            "userSupplyRemaining" = "userSupplyRemaining" + $1,
            "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [tokenAmountInt, currentSupply.id]);

        console.log('✅ Supply added back:', {
          amount: tokenAmountInt,
          newRemainingSupply: Number(result.rows[0].remainingSupply),
          newUserSupplyRemaining: Number(result.rows[0].userSupplyRemaining)
        });

        return result.rows[0];
      } catch (error) {
        console.error('Error adding supply:', error);
        throw error;
      }
    },

    // LEGACY: Keep for backward compatibility but mark as deprecated
    async updateRemainingSupply(amount, operation = 'deduct') {
      console.warn('⚠️ DEPRECATED: Use deductSupply() or addSupply() instead');
      if (operation === 'deduct') {
        return this.deductSupply(amount);
      } else {
        return this.addSupply(amount);
      }
    },

    // LEGACY: Keep for backward compatibility
    async deductTokens(amount) {
      return this.deductSupply(amount);
    },

    // LEGACY: Keep for backward compatibility
    async addTokens(amount) {
      return this.addSupply(amount);
    },

    // NEW: Validate supply integrity
    async validateSupply() {
      try {
        const supply = await this.getTokenSupply();
        const distributedSupply = await this.calculateDistributedSupply();
        const totalSupply = Number(supply.totalSupply);
        const remainingSupply = Number(supply.remainingSupply);
        const expectedRemaining = totalSupply - distributedSupply;
        
        const isValid = Math.abs(remainingSupply - expectedRemaining) < 1; // Allow for rounding
        
        return {
          isValid,
          totalSupply,
          distributedSupply,
          remainingSupply,
          expectedRemaining,
          discrepancy: remainingSupply - expectedRemaining,
          userSupplyRemaining: Number(supply.userSupplyRemaining),
          adminReserve: Number(supply.adminReserve)
        };
      } catch (error) {
        console.error('Error validating supply:', error);
        throw error;
      }
    }
  },

  // Minting operations
  minting: {
    async mintTokens(adminId, amount) {
      try {
        const client = await pool.connect();
        await client.query('BEGIN');

        try {
          // Get current token supply
          const currentSupply = await client.query('SELECT * FROM token_supply ORDER BY id DESC LIMIT 1');
          if (currentSupply.rows.length === 0) {
            throw new Error('TokenSupply record not found');
          }

          const supply = currentSupply.rows[0];
          
          // Calculate distribution: 20% to user supply, 80% to admin reserve
          const userSupplyAmount = Math.floor(amount * 0.20); // 20% to user supply
          const adminReserveAmount = amount - userSupplyAmount; // 80% to admin reserve
          
          const newTotalSupply = Number(supply.totalSupply) + amount;
          const newRemainingSupply = Number(supply.remainingSupply) + amount;
          const newUserSupplyRemaining = Number(supply.userSupplyRemaining) + userSupplyAmount;
          const newAdminReserve = Number(supply.adminReserve) + adminReserveAmount;

          // Update token supply with distribution
          const updatedSupply = await client.query(`
            UPDATE token_supply 
            SET 
              "totalSupply" = $1, 
              "remainingSupply" = $2, 
              "userSupplyRemaining" = $3,
              "adminReserve" = $4,
              "updatedAt" = NOW()
            WHERE id = $5
            RETURNING *
          `, [newTotalSupply, newRemainingSupply, newUserSupplyRemaining, newAdminReserve, supply.id]);

          // Record mint history
          const { randomUUID } = await import('crypto');
          const mintHistory = await client.query(`
            INSERT INTO mint_history (id, "adminId", amount, "createdAt")
            VALUES ($1, $2, $3, NOW())
            RETURNING *
          `, [randomUUID(), adminId, amount]);

          // Log admin reserve history for the added tokens
          const reserveBefore = Number(supply.adminReserve);
          await databaseHelpers.adminReserveHistory.logReserveTransaction({
            transactionType: 'ADD',
            amount: adminReserveAmount,
            purpose: `Token minting - ${adminReserveAmount.toLocaleString()} tokens added to admin reserve (80% of ${amount.toLocaleString()} minted)`,
            adminId: adminId,
            reserveBefore: reserveBefore,
            reserveAfter: newAdminReserve,
            referenceId: mintHistory.rows[0].id,
            referenceType: 'MINT'
          });

          await client.query('COMMIT');

          console.log('✅ Tokens minted successfully with distribution:', {
            adminId,
            totalAmount: amount,
            userSupplyAmount: userSupplyAmount,
            adminReserveAmount: adminReserveAmount,
            newTotalSupply,
            newRemainingSupply,
            newUserSupplyRemaining,
            newAdminReserve
          });

          return {
            success: true,
            totalSupply: newTotalSupply,
            remainingSupply: newRemainingSupply,
            userSupplyRemaining: newUserSupplyRemaining,
            adminReserve: newAdminReserve,
            distribution: {
              userSupply: userSupplyAmount,
              adminReserve: adminReserveAmount
            },
            mintHistory: mintHistory.rows[0]
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      } catch (error) {
        console.error('Error minting tokens:', error);
        throw error;
      }
    },

    async getMintHistory(adminId = null, limit = 50) {
      try {
        let query = `
          SELECT mh.*, u.name as admin_name, u.email as admin_email
          FROM mint_history mh
          LEFT JOIN users u ON mh."adminId" = u.id
        `;
        const params = [];

        if (adminId) {
          query += ' WHERE mh."adminId" = $1';
          params.push(adminId);
        }

        query += ' ORDER BY mh."createdAt" DESC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting mint history:', error);
        throw error;
      }
    }
  },

  // Token value and inflation calculations (Supply-Based Economy)
  tokenValue: {
    async getCurrentTokenValue() {
      try {
        // Get base value from system settings
        const baseValueSetting = await databaseHelpers.system.getSetting('token_base_value');
        const baseValue = baseValueSetting ? parseFloat(baseValueSetting.value) : 0.0035; // Default to $0.0035 USD

        // Get current token supply
        const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
        if (!tokenSupply) {
          throw new Error('TokenSupply record not found');
        }

        // TOTAL SUPPLY-BASED ECONOMY: Price based on total supply usage
        const userSupplyRemaining = Number(tokenSupply.userSupplyRemaining);
        const adminReserve = Number(tokenSupply.adminReserve);
        const totalSupply = Number(tokenSupply.totalSupply);
        const remainingSupply = Number(tokenSupply.remainingSupply);
        
        // Add safety limits to prevent unrealistic price spikes
        const minSupplyCap = totalSupply * 0.05; // 5% reserve of total supply
        const effectiveRemainingSupply = Math.max(remainingSupply, minSupplyCap);
        
        // Formula: Price based on total supply usage (not just user supply)
        const growthFactor = 1; // Defines how fast price increases
        const supplyUsed = totalSupply - effectiveRemainingSupply;
        const usageRatio = supplyUsed / totalSupply;
        
        // New formula: price = baseValue * (1 + usageRatio * growthFactor)
        const currentTokenValue = baseValue * (1 + usageRatio * growthFactor);
        
        // Calculate legacy inflation factor for compatibility
        const inflationFactor = currentTokenValue / baseValue;
        
        console.log('💰 Token price calculated (TOTAL SUPPLY BASED):', {
          baseValue,
          currentTokenValue,
          inflationFactor: inflationFactor.toFixed(4),
          usageRatio: (usageRatio * 100).toFixed(2) + '%',
          supplyUsed: supplyUsed.toLocaleString(),
          effectiveRemainingSupply: effectiveRemainingSupply.toLocaleString(),
          totalSupply: totalSupply.toLocaleString(),
          growthFactor
        });

        return {
          baseValue,
          totalSupply,
          userSupplyRemaining,
          adminReserve,
          remainingSupply,
          inflationFactor,
          currentTokenValue,
          usagePercentage: ((totalSupply - remainingSupply) / totalSupply) * 100,
          // Total supply calculation details
          growthFactor,
          supplyUsed,
          usageRatio,
          effectiveRemainingSupply,
          minSupplyCap,
          calculatedAt: new Date()
        };
      } catch (error) {
        console.error('Error calculating token value:', error);
        // Return default values if calculation fails
        return {
          baseValue: 0.0035,
          totalSupply: 10000000,
          userSupplyRemaining: 2000000,
          adminReserve: 8000000,
          totalUserSupply: 2000000,
          inflationFactor: 1.0,
          currentTokenValue: 0.0035,
          usagePercentage: 0,
          calculatedAt: new Date(),
          error: error.message
        };
      }
    },

    async setBaseValue(baseValue, adminId = null) {
      try {
        // Update system setting
        await databaseHelpers.system.setSetting(
          'token_base_value', 
          baseValue.toString(), 
          'Base token value in USD for inflation calculations'
        );

        // Log admin action if adminId provided
        if (adminId) {
          await databaseHelpers.adminLog.createAdminLog({
            adminId,
            action: 'UPDATE_BASE_VALUE',
            targetType: 'SYSTEM_SETTING',
            targetId: 'token_base_value',
            details: `Updated base token value to $${baseValue}`
          });
        }

        console.log('✅ Base token value updated:', baseValue);
        return { success: true, baseValue };
      } catch (error) {
        console.error('Error setting base value:', error);
        throw error;
      }
    },

    async calculateInflationImpact(amount) {
      try {
        const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
        const usdValue = amount * tokenValue.currentTokenValue;
        
        return {
          tokenAmount: amount,
          usdValue,
          tokenValue: tokenValue.currentTokenValue,
          inflationFactor: tokenValue.inflationFactor
        };
      } catch (error) {
        console.error('Error calculating inflation impact:', error);
        throw error;
      }
    }
  },

  // Admin Supply Transfer operations (for controlled economy)
  adminSupplyTransfer: {
    async transferToUserSupply(adminId, amount, reason = null) {
      try {
        // Get current token supply
        const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
        if (!tokenSupply) {
          throw new Error('Token supply not found');
        }

        const currentReserve = Number(tokenSupply.adminReserve);
        const currentUserSupply = Number(tokenSupply.userSupplyRemaining);

        // Validate admin has enough reserve
        if (currentReserve < amount) {
          throw new Error(`Insufficient admin reserve. Available: ${currentReserve}, Requested: ${amount}`);
        }

        // Begin transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Update token supply
          const updateResult = await client.query(`
            UPDATE token_supply 
            SET 
              "adminReserve" = "adminReserve" - $1,
              "userSupplyRemaining" = "userSupplyRemaining" + $1,
              "updatedAt" = NOW()
            WHERE id = $2
            RETURNING *
          `, [amount, tokenSupply.id]);

          const updatedSupply = updateResult.rows[0];

          // Create transfer record
          const { randomUUID } = await import('crypto');
          const transferId = randomUUID();
          const transferResult = await client.query(`
            INSERT INTO admin_supply_transfers 
            (id, "adminId", "tokenSupplyId", amount, "fromReserve", "toUserSupply", reason, "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *
          `, [transferId, adminId, tokenSupply.id, amount, currentReserve, currentUserSupply + amount, reason]);

          // Log admin action
          await databaseHelpers.adminLog.createAdminLog({
            adminId,
            action: 'TRANSFER_SUPPLY',
            targetType: 'TOKEN_SUPPLY',
            targetId: tokenSupply.id.toString(),
            details: `Transferred ${amount} Von from admin reserve to user supply. Reason: ${reason || 'None'}`
          });

          // Log admin reserve history
          await databaseHelpers.adminReserveHistory.logReserveTransaction({
            transactionType: 'TRANSFER_OUT',
            amount: -amount, // Negative for removal
            purpose: reason || 'Transfer from admin reserve to user supply',
            adminId: adminId,
            reserveBefore: currentReserve,
            reserveAfter: Number(updatedSupply.adminReserve),
            referenceId: transferId,
            referenceType: 'SUPPLY_TRANSFER'
          });

          await client.query('COMMIT');

          console.log('✅ Supply transferred successfully:', {
            amount,
            newReserve: updatedSupply.adminReserve,
            newUserSupply: updatedSupply.userSupplyRemaining
          });

          return {
            success: true,
            transfer: transferResult.rows[0],
            updatedSupply: updatedSupply
          };

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      } catch (error) {
        console.error('Error transferring supply:', error);
        throw error;
      }
    },

    async getTransferHistory(adminId = null, limit = 50) {
      try {
        let query = `
          SELECT ast.*, u.name as admin_name, u.email as admin_email
          FROM admin_supply_transfers ast
          LEFT JOIN users u ON ast."adminId" = u.id
        `;
        const params = [];

        if (adminId) {
          query += ' WHERE ast."adminId" = $1';
          params.push(adminId);
        }

        query += ' ORDER BY ast."createdAt" DESC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting transfer history:', error);
        throw error;
      }
    },

    async getTransferStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total_transfers,
            SUM(amount) as total_transferred,
            MIN("createdAt") as first_transfer,
            MAX("createdAt") as last_transfer
          FROM admin_supply_transfers
        `);
        return result.rows[0];
      } catch (error) {
        console.error('Error getting transfer stats:', error);
        throw error;
      }
    }
  },

  // Admin Reserve History Helper
  adminReserveHistory: {
    /**
     * Get or create SYSTEM user for automated transactions
     * @returns {Promise<string>} SYSTEM user ID
     */
    async getOrCreateSystemUser() {
      try {
        // Try to find existing SYSTEM user by email
        let systemUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          ['system@automated.von']
        );

        if (systemUser.rows.length > 0) {
          return systemUser.rows[0].id;
        }

        // SYSTEM user doesn't exist, create it
        const { randomUUID } = await import('crypto');
        const bcrypt = await import('bcryptjs');
        const systemUserId = randomUUID();
        const hashedPassword = await bcrypt.hash('SYSTEM_USER_NO_LOGIN', 12);

        await pool.query(`
          INSERT INTO users (id, email, name, password, "emailVerified", role, "isAdmin", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          systemUserId,
          'system@automated.von',
          'System (Automated)',
          hashedPassword,
          true,
          'ADMIN',
          true
        ]);

        console.log('✅ SYSTEM user created for automated transactions:', systemUserId);
        return systemUserId;
      } catch (error) {
        console.error('❌ Error getting/creating SYSTEM user:', error);
        throw error;
      }
    },

    /**
     * Log an admin reserve transaction
     * @param {Object} historyData - History data object
     * @param {string} historyData.transactionType - Type of transaction (ADD, REMOVE, TRANSFER_OUT, STAKING_REWARD, MANUAL_ADJUST)
     * @param {number} historyData.amount - Amount (positive for adds, negative for removes)
     * @param {string} historyData.purpose - Purpose/reason
     * @param {string} historyData.userId - User involved (optional)
     * @param {string} historyData.adminId - Admin who performed action (or 'SYSTEM' for automated)
     * @param {number} historyData.reserveBefore - Reserve before transaction
     * @param {number} historyData.reserveAfter - Reserve after transaction
     * @param {string} historyData.referenceId - Reference ID (optional)
     * @param {string} historyData.referenceType - Reference type (optional)
     */
    async logReserveTransaction(historyData) {
      try {
        const {
          transactionType,
          amount,
          purpose = null,
          userId = null,
          adminId,
          reserveBefore,
          reserveAfter,
          referenceId = null,
          referenceType = null
        } = historyData;

        // Validate required fields
        if (!transactionType || amount === undefined || amount === null || reserveBefore === undefined || reserveAfter === undefined) {
          console.error('❌ Invalid reserve history data:', {
            transactionType,
            amount,
            adminId,
            reserveBefore,
            reserveAfter
          });
          throw new Error('Missing required fields for reserve history logging');
        }

        // Handle SYSTEM adminId - get or create SYSTEM user
        let finalAdminId = adminId;
        if (!finalAdminId || finalAdminId === 'SYSTEM') {
          finalAdminId = await this.getOrCreateSystemUser();
          console.log('🔧 Using SYSTEM user for automated transaction:', finalAdminId);
        }

        // Check if table exists first
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_reserve_history'
          );
        `);

        if (!tableCheck.rows[0].exists) {
          console.error('❌ admin_reserve_history table does not exist. Please run migration.');
          throw new Error('admin_reserve_history table does not exist');
        }

        const { randomUUID } = await import('crypto');
        const historyId = randomUUID();

        console.log('📝 Inserting admin reserve history:', {
          transactionType,
          amount,
          userId: userId || 'N/A',
          adminId: finalAdminId,
          reserveBefore,
          reserveAfter,
          referenceId: referenceId || 'N/A'
        });

        const result = await pool.query(`
          INSERT INTO admin_reserve_history (
            id, "transactionType", amount, purpose, "userId", "adminId",
            "reserveBefore", "reserveAfter", "referenceId", "referenceType", "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *
        `, [
          historyId,
          transactionType,
          amount,
          purpose,
          userId,
          finalAdminId,
          reserveBefore,
          reserveAfter,
          referenceId,
          referenceType
        ]);

        if (!result.rows || result.rows.length === 0) {
          throw new Error('Failed to insert reserve history record');
        }

        console.log('✅ Admin reserve history logged successfully:', {
          id: historyId,
          type: transactionType,
          amount,
          userId: userId || 'N/A',
          adminId: finalAdminId,
          reserveBefore,
          reserveAfter,
          referenceId: referenceId || 'N/A'
        });

        return result.rows[0];
      } catch (error) {
        console.error('❌ Error logging admin reserve history:', {
          error: error.message,
          stack: error.stack,
          code: error.code,
          constraint: error.constraint,
          detail: error.detail,
          historyData: {
            transactionType: historyData?.transactionType,
            amount: historyData?.amount,
            userId: historyData?.userId,
            adminId: historyData?.adminId
          }
        });
        // Re-throw error so retry logic can catch it
        throw error;
      }
    },

    /**
     * Get admin reserve history with filters
     * @param {Object} filters - Filter options
     * @param {string} filters.transactionType - Filter by transaction type
     * @param {string} filters.userId - Filter by user ID
     * @param {string} filters.adminId - Filter by admin ID
     * @param {string} filters.startDate - Start date (ISO string)
     * @param {string} filters.endDate - End date (ISO string)
     * @param {number} filters.limit - Limit results
     * @param {number} filters.offset - Offset for pagination
     */
    async getReserveHistory(filters = {}) {
      try {
        const {
          transactionType = null,
          userId = null,
          adminId = null,
          startDate = null,
          endDate = null,
          limit = 100,
          offset = 0
        } = filters;

        let query = `
          SELECT 
            arh.*,
            admin_user.name as admin_name,
            admin_user.email as admin_email,
            target_user.name as user_name,
            target_user.email as user_email
          FROM admin_reserve_history arh
          LEFT JOIN users admin_user ON arh."adminId" = admin_user.id
          LEFT JOIN users target_user ON arh."userId" = target_user.id
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (transactionType) {
          paramCount++;
          query += ` AND arh."transactionType" = $${paramCount}`;
          params.push(transactionType);
        }

        if (userId) {
          paramCount++;
          query += ` AND arh."userId" = $${paramCount}`;
          params.push(userId);
        }

        if (adminId) {
          paramCount++;
          query += ` AND arh."adminId" = $${paramCount}`;
          params.push(adminId);
        }

        if (startDate) {
          paramCount++;
          query += ` AND arh."createdAt" >= $${paramCount}`;
          params.push(startDate);
        }

        if (endDate) {
          paramCount++;
          query += ` AND arh."createdAt" <= $${paramCount}`;
          params.push(endDate);
        }

        query += ` ORDER BY arh."createdAt" DESC`;

        // Add limit and offset
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting admin reserve history:', error);
        throw error;
      }
    },

    /**
     * Get statistics for admin reserve history
     */
    async getReserveHistoryStats(filters = {}) {
      try {
        const {
          startDate = null,
          endDate = null,
          transactionType = null
        } = filters;

        let query = `
          SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_added,
            SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_removed,
            MIN("createdAt") as first_transaction,
            MAX("createdAt") as last_transaction,
            COUNT(DISTINCT "adminId") as unique_admins,
            COUNT(DISTINCT "userId") as unique_users
          FROM admin_reserve_history
          WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (transactionType) {
          paramCount++;
          query += ` AND "transactionType" = $${paramCount}`;
          params.push(transactionType);
        }

        if (startDate) {
          paramCount++;
          query += ` AND "createdAt" >= $${paramCount}`;
          params.push(startDate);
        }

        if (endDate) {
          paramCount++;
          query += ` AND "createdAt" <= $${paramCount}`;
          params.push(endDate);
        }

        const result = await pool.query(query, params);
        return result.rows[0];
      } catch (error) {
        console.error('Error getting reserve history stats:', error);
        throw error;
      }
    },

    /**
     * Deduct staking reward from admin reserve and log history (atomic operation)
     * This is the proper way to handle staking rewards - updates reserve AND logs history
     * @param {Object} rewardData - Reward data object
     * @param {number} rewardData.amount - Amount to deduct (positive value)
     * @param {string} rewardData.userId - User receiving the reward
     * @param {string} rewardData.stakingId - Staking ID (for reference)
     * @param {string} rewardData.purpose - Purpose description
     * @param {string} rewardData.adminId - Admin ID (defaults to SYSTEM)
     * @param {Object} rewardData.client - Optional: existing database client (for use within transactions)
     * @returns {Promise<Object>} Updated token supply and history entry
     */
    async deductStakingReward(rewardData) {
      const {
        amount,
        userId = null,
        stakingId = null,
        purpose = null,
        adminId = 'SYSTEM',
        client: providedClient = null
      } = rewardData;

      if (!amount || amount <= 0) {
        throw new Error('Reward amount must be positive');
      }

      const useOwnTransaction = !providedClient;
      const client = providedClient || await pool.connect();

      try {
        if (useOwnTransaction) {
          await client.query('BEGIN');
        }

        // Get current token supply with FOR UPDATE lock
        const tokenSupplyResult = await client.query(
          'SELECT * FROM token_supply ORDER BY id DESC LIMIT 1 FOR UPDATE'
        );

        if (!tokenSupplyResult.rows || tokenSupplyResult.rows.length === 0) {
          if (useOwnTransaction) {
            await client.query('ROLLBACK');
          }
          throw new Error('Token supply not found');
        }

        const tokenSupply = tokenSupplyResult.rows[0];
        const reserveBefore = Number(tokenSupply.adminReserve);
        const reserveAfter = reserveBefore - amount;

        if (reserveAfter < 0) {
          if (useOwnTransaction) {
            await client.query('ROLLBACK');
          }
          throw new Error(`Insufficient admin reserve. Available: ${reserveBefore}, Required: ${amount}`);
        }

        // Update admin reserve
        const updateResult = await client.query(`
          UPDATE token_supply 
          SET "adminReserve" = "adminReserve" - $1::DECIMAL(30,8), "updatedAt" = NOW()
          WHERE id = $2
          RETURNING *
        `, [String(amount), tokenSupply.id]);

        if (!updateResult.rows || updateResult.rows.length === 0) {
          if (useOwnTransaction) {
            await client.query('ROLLBACK');
          }
          throw new Error('Failed to update admin reserve');
        }

        const updatedTokenSupply = updateResult.rows[0];

        // Get or create SYSTEM user if needed
        let finalAdminId = adminId;
        if (adminId === 'SYSTEM' || !adminId) {
          finalAdminId = await this.getOrCreateSystemUser();
        }

        // Log history entry
        const { randomUUID } = await import('crypto');
        const historyId = randomUUID();
        const historyPurpose = purpose || `Staking reward payout${stakingId ? ` for staking ${stakingId}` : ''}`;

        const historyResult = await client.query(`
          INSERT INTO admin_reserve_history (
            id, "transactionType", amount, purpose, "userId", "adminId",
            "reserveBefore", "reserveAfter", "referenceId", "referenceType", "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *
        `, [
          historyId,
          'STAKING_REWARD',
          -amount, // Negative for removal
          historyPurpose,
          userId,
          finalAdminId,
          reserveBefore,
          reserveAfter,
          stakingId,
          'STAKING_REWARD'
        ]);

        if (useOwnTransaction) {
          await client.query('COMMIT');
        }

        console.log('✅ Staking reward deducted from reserve:', {
          amount,
          userId: userId || 'N/A',
          stakingId: stakingId || 'N/A',
          reserveBefore,
          reserveAfter,
          historyId: historyResult.rows[0].id
        });

        return {
          tokenSupply: updatedTokenSupply,
          historyEntry: historyResult.rows[0]
        };
      } catch (error) {
        if (useOwnTransaction) {
          await client.query('ROLLBACK');
        }
        console.error('❌ Error deducting staking reward:', {
          error: error.message,
          code: error.code,
          constraint: error.constraint,
          detail: error.detail
        });
        throw error;
      } finally {
        if (useOwnTransaction && client) {
          client.release();
        }
      }
    },

    /**
     * Deduct wallet fee and log in admin reserve history (atomic operation)
     * Similar to deductStakingReward but for wallet fees
     * Note: Wallet fees are USD, but we record them in admin_reserve_history for tracking
     * @param {Object} feeData - Fee data object
     * @param {number} feeData.amount - USD amount (e.g., 2 for $2)
     * @param {string} feeData.userId - User who paid the fee
     * @param {string} feeData.purpose - Purpose description
     * @param {string} feeData.adminId - Admin ID (defaults to SYSTEM)
     * @param {Object} feeData.client - Optional: existing database client (for use within transactions)
     * @returns {Promise<Object>} History entry
     */
    async deductWalletFee(feeData) {
      const {
        amount,
        userId = null,
        purpose = null,
        adminId = 'SYSTEM',
        client: providedClient = null
      } = feeData;

      if (!amount || amount <= 0) {
        throw new Error('Wallet fee amount must be positive');
      }

      const useOwnTransaction = !providedClient;
      const client = providedClient || await pool.connect();

      try {
        if (useOwnTransaction) {
          await client.query('BEGIN');
        }

        // Get current token supply with FOR UPDATE lock (for consistency with deductStakingReward pattern)
        const tokenSupplyResult = await client.query(
          'SELECT * FROM token_supply ORDER BY id DESC LIMIT 1 FOR UPDATE'
        );

        if (!tokenSupplyResult.rows || tokenSupplyResult.rows.length === 0) {
          if (useOwnTransaction) {
            await client.query('ROLLBACK');
          }
          throw new Error('Token supply not found');
        }

        const tokenSupply = tokenSupplyResult.rows[0];
        const reserveBefore = Number(tokenSupply.adminReserve);
        
        // Note: Wallet fees are USD, not tokens, so we don't actually deduct from reserve
        // But we record it in history for tracking purposes
        const reserveAfter = reserveBefore; // No change to token reserve

        // Get or create SYSTEM user if needed
        let finalAdminId = adminId;
        if (adminId === 'SYSTEM' || !adminId) {
          finalAdminId = await this.getOrCreateSystemUser();
        }

        // Log history entry
        const { randomUUID } = await import('crypto');
        const historyId = randomUUID();
        const historyPurpose = purpose || `Wallet fee payment for user ${userId || 'N/A'}`;

        const historyResult = await client.query(`
          INSERT INTO admin_reserve_history (
            id, "transactionType", amount, purpose, "userId", "adminId",
            "reserveBefore", "reserveAfter", "referenceId", "referenceType", "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *
        `, [
          historyId,
          'WALLET_FEE',
          -amount, // Negative for fee (USD amount, recorded for tracking)
          historyPurpose,
          userId,
          finalAdminId,
          reserveBefore,
          reserveAfter,
          userId, // Reference ID is the user who paid the fee
          'WALLET_FEE'
        ]);

        if (useOwnTransaction) {
          await client.query('COMMIT');
        }

        console.log('✅ Wallet fee recorded in reserve history:', {
          amount,
          userId: userId || 'N/A',
          reserveBefore,
          reserveAfter,
          historyId: historyResult.rows[0].id
        });

        return {
          historyEntry: historyResult.rows[0]
        };
      } catch (error) {
        if (useOwnTransaction) {
          await client.query('ROLLBACK');
        }
        console.error('❌ Error recording wallet fee:', {
          error: error.message,
          code: error.code,
          constraint: error.constraint,
          detail: error.detail
        });
        throw error;
      } finally {
        if (useOwnTransaction && client) {
          client.release();
        }
      }
    }
  },

  // Admin Log Helper
  adminLog: {
    async createAdminLog(logData) {
      try {
        const { adminId, action, targetType, targetId, details, ipAddress, userAgent } = logData;
        const { randomUUID } = await import('crypto');
        
        const result = await pool.query(`
          INSERT INTO admin_logs (id, "adminId", action, "targetType", "targetId", details, "ipAddress", "userAgent", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `, [
          randomUUID(),
          adminId,
          action,
          targetType,
          targetId,
          details,
          ipAddress,
          userAgent
        ]);

        console.log('✅ Admin log created:', { action, adminId, targetType });
        return result.rows[0];
      } catch (error) {
        console.error('❌ Error creating admin log:', error);
        // Don't throw error - admin logging should not break the main operation
        return null;
      }
    },

    async getAdminLogs(adminId = null, limit = 50) {
      try {
        let query = `
          SELECT al.*, u.name as admin_name, u.email as admin_email
          FROM admin_logs al
          LEFT JOIN users u ON al."adminId" = u.id
        `;
        const params = [];
        
        if (adminId) {
          query += ` WHERE al."adminId" = $1`;
          params.push(adminId);
        }
        
        query += ` ORDER BY al."createdAt" DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting admin logs:', error);
        throw error;
      }
    }
  },

  // Fee Configuration operations
  feeConfig: {
    async getFeeConfig() {
      try {
        const result = await pool.query('SELECT * FROM fee_config ORDER BY "createdAt" DESC LIMIT 1');
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting fee config:', error);
        return null;
      }
    },

    async createFeeConfig(configData) {
      try {
        const { transactionFeeRate = 0.05, feeReceiverId = 'ADMIN_WALLET', isActive = true } = configData;
        const { randomUUID } = await import('crypto');
        
        const result = await pool.query(`
          INSERT INTO fee_config (id, "transactionFeeRate", "feeReceiverId", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `, [randomUUID(), transactionFeeRate, feeReceiverId, isActive]);
        
        console.log('✅ Fee config created:', result.rows[0]);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating fee config:', error);
        throw error;
      }
    },

    async updateFeeConfig(configData) {
      try {
        const { transactionFeeRate, feeReceiverId, isActive } = configData;
        
        // Get current config
        const currentConfig = await this.getFeeConfig();
        
        if (currentConfig) {
          // Update existing config
          const result = await pool.query(`
            UPDATE fee_config 
            SET "transactionFeeRate" = $1, "feeReceiverId" = $2, "isActive" = $3, "updatedAt" = NOW()
            WHERE id = $4
            RETURNING *
          `, [transactionFeeRate, feeReceiverId, isActive, currentConfig.id]);
          
          console.log('✅ Fee config updated:', result.rows[0]);
          return result.rows[0];
        } else {
          // Create new config
          return await this.createFeeConfig(configData);
        }
      } catch (error) {
        console.error('Error updating fee config:', error);
        throw error;
      }
    }
  },

  // Enhanced transaction operations with fee support
  transactionWithFees: {
    async createTransactionWithFee(transactionData) {
      try {
        const { userId, type, amount, currency = 'USD', status = 'PENDING', description = null } = transactionData;
        
        // Calculate fee (5% default)
        const feeRate = 0.05;
        const feeAmount = amount * feeRate;
        const netAmount = amount - feeAmount;
        
        const { randomUUID } = await import('crypto');
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO transactions (id, "userId", type, amount, currency, status, description, "feeAmount", "netAmount", "feeReceiverId", "transactionType", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING *
        `, [id, userId, type, amount, currency, status, description, feeAmount, netAmount, 'ADMIN_WALLET', type]);
        
        console.log('✅ Transaction with fee created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating transaction with fee:', error);
        throw error;
      }
    },

    async getFeeStats() {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as totalTransactionsWithFees,
            COALESCE(SUM("feeAmount"), 0) as totalFeesCollected,
            COALESCE(AVG("feeAmount"), 0) as averageFeeAmount,
            MAX("createdAt") as lastFeeCollection
          FROM transactions 
          WHERE "feeAmount" > 0
        `);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting fee stats:', error);
        return {
          totalTransactionsWithFees: 0,
          totalFeesCollected: 0,
          averageFeeAmount: 0,
          lastFeeCollection: null
        };
      }
    }
  },

  // Deposit addresses operations
  depositAddresses: {
    async getDepositAddresses() {
      let client;
      try {
        client = await pool.connect();
        
        const result = await client.query(`
          SELECT * FROM deposit_addresses 
          ORDER BY id DESC 
          LIMIT 1
        `);
        
        return result.rows[0] || { bep20: null, trc20: null };
      } catch (error) {
        console.error('Error fetching deposit addresses:', error);
        throw error;
      } finally {
        if (client) client.release();
      }
    },

    async updateDepositAddresses(addresses) {
      let client;
      try {
        const { bep20, trc20 } = addresses;
        
        client = await pool.connect();
        
        // Check if a record exists
        const existingResult = await client.query(`
          SELECT id FROM deposit_addresses 
          ORDER BY id DESC 
          LIMIT 1
        `);
        
        if (existingResult.rows.length > 0) {
          // Update existing record
          const result = await client.query(`
            UPDATE deposit_addresses 
            SET bep20 = $1, trc20 = $2, "updatedAt" = NOW()
            WHERE id = $3
            RETURNING *
          `, [bep20, trc20, existingResult.rows[0].id]);
          
          return result.rows[0];
        } else {
          // Create new record
          const result = await client.query(`
            INSERT INTO deposit_addresses (bep20, trc20, "updatedAt")
            VALUES ($1, $2, NOW())
            RETURNING *
          `, [bep20, trc20]);
          
          return result.rows[0];
        }
      } catch (error) {
        console.error('Error updating deposit addresses:', error);
        throw error;
      } finally {
        if (client) client.release();
      }
    }
  },

  // Password Reset Helper
  // Security: OTP should be hashed (bcrypt) before calling createPasswordReset
  // Default expiry: 10 minutes
  // Rate-limit forgot-password endpoint to prevent abuse
  passwordReset: {
    /**
     * Create a new password reset record
     * @param {Object} data - Reset data
     * @param {string} data.email - User email
     * @param {string} data.otpHash - Hashed OTP (use bcrypt before calling)
     * @param {Date} data.expiresAt - Expiration timestamp
     * @returns {Promise<Object>} Created password reset record
     */
    async createPasswordReset({ email, otpHash, expiresAt }) {
      try {
        const { randomUUID } = await import('crypto');
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO password_resets (id, email, "hashedOtp", used, expiry, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, false, $4, NOW(), NOW())
          RETURNING id, email, "hashedOtp" as "otpHash", used, expiry as "expiresAt", "createdAt", "updatedAt"
        `, [id, email, otpHash, expiresAt]);
        
        console.log('✅ Password reset created:', { id, email, expiresAt });
        return result.rows[0];
      } catch (error) {
        console.error('Error creating password reset:', error);
        throw error;
      }
    },

    /**
     * Get the most recent unused password reset for an email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} Password reset record or null
     */
    async getPasswordResetByEmail(email) {
      try {
        const result = await pool.query(`
          SELECT id, email, "hashedOtp" as "otpHash", used, expiry as "expiresAt", "createdAt", "updatedAt"
          FROM password_resets
          WHERE email = $1 AND used = false
          ORDER BY "createdAt" DESC
          LIMIT 1
        `, [email]);
        
        if (result.rows.length === 0) {
          console.log('No unused password reset found for:', email);
          return null;
        }
        
        console.log('✅ Password reset found:', { id: result.rows[0].id, email });
        return result.rows[0];
      } catch (error) {
        console.error('Error getting password reset by email:', error);
        throw error;
      }
    },

    /**
     * Get a specific password reset by ID
     * @param {string} id - Reset ID
     * @returns {Promise<Object|null>} Password reset record or null
     */
    async getPasswordResetById(id) {
      try {
        const result = await pool.query(`
          SELECT id, email, "hashedOtp" as "otpHash", used, expiry as "expiresAt", "createdAt", "updatedAt"
          FROM password_resets
          WHERE id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
          console.log('Password reset not found:', id);
          return null;
        }
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting password reset by ID:', error);
        throw error;
      }
    },

    /**
     * Mark a password reset as used
     * @param {string} id - Reset ID
     * @returns {Promise<Object>} Updated password reset record
     */
    async markPasswordResetAsUsed(id) {
      try {
        const result = await pool.query(`
          UPDATE password_resets
          SET used = true, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING id, email, "hashedOtp" as "otpHash", used, expiry as "expiresAt", "createdAt", "updatedAt"
        `, [id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Password reset not found: ${id}`);
        }
        
        console.log('✅ Password reset marked as used:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error marking password reset as used:', error);
        throw error;
      }
    },

    /**
     * Get the latest OTP for an email (for sign-in OTP verification)
     * @param {string} email - User email
     * @returns {Promise<Object|null>} Latest OTP record or null
     */
    async getLatestOTPByEmail(email) {
      try {
        const result = await pool.query(`
          SELECT id, email, "hashedOtp" as "otpHash", used, expiry as "expiresAt", "createdAt", "updatedAt"
          FROM password_resets
          WHERE email = $1 AND used = false
          ORDER BY "createdAt" DESC
          LIMIT 1
        `, [email]);
        
        if (result.rows.length === 0) {
          console.log('No unused OTP found for:', email);
          return null;
        }
        
        console.log('✅ Latest OTP found:', { id: result.rows[0].id, email });
        return result.rows[0];
      } catch (error) {
        console.error('Error getting latest OTP by email:', error);
        throw error;
      }
    },

    /**
     * Delete a password reset record (for cleanup after successful verification)
     * @param {string} id - Reset ID
     * @returns {Promise<boolean>} Success status
     */
    async deletePasswordReset(id) {
      try {
        const result = await pool.query(`
          DELETE FROM password_resets
          WHERE id = $1
        `, [id]);
        
        console.log('✅ Password reset deleted:', id);
        return true;
      } catch (error) {
        console.error('Error deleting password reset:', error);
        throw error;
      }
    },

    /**
     * Cleanup expired password resets
     * Deletes all password reset records where expiresAt <= NOW() and used = false
     * @returns {Promise<Object>} Object with count of deleted records
     */
    async cleanupExpiredResets() {
      try {
        const result = await pool.query(`
          DELETE FROM password_resets
          WHERE expiry <= NOW() AND used = false
          RETURNING id
        `);
        
        const count = result.rowCount || 0;
        
        if (count > 0) {
          console.log(`✅ Cleaned up ${count} expired password resets`);
        }
        
        return { count };
      } catch (error) {
        console.error('Error cleaning up expired password resets:', error);
        throw error;
      }
    }
  },

  /**
   * Wallet Fee Management
   */
  walletFee: {
    /**
     * Get wallet fee status for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Wallet fee status
     */
    async getWalletFeeStatus(userId) {
      try {
        // Get user wallet fee fields and first deposit amount
        const result = await pool.query(`
          SELECT 
            u."walletFeeDueAt", 
            u."walletFeeProcessed", 
            u."walletFeeWaived", 
            u."walletFeeLocked", 
            u."walletFeeProcessedAt",
            u."walletFeeApplied",
            u."firstDepositAmount",
            u."createdAt"
          FROM users u
          WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
          throw new Error(`User ${userId} not found`);
        }

        const user = result.rows[0];
        const accountCreatedAt = new Date(user.createdAt);
        const thirtyDaysLater = new Date(accountCreatedAt);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        // Count valid referrals (only where referred user has deposited or staked)
        const referralCountResult = await pool.query(`
          SELECT COUNT(DISTINCT r.id) as referral_count
          FROM referrals r
          WHERE r."referrerId" = $1
            AND r."createdAt" >= $2
            AND r."createdAt" <= $3
            AND (
              -- Check if referred user has made a completed deposit
              EXISTS (
                SELECT 1 
                FROM transactions t
                WHERE t."userId" = r."referredId"
                  AND t.type = 'DEPOSIT'
                  AND t.status = 'COMPLETED'
                  AND t."createdAt" <= $3
              )
              OR
              -- Check if referred user has created a staking
              EXISTS (
                SELECT 1
                FROM staking s
                WHERE s."userId" = r."referredId"
                  AND s."createdAt" <= $3
              )
            )
        `, [userId, accountCreatedAt, thirtyDaysLater]);

        const referralCount = parseInt(referralCountResult.rows[0]?.referral_count || 0);

        return {
          ...user,
          referralCount
        };
      } catch (error) {
        console.error('Error getting wallet fee status:', error);
        throw error;
      }
    },

    /**
     * Update wallet fee status
     * @param {string} userId - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    async updateWalletFeeStatus(userId, updates) {
      try {
        const fields = [];
        const values = [];
        let index = 1;

        if (updates.walletFeeDueAt !== undefined) {
          fields.push(`"walletFeeDueAt" = $${index++}`);
          values.push(updates.walletFeeDueAt);
        }
        if (updates.walletFeeProcessed !== undefined) {
          fields.push(`"walletFeeProcessed" = $${index++}`);
          values.push(updates.walletFeeProcessed);
        }
        if (updates.walletFeeWaived !== undefined) {
          fields.push(`"walletFeeWaived" = $${index++}`);
          values.push(updates.walletFeeWaived);
        }
        if (updates.walletFeeLocked !== undefined) {
          fields.push(`"walletFeeLocked" = $${index++}`);
          values.push(updates.walletFeeLocked);
        }
        if (updates.walletFeeProcessedAt !== undefined) {
          fields.push(`"walletFeeProcessedAt" = $${index++}`);
          values.push(updates.walletFeeProcessedAt);
        }

        fields.push(`"updatedAt" = NOW()`);
        values.push(userId);

        const query = `
          UPDATE users 
          SET ${fields.join(', ')}
          WHERE id = $${index}
          RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error updating wallet fee status:', error);
        throw error;
      }
    },

    /**
     * Get all users with due wallet fees
     * @returns {Promise<Array>} Users with due wallet fees
     */
    async getUsersWithDueWalletFees() {
      try {
        const result = await pool.query(`
          SELECT id, email, "walletFeeDueAt", "createdAt"
          FROM users
          WHERE "walletFeeDueAt" <= NOW()
            AND "walletFeeProcessed" = false
          ORDER BY "walletFeeDueAt" ASC
        `);

        return result.rows;
      } catch (error) {
        console.error('Error getting users with due wallet fees:', error);
        throw error;
      }
    },

    /**
     * Check if wallet is locked for a user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if wallet is locked
     */
    async isWalletLocked(userId) {
      try {
        const result = await pool.query(`
          SELECT "walletFeeLocked"
          FROM users
          WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
          return false;
        }

        return result.rows[0].walletFeeLocked || false;
      } catch (error) {
        console.error('Error checking wallet lock status:', error);
        throw error;
      }
    }
  },

  // Order operations for trading
  order: {
    async createOrder(orderData) {
      try {
        const { userId, orderType, priceType, amount, tokenAmount, limitPrice } = orderData;
        
        const result = await pool.query(`
          INSERT INTO orders (id, "userId", "orderType", "priceType", amount, "tokenAmount", "limitPrice", status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
          RETURNING *
        `, [randomUUID(), userId, orderType, priceType, amount, tokenAmount, limitPrice]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating order:', error);
        throw error;
      }
    },

    async getOrderById(orderId) {
      try {
        const result = await pool.query(`
          SELECT * FROM orders WHERE id = $1
        `, [orderId]);
        
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error getting order:', error);
        throw error;
      }
    },

    async getUserOrders(userId, status = null) {
      try {
        let query = `
          SELECT * FROM orders 
          WHERE "userId" = $1
        `;
        
        const params = [userId];
        
        if (status) {
          query += ` AND status = $2`;
          params.push(status);
        }
        
        query += ` ORDER BY "createdAt" DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
      }
    },

    async getPendingLimitOrders() {
      try {
        const result = await pool.query(`
          SELECT * FROM orders 
          WHERE status = 'PENDING' 
          AND "priceType" = 'LIMIT'
          ORDER BY "createdAt" ASC
        `);
        
        return result.rows;
      } catch (error) {
        console.error('Error getting pending limit orders:', error);
        throw error;
      }
    },

    async updateOrderStatus(orderId, status, executedAt = null) {
      try {
        const updates = [`status = $2`, `"updatedAt" = NOW()`];
        const params = [orderId, status];
        
        if (executedAt) {
          updates.push(`"executedAt" = $3`);
          params.push(executedAt);
        }
        
        if (status === 'CANCELED') {
          updates.push(`"canceledAt" = NOW()`);
        }
        
        const result = await pool.query(`
          UPDATE orders 
          SET ${updates.join(', ')}
          WHERE id = $1
          RETURNING *
        `, params);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
      }
    },

    async cancelOrder(orderId) {
      try {
        const result = await pool.query(`
          UPDATE orders 
          SET status = 'CANCELED', "canceledAt" = NOW(), "updatedAt" = NOW()
          WHERE id = $1 AND status IN ('PENDING', 'PARTIAL')
          RETURNING *
        `, [orderId]);
        
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error canceling order:', error);
        throw error;
      }
    },

    async updateFilledAmount(orderId, filledAmount) {
      try {
        const result = await pool.query(`
          UPDATE orders 
          SET "filledAmount" = $2, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `, [orderId, filledAmount]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating filled amount:', error);
        throw error;
      }
    },

    async getOrderStats(userId) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
            COUNT(*) FILTER (WHERE status = 'FILLED') as filled_orders,
            COUNT(*) FILTER (WHERE status = 'CANCELED') as canceled_orders,
            COUNT(*) as total_orders
          FROM orders
          WHERE "userId" = $1
        `, [userId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting order stats:', error);
        throw error;
      }
    }
  }
};

export default databaseHelpers;