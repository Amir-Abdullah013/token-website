# Appwrite Database Setup for Wallets & Transactions

This document describes the database collections and setup for the wallet and transaction management system.

## Collections Overview

### 1. Wallets Collection
- **Collection ID**: `wallets`
- **Purpose**: Store user wallet information and balances

#### Attributes:
- `userId` (string, required) - Relation to Appwrite user
- `balance` (float, required, default: 0) - Current wallet balance
- `currency` (string, required, default: "PKR") - Wallet currency
- `lastUpdated` (datetime, required) - Last update timestamp

#### Indexes:
- `userId_index` - For fast user wallet lookups
- `currency_index` - For currency-based queries

#### Permissions:
- Users can read/write their own wallet only
- Admins have full access to all wallets

### 2. Transactions Collection
- **Collection ID**: `transactions`
- **Purpose**: Store user transaction records

#### Attributes:
- `userId` (string, required) - Relation to Appwrite user
- `type` (enum, required) - Transaction type: "deposit", "withdraw", "buy", "sell"
- `amount` (float, required) - Transaction amount
- `status` (enum, required) - Transaction status: "pending", "completed", "failed"
- `gateway` (string, optional) - Payment gateway used
- `createdAt` (datetime, required) - Transaction creation timestamp

#### Indexes:
- `userId_index` - For fast user transaction lookups
- `type_index` - For transaction type queries
- `status_index` - For status-based queries
- `createdAt_index` - For date-based sorting
- `userId_createdAt_index` - For user-specific date queries

#### Permissions:
- Users can read/write their own transactions only
- Admins have full access to all transactions

## Setup Instructions

### 1. Initialize Database
```javascript
import { setupDatabase } from './lib/setup-database.js';

// Run database setup
await setupDatabase();
```

### 2. Using Database Helpers
```javascript
import { databaseHelpers } from './lib/appwrite.js';

// Wallet operations
const wallet = await databaseHelpers.wallet.getUserWallet(userId);
const newWallet = await databaseHelpers.wallet.createWallet(userId, 'PKR');
const updatedWallet = await databaseHelpers.wallet.addFunds(walletId, 100);

// Transaction operations
const transactions = await databaseHelpers.transactions.getUserTransactions(userId);
const transaction = await databaseHelpers.transactions.createTransaction(userId, 'deposit', 50);
const updatedTx = await databaseHelpers.transactions.updateTransactionStatus(transactionId, 'completed');

// Combined operations
const result = await databaseHelpers.combined.processTransaction(userId, 'deposit', 100);
const overview = await databaseHelpers.combined.getUserFinancialOverview(userId);
```

## Security Rules

### User Permissions
- Users can only access their own wallet and transactions
- All queries are filtered by `userId == $userId`
- Users cannot access other users' financial data

### Admin Permissions
- Admins have full read/write access to all collections
- No restrictions on admin operations
- Admins can view all users' financial data

## API Reference

### Wallet Operations

#### `getUserWallet(userId)`
Get user's wallet information.

#### `createWallet(userId, currency = 'PKR')`
Create a new wallet for a user.

#### `updateBalance(walletId, newBalance)`
Update wallet balance directly.

#### `addFunds(walletId, amount)`
Add funds to wallet.

#### `deductFunds(walletId, amount)`
Deduct funds from wallet (checks for sufficient balance).

### Transaction Operations

#### `getUserTransactions(userId, limit = 25, offset = 0)`
Get user's transactions with pagination.

#### `getTransactionsByStatus(userId, status, limit = 25, offset = 0)`
Get transactions filtered by status.

#### `createTransaction(userId, type, amount, gateway = null)`
Create a new transaction record.

#### `updateTransactionStatus(transactionId, status)`
Update transaction status.

#### `getTransaction(transactionId)`
Get transaction by ID.

#### `getTransactionStats(userId)`
Get comprehensive transaction statistics.

### Combined Operations

#### `processTransaction(userId, type, amount, gateway = null)`
Process a transaction and update wallet balance atomically.

#### `getUserFinancialOverview(userId)`
Get complete financial overview including wallet, recent transactions, and statistics.

## Testing

### Run Database Tests
```javascript
import { testDatabase } from './lib/test-database.js';

// Run all tests
await testDatabase.runAllTests();

// Run specific tests
await testDatabase.testWalletOperations();
await testDatabase.testTransactionOperations();
await testDatabase.testCombinedOperations();
```

## Error Handling

All database operations include comprehensive error handling:
- Network errors are caught and logged
- Invalid operations throw descriptive errors
- Transaction failures are properly rolled back
- Insufficient funds are checked before deduction

## Best Practices

1. **Always check user authentication** before database operations
2. **Use combined operations** for atomic transactions
3. **Handle errors gracefully** in your application
4. **Validate input data** before database operations
5. **Use pagination** for large transaction lists
6. **Monitor transaction status** for failed operations

## Environment Variables Required

Make sure these environment variables are set:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`

## Database Structure

```
wallets_db/
├── wallets/
│   ├── userId (string, relation)
│   ├── balance (float, default: 0)
│   ├── currency (string, default: "PKR")
│   └── lastUpdated (datetime)
└── transactions/
    ├── userId (string, relation)
    ├── type (enum: deposit, withdraw, buy, sell)
    ├── amount (float)
    ├── status (enum: pending, completed, failed)
    ├── gateway (string, nullable)
    └── createdAt (datetime)
```







