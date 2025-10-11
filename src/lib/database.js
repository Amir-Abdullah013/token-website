import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for Supabase compatibility
  max: 10, // Reduce max connections
  idleTimeoutMillis: 10000, // Reduce idle timeout
  connectionTimeoutMillis: 5000, // Increase connection timeout
  acquireTimeoutMillis: 10000, // Add acquire timeout
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize connection
testConnection();

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
        const { email, password, name, emailVerified = false, role = 'USER' } = userData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO users (id, email, password, name, "emailVerified", role, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *
        `, [id, email, password, name, emailVerified, role]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating user:', error);
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
    }
  },

  // Token stats operations
  tokenStats: {
    async getTokenStats() {
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
        console.error('Error getting token stats:', error);
        return {
          totalTokens: 100000000,
          totalInvestment: 350000,
          currentPrice: 0.0035,
          lastUpdated: new Date(),
          createdAt: new Date()
        };
      }
    },

    async getCurrentPrice() {
      try {
        const stats = await this.getTokenStats();
        return stats.currentPrice;
      } catch (error) {
        console.error('Error getting current price:', error);
        return 0.0035;
      }
    },

    async updateTokenStats(investmentChange) {
      try {
        const result = await pool.query(`
          UPDATE "TokenStats" 
          SET "totalInvestment" = "totalInvestment" + $1,
              "currentPrice" = ("totalInvestment" + $1) / "totalTokens",
              "lastUpdated" = NOW()
          RETURNING *
        `, [investmentChange]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating token stats:', error);
        throw error;
      }
    }
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
          INSERT INTO wallets (id, "userId", balance, "tikiBalance", currency, "lastUpdated", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
          RETURNING *
        `, [walletId, userId, 0, 0, currency]);
        
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
              INSERT INTO wallets (id, "userId", balance, "tikiBalance", currency, "lastUpdated", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
              RETURNING *
            `, [randomUUID(), userId, 0, 0, currency]);
            
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

    async updateWallet(userId, balance, tikiBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "tikiBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [balance, tikiBalance, userId]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating wallet:', error);
        throw error;
      }
    },

    async updateBothBalances(userId, usdBalance, tikiBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET balance = $1, "tikiBalance" = $2, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $3
          RETURNING *
        `, [usdBalance, tikiBalance, userId]);
        
        console.log('✅ Wallet balances updated:', { userId, usdBalance, tikiBalance });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating both balances:', error);
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

    async getTikiBalance(userId) {
      try {
        const result = await pool.query('SELECT "tikiBalance" FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0]?.tikiBalance || 0;
      } catch (error) {
        console.error('Error getting TIKI balance:', error);
        return 0;
      }
    },

    async updateTikiBalance(userId, amount) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "tikiBalance" = "tikiBalance" + $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [amount, userId]);
        
        console.log('✅ TIKI balance updated:', userId, { amount });
        return result.rows[0];
      } catch (error) {
        console.error('Error updating TIKI balance:', error);
        throw error;
      }
    }
  },

  // Transaction operations
  transaction: {
    async createTransaction(transactionData) {
      try {
        const { userId, type, amount, currency = 'USD', status = 'PENDING', description = null, gateway = null, binanceAddress = null } = transactionData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO transactions (id, "userId", type, amount, currency, status, description, gateway, "binanceAddress", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING *
        `, [id, userId, type, amount, currency, status, description, gateway, binanceAddress]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
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
            SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) as totalWithdrawals,
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
            SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) as totalWithdrawals,
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

        const result = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount END), 0) as totalCompletedAmount
          FROM transactions
          ${whereClause}
        `, params);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error getting transaction stats:', error);
        return {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          totalCompletedAmount: 0
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
        
        const result = await pool.query(`
          INSERT INTO notifications (id, "userId", title, message, type, "isGlobal", "createdBy", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [id, userId, title, message, type, isGlobal, createdBy]);
        
        console.log('✅ Notification created:', id);
        return result.rows[0];
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
    }
  },

  // Deposit operations
  deposit: {
    async createDepositRequest(depositData) {
      try {
        const { userId, amount, screenshot, binanceAddress } = depositData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO deposit_requests (id, "userId", amount, screenshot, "binanceAddress", status, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
          RETURNING *
        `, [id, userId, amount, screenshot, binanceAddress]);
        
        console.log('✅ Deposit request created:', id);
        return result.rows[0];
      } catch (error) {
        console.error('Error creating deposit request:', error);
        throw error;
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
        const { userId, amountStaked, durationDays, rewardPercent, startDate, endDate } = stakingData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO staking (id, "userId", "amountStaked", "durationDays", "rewardPercent", "startDate", "endDate", status, claimed, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', false, NOW(), NOW())
          RETURNING *
        `, [id, userId, amountStaked, durationDays, rewardPercent, startDate, endDate]);

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
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' OR status = 'CLAIMED' THEN "rewardAmount" END), 0) as totalRewards
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
  }
};

export default databaseHelpers;