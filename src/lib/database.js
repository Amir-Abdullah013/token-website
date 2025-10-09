import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Disable SSL for Supabase compatibility
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
        const result = await pool.query(`
          INSERT INTO wallets ("userId", balance, "tikiBalance", currency, "lastUpdated", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
          RETURNING *
        `, [userId, 0, 0, currency]);
        
        return result.rows[0];
      } catch (error) {
        console.error('Error creating wallet:', error);
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

    async getTikiBalance(userId) {
      try {
        const result = await pool.query('SELECT "tikiBalance" FROM wallets WHERE "userId" = $1', [userId]);
        return result.rows[0]?.tikiBalance || 0;
      } catch (error) {
        console.error('Error getting TIKI balance:', error);
        return 0;
      }
    },

    async updateTikiBalance(userId, tikiBalance) {
      try {
        const result = await pool.query(`
          UPDATE wallets 
          SET "tikiBalance" = $1, "lastUpdated" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $2
          RETURNING *
        `, [tikiBalance, userId]);
        
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
        const { userId, type, amount, currency = 'USD', status = 'PENDING', description } = transactionData;
        const id = randomUUID();
        
        const result = await pool.query(`
          INSERT INTO transactions (id, "userId", type, amount, currency, status, description, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [id, userId, type, amount, currency, status, description]);
        
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

    async getAllTransactions() {
      try {
        const result = await pool.query('SELECT * FROM transactions ORDER BY "createdAt" DESC');
        return result.rows;
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
  }
};

export default databaseHelpers;