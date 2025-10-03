import { prisma } from './prisma.js'

// Database helper functions
export const databaseHelpers = {
  // Wallet operations
  wallet: {
    // Get user's wallet
    async getUserWallet(userId) {
      try {
        const wallet = await prisma.wallet.findUnique({
          where: { userId }
        })
        return wallet
      } catch (error) {
        console.error('Error getting user wallet:', error)
        throw error
      }
    },

    // Create user wallet
    async createWallet(userId, currency = 'PKR') {
      try {
        const wallet = await prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            currency
          }
        })
        return wallet
      } catch (error) {
        console.error('Error creating wallet:', error)
        throw error
      }
    },

    // Update wallet balance
    async updateBalance(walletId, newBalance) {
      try {
        const wallet = await prisma.wallet.update({
          where: { id: walletId },
          data: {
            balance: newBalance,
            lastUpdated: new Date()
          }
        })
        return wallet
      } catch (error) {
        console.error('Error updating wallet balance:', error)
        throw error
      }
    },

    // Add funds to wallet
    async addFunds(walletId, amount) {
      try {
        const wallet = await prisma.wallet.findUnique({
          where: { id: walletId }
        })
        
        if (!wallet) {
          throw new Error('Wallet not found')
        }
        
        const newBalance = wallet.balance + amount
        return await this.updateBalance(walletId, newBalance)
      } catch (error) {
        console.error('Error adding funds to wallet:', error)
        throw error
      }
    },

    // Deduct funds from wallet
    async deductFunds(walletId, amount) {
      try {
        const wallet = await prisma.wallet.findUnique({
          where: { id: walletId }
        })
        
        if (!wallet) {
          throw new Error('Wallet not found')
        }
        
        if (wallet.balance < amount) {
          throw new Error('Insufficient funds')
        }
        
        const newBalance = wallet.balance - amount
        return await this.updateBalance(walletId, newBalance)
      } catch (error) {
        console.error('Error deducting funds from wallet:', error)
        throw error
      }
    }
  },

  // Transaction operations
  transactions: {
    // Get user's transactions
    async getUserTransactions(userId, limit = 25, offset = 0) {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return transactions
      } catch (error) {
        console.error('Error getting user transactions:', error)
        throw error
      }
    },

    // Get transactions by status
    async getTransactionsByStatus(userId, status, limit = 25, offset = 0) {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { 
            userId,
            status: status.toUpperCase()
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return transactions
      } catch (error) {
        console.error('Error getting transactions by status:', error)
        throw error
      }
    },

    // Create transaction
    async createTransaction(userId, type, amount, gateway = null) {
      try {
        const transaction = await prisma.transaction.create({
          data: {
            userId,
            type: type.toUpperCase(),
            amount,
            gateway
          }
        })
        return transaction
      } catch (error) {
        console.error('Error creating transaction:', error)
        throw error
      }
    },

    // Update transaction status
    async updateTransactionStatus(transactionId, status) {
      try {
        const transaction = await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: status.toUpperCase() }
        })
        return transaction
      } catch (error) {
        console.error('Error updating transaction status:', error)
        throw error
      }
    },

    // Get transaction by ID
    async getTransaction(transactionId) {
      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        })
        return transaction
      } catch (error) {
        console.error('Error getting transaction:', error)
        throw error
      }
    },

    // Get transaction statistics
    async getTransactionStats(userId) {
      try {
        const [allTransactions, completedTransactions, pendingTransactions, failedTransactions] = await Promise.all([
          prisma.transaction.findMany({ where: { userId } }),
          prisma.transaction.findMany({ where: { userId, status: 'COMPLETED' } }),
          prisma.transaction.findMany({ where: { userId, status: 'PENDING' } }),
          prisma.transaction.findMany({ where: { userId, status: 'FAILED' } })
        ])

        const totalAmount = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        const totalDeposits = completedTransactions
          .filter(tx => tx.type === 'DEPOSIT')
          .reduce((sum, tx) => sum + tx.amount, 0)
        const totalWithdrawals = completedTransactions
          .filter(tx => tx.type === 'WITHDRAW')
          .reduce((sum, tx) => sum + tx.amount, 0)

        return {
          totalTransactions: allTransactions.length,
          completedTransactions: completedTransactions.length,
          pendingTransactions: pendingTransactions.length,
          failedTransactions: failedTransactions.length,
          totalAmount,
          totalDeposits,
          totalWithdrawals
        }
      } catch (error) {
        console.error('Error getting transaction statistics:', error)
        throw error
      }
    }
  },

  // Notification operations
  notifications: {
    // Get user notifications (user-specific + global)
    async getUserNotifications(userId, limit = 25, offset = 0) {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            OR: [
              { userId },
              { userId: null }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return notifications
      } catch (error) {
        console.error('Error getting user notifications:', error)
        throw error
      }
    },

    // Get unread notifications count
    async getUnreadCount(userId) {
      try {
        const count = await prisma.notification.count({
          where: {
            OR: [
              { userId },
              { userId: null }
            ],
            status: 'UNREAD'
          }
        })
        return count
      } catch (error) {
        console.error('Error getting unread count:', error)
        throw error
      }
    },

    // Get notification by ID
    async getNotification(notificationId) {
      try {
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId }
        })
        return notification
      } catch (error) {
        console.error('Error getting notification:', error)
        throw error
      }
    },

    // Mark notification as read
    async markAsRead(notificationId) {
      try {
        const notification = await prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'READ' }
        })
        return notification
      } catch (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }
    },

    // Mark all user notifications as read
    async markAllAsRead(userId) {
      try {
        const result = await prisma.notification.updateMany({
          where: {
            userId,
            status: 'UNREAD'
          },
          data: { status: 'READ' }
        })
        return { success: true, updated: result.count }
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }
    },

    // Create notification (admin only)
    async createNotification(title, message, type, userId = null) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type.toUpperCase()
          }
        })
        return notification
      } catch (error) {
        console.error('Error creating notification:', error)
        throw error
      }
    },

    // Get all notifications (admin only)
    async getAllNotifications(limit = 50, offset = 0) {
      try {
        const notifications = await prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return notifications
      } catch (error) {
        console.error('Error getting all notifications:', error)
        throw error
      }
    },

    // Delete notification (admin only)
    async deleteNotification(notificationId) {
      try {
        await prisma.notification.delete({
          where: { id: notificationId }
        })
        return { success: true }
      } catch (error) {
        console.error('Error deleting notification:', error)
        throw error
      }
    }
  },

  // Support Ticket operations
  supportTickets: {
    // Get user's support tickets
    async getUserTickets(userId, limit = 25, offset = 0) {
      try {
        const tickets = await prisma.supportTicket.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return tickets
      } catch (error) {
        console.error('Error getting user support tickets:', error)
        throw error
      }
    },

    // Get all support tickets (admin only)
    async getAllTickets(limit = 50, offset = 0) {
      try {
        const tickets = await prisma.supportTicket.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return tickets
      } catch (error) {
        console.error('Error getting all support tickets:', error)
        throw error
      }
    },

    // Get support ticket by ID
    async getTicket(ticketId) {
      try {
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: ticketId }
        })
        return ticket
      } catch (error) {
        console.error('Error getting support ticket:', error)
        throw error
      }
    },

    // Create new support ticket
    async createTicket(userId, subject, initialMessage) {
      try {
        const ticket = await prisma.supportTicket.create({
          data: {
            userId,
            subject,
            messages: [
              {
                sender: 'user',
                message: initialMessage,
                createdAt: new Date().toISOString()
              }
            ]
          }
        })
        return ticket
      } catch (error) {
        console.error('Error creating support ticket:', error)
        throw error
      }
    },

    // Add message to ticket
    async addMessage(ticketId, sender, message) {
      try {
        // Get current ticket
        const ticket = await this.getTicket(ticketId)
        
        // Add new message to messages array
        const updatedMessages = [
          ...ticket.messages,
          {
            sender,
            message,
            createdAt: new Date().toISOString()
          }
        ]

        // Update ticket with new message
        const updatedTicket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { messages: updatedMessages }
        })
        
        return updatedTicket
      } catch (error) {
        console.error('Error adding message to ticket:', error)
        throw error
      }
    },

    // Close support ticket
    async closeTicket(ticketId) {
      try {
        const ticket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'CLOSED' }
        })
        return ticket
      } catch (error) {
        console.error('Error closing support ticket:', error)
        throw error
      }
    },

    // Reopen support ticket
    async reopenTicket(ticketId) {
      try {
        const ticket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'OPEN' }
        })
        return ticket
      } catch (error) {
        console.error('Error reopening support ticket:', error)
        throw error
      }
    },

    // Get tickets by status
    async getTicketsByStatus(status, limit = 50, offset = 0) {
      try {
        const tickets = await prisma.supportTicket.findMany({
          where: { status: status.toUpperCase() },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return tickets
      } catch (error) {
        console.error('Error getting tickets by status:', error)
        throw error
      }
    },

    // Get ticket statistics
    async getTicketStats() {
      try {
        const [allTickets, openTickets, closedTickets] = await Promise.all([
          prisma.supportTicket.findMany(),
          prisma.supportTicket.findMany({ where: { status: 'OPEN' } }),
          prisma.supportTicket.findMany({ where: { status: 'CLOSED' } })
        ])

        return {
          total: allTickets.length,
          open: openTickets.length,
          closed: closedTickets.length
        }
      } catch (error) {
        console.error('Error getting ticket statistics:', error)
        throw error
      }
    }
  },

  // System Settings operations
  systemSettings: {
    // Get system settings
    async getSystemSettings() {
      try {
        const settings = await prisma.systemSetting.findMany()
        return settings
      } catch (error) {
        console.error('Error getting system settings:', error)
        throw error
      }
    },

    // Get specific setting by key
    async getSetting(key) {
      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { key }
        })
        return setting
      } catch (error) {
        console.error('Error getting setting:', error)
        throw error
      }
    },

    // Update or create setting
    async setSetting(key, value, description = '') {
      try {
        const setting = await prisma.systemSetting.upsert({
          where: { key },
          update: {
            value: value.toString(),
            description,
            updatedAt: new Date()
          },
          create: {
            key,
            value: value.toString(),
            description
          }
        })
        return setting
      } catch (error) {
        console.error('Error setting system setting:', error)
        throw error
      }
    },

    // Get token price
    async getTokenPrice() {
      try {
        const setting = await this.getSetting('token_price')
        return setting ? parseFloat(setting.value) : 0
      } catch (error) {
        console.error('Error getting token price:', error)
        return 0
      }
    },

    // Set token price
    async setTokenPrice(price) {
      try {
        if (price <= 0) {
          throw new Error('Token price must be greater than 0')
        }
        return await this.setSetting('token_price', price, 'Current token price in USD')
      } catch (error) {
        console.error('Error setting token price:', error)
        throw error
      }
    },

    // Get payment gateways
    async getPaymentGateways() {
      try {
        const setting = await this.getSetting('payment_gateways')
        return setting ? JSON.parse(setting.value) : []
      } catch (error) {
        console.error('Error getting payment gateways:', error)
        return []
      }
    },

    // Set payment gateways
    async setPaymentGateways(gateways) {
      try {
        return await this.setSetting('payment_gateways', JSON.stringify(gateways), 'Available payment gateways')
      } catch (error) {
        console.error('Error setting payment gateways:', error)
        throw error
      }
    },

    // Get token supply
    async getTokenSupply() {
      try {
        const setting = await this.getSetting('token_supply')
        return setting ? parseFloat(setting.value) : 0
      } catch (error) {
        console.error('Error getting token supply:', error)
        return 0
      }
    },

    // Set token supply
    async setTokenSupply(supply) {
      try {
        if (supply <= 0) {
          throw new Error('Token supply must be greater than 0')
        }
        return await this.setSetting('token_supply', supply, 'Total token supply')
      } catch (error) {
        console.error('Error setting token supply:', error)
        throw error
      }
    },

    // Get all system settings as key-value pairs
    async getAllSettings() {
      try {
        const settings = await this.getSystemSettings()
        const settingsMap = {}
        
        settings.forEach(setting => {
          settingsMap[setting.key] = {
            value: setting.value,
            description: setting.description,
            updatedAt: setting.updatedAt
          }
        })
        
        return settingsMap
      } catch (error) {
        console.error('Error getting all settings:', error)
        throw error
      }
    },

    // Initialize default settings
    async initializeDefaultSettings() {
      try {
        const defaultSettings = [
          { key: 'token_price', value: '1.00', description: 'Current token price in USD' },
          { key: 'token_supply', value: '1000000', description: 'Total token supply' },
          { key: 'payment_gateways', value: JSON.stringify([
            { name: 'Stripe', active: true },
            { name: 'PayPal', active: true },
            { name: 'Bank Transfer', active: false }
          ]), description: 'Available payment gateways' }
        ]

        for (const setting of defaultSettings) {
          const existing = await this.getSetting(setting.key)
          if (!existing) {
            await prisma.systemSetting.create({
              data: setting
            })
          }
        }
        
        return true
      } catch (error) {
        console.error('Error initializing default settings:', error)
        throw error
      }
    }
  },

  // Admin operations
  admin: {
    // Get all pending transactions
    async getPendingTransactions(type = null) {
      try {
        const where = { status: 'PENDING' }
        if (type) {
          where.type = type.toUpperCase()
        }
        
        const transactions = await prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' }
        })
        return transactions
      } catch (error) {
        console.error('Error getting pending transactions:', error)
        throw error
      }
    },

    // Get user wallet
    async getUserWallet(userId) {
      try {
        const wallet = await prisma.wallet.findUnique({
          where: { userId }
        })
        return wallet
      } catch (error) {
        console.error('Error getting user wallet:', error)
        throw error
      }
    },

    // Update user wallet balance
    async updateWalletBalance(walletId, newBalance) {
      try {
        const wallet = await prisma.wallet.update({
          where: { id: walletId },
          data: {
            balance: newBalance,
            lastUpdated: new Date()
          }
        })
        return wallet
      } catch (error) {
        console.error('Error updating wallet balance:', error)
        throw error
      }
    },

    // Log admin action
    async logAdminAction(adminId, action, targetType, targetId, details = null) {
      try {
        const log = await prisma.adminLog.create({
          data: {
            adminId,
            action,
            targetType,
            targetId,
            details: details || '',
            ipAddress: '', // Will be filled by client
            userAgent: '' // Will be filled by client
          }
        })
        return log
      } catch (error) {
        console.error('Error logging admin action:', error)
        throw error
      }
    },

    // Get admin logs
    async getAdminLogs(limit = 50, offset = 0) {
      try {
        const logs = await prisma.adminLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return logs
      } catch (error) {
        console.error('Error getting admin logs:', error)
        throw error
      }
    },

    // Search admin logs by action or adminId
    async searchAdminLogs(searchTerm, limit = 50, offset = 0) {
      try {
        const logs = await prisma.adminLog.findMany({
          where: {
            OR: [
              { action: { contains: searchTerm } },
              { adminId: { contains: searchTerm } },
              { details: { contains: searchTerm } }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return logs
      } catch (error) {
        console.error('Error searching admin logs:', error)
        throw error
      }
    },

    // Get admin logs by adminId
    async getAdminLogsByAdmin(adminId, limit = 50, offset = 0) {
      try {
        const logs = await prisma.adminLog.findMany({
          where: { adminId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        })
        return logs
      } catch (error) {
        console.error('Error getting admin logs by admin:', error)
        throw error
      }
    },

    // Get admin log statistics
    async getAdminLogStats() {
      try {
        const [allLogs, recentLogs] = await Promise.all([
          prisma.adminLog.findMany(),
          prisma.adminLog.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          })
        ])

        // Get unique admin count
        const uniqueAdmins = new Set(allLogs.map(log => log.adminId)).size

        return {
          total: allLogs.length,
          recent: recentLogs.length,
          uniqueAdmins
        }
      } catch (error) {
        console.error('Error getting admin log statistics:', error)
        throw error
      }
    },

    // Approve transaction
    async approveTransaction(transactionId, adminId) {
      try {
        // Get transaction details
        const transaction = await databaseHelpers.transactions.getTransaction(transactionId)
        if (!transaction) {
          throw new Error('Transaction not found')
        }

        if (transaction.status !== 'PENDING') {
          throw new Error('Transaction is not pending')
        }

        // Get user's wallet
        const wallet = await this.getUserWallet(transaction.userId)
        if (!wallet) {
          throw new Error('User wallet not found')
        }

        let newBalance = wallet.balance
        
        // Update balance based on transaction type
        if (transaction.type === 'DEPOSIT') {
          newBalance = wallet.balance + transaction.amount
        } else if (transaction.type === 'WITHDRAW') {
          if (wallet.balance < transaction.amount) {
            throw new Error('Insufficient balance for withdrawal')
          }
          newBalance = wallet.balance - transaction.amount
        }

        // Update wallet balance
        const updatedWallet = await this.updateWalletBalance(wallet.id, newBalance)

        // Update transaction status
        const updatedTransaction = await databaseHelpers.transactions.updateTransactionStatus(transactionId, 'COMPLETED')

        // Log admin action
        await this.logAdminAction(
          adminId,
          'approve_transaction',
          'transaction',
          transactionId,
          `Approved ${transaction.type} of ${transaction.amount} for user ${transaction.userId}`
        )

        return {
          transaction: updatedTransaction,
          wallet: updatedWallet
        }
      } catch (error) {
        console.error('Error approving transaction:', error)
        throw error
      }
    },

    // Reject transaction
    async rejectTransaction(transactionId, adminId, reason = '') {
      try {
        // Get transaction details
        const transaction = await databaseHelpers.transactions.getTransaction(transactionId)
        if (!transaction) {
          throw new Error('Transaction not found')
        }

        if (transaction.status !== 'PENDING') {
          throw new Error('Transaction is not pending')
        }

        // Update transaction status
        const updatedTransaction = await databaseHelpers.transactions.updateTransactionStatus(transactionId, 'FAILED')

        // Log admin action
        await this.logAdminAction(
          adminId,
          'reject_transaction',
          'transaction',
          transactionId,
          `Rejected ${transaction.type} of ${transaction.amount} for user ${transaction.userId}. Reason: ${reason}`
        )

        return updatedTransaction
      } catch (error) {
        console.error('Error rejecting transaction:', error)
        throw error
      }
    }
  },

  // Price operations
  price: {
    // Get price history
    async getPriceHistory(symbol = 'TOKEN', timeFilter = '1d', limit = 50) {
      try {
        const now = new Date()
        let startTime
        
        switch (timeFilter) {
          case '1min':
            startTime = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
            break
          case '1h':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
            break
          case '1d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            break
          case '7d':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            break
          case '30d':
            startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
            break
          default:
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
        
        const prices = await prisma.price.findMany({
          where: {
            symbol,
            timestamp: {
              gte: startTime
            }
          },
          orderBy: { timestamp: 'asc' },
          take: limit
        })
        
        return prices
      } catch (error) {
        console.error('Error getting price history:', error)
        throw error
      }
    },

    // Get current price
    async getCurrentPrice(symbol = 'TOKEN') {
      try {
        const price = await prisma.price.findFirst({
          where: { symbol },
          orderBy: { timestamp: 'desc' }
        })
        
        return price
      } catch (error) {
        console.error('Error getting current price:', error)
        throw error
      }
    },

    // Add price snapshot
    async addPriceSnapshot(symbol, price, volume = null, marketCap = null, source = 'system') {
      try {
        const priceData = await prisma.price.create({
          data: {
            symbol,
            price,
            volume,
            marketCap,
            source
          }
        })
        
        return priceData
      } catch (error) {
        console.error('Error adding price snapshot:', error)
        throw error
      }
    },

    // Get price statistics
    async getPriceStats(symbol = 'TOKEN', timeFilter = '1d') {
      try {
        const prices = await this.getPriceHistory(symbol, timeFilter, 100)
        
        if (prices.length === 0) {
          return {
            current: 0,
            change: 0,
            changePercent: 0,
            high: 0,
            low: 0,
            volume: 0
          }
        }
        
        const current = prices[prices.length - 1].price
        const previous = prices.length > 1 ? prices[prices.length - 2].price : current
        const change = current - previous
        const changePercent = previous > 0 ? (change / previous) * 100 : 0
        
        const priceValues = prices.map(p => p.price)
        const high = Math.max(...priceValues)
        const low = Math.min(...priceValues)
        const volume = prices.reduce((sum, p) => sum + (p.volume || 0), 0)
        
        return {
          current,
          change,
          changePercent,
          high,
          low,
          volume
        }
      } catch (error) {
        console.error('Error getting price statistics:', error)
        throw error
      }
    }
  },

  // Combined operations
  combined: {
    // Process a transaction and update wallet
    async processTransaction(userId, type, amount, gateway = null) {
      try {
        // Create transaction record
        const transaction = await databaseHelpers.transactions.createTransaction(
          userId,
          type,
          amount,
          gateway
        )

        // Get user's wallet
        let wallet = await databaseHelpers.wallet.getUserWallet(userId)
        
        // Create wallet if it doesn't exist
        if (!wallet) {
          wallet = await databaseHelpers.wallet.createWallet(userId)
        }

        // Process the transaction based on type
        let updatedWallet
        if (type === 'deposit' || type === 'buy') {
          updatedWallet = await databaseHelpers.wallet.addFunds(wallet.id, amount)
        } else if (type === 'withdraw' || type === 'sell') {
          updatedWallet = await databaseHelpers.wallet.deductFunds(wallet.id, amount)
        }

        // Update transaction status to completed
        const completedTransaction = await databaseHelpers.transactions.updateTransactionStatus(
          transaction.id,
          'COMPLETED'
        )

        return {
          transaction: completedTransaction,
          wallet: updatedWallet
        }
      } catch (error) {
        console.error('Error processing transaction:', error)
        
        // Try to update transaction status to failed
        try {
          const transaction = await databaseHelpers.transactions.getTransaction(transaction.id)
          await databaseHelpers.transactions.updateTransactionStatus(
            transaction.id,
            'FAILED'
          )
        } catch (updateError) {
          console.error('Error updating transaction status to failed:', updateError)
        }
        
        throw error
      }
    },

    // Get user's complete financial overview
    async getUserFinancialOverview(userId) {
      try {
        const [wallet, transactions, stats] = await Promise.all([
          databaseHelpers.wallet.getUserWallet(userId),
          databaseHelpers.transactions.getUserTransactions(userId, 10),
          databaseHelpers.transactions.getTransactionStats(userId)
        ])

        return {
          wallet: wallet || { balance: 0, currency: 'PKR' },
          recentTransactions: transactions,
          statistics: stats
        }
      } catch (error) {
        console.error('Error getting user financial overview:', error)
        throw error
      }
    }
  }
}

export default databaseHelpers



