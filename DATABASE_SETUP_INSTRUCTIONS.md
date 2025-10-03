# Database Setup Instructions

## Issue: Database Not Found

The application is showing "Database not found" errors because the Supabase database and tables haven't been created yet.

## Solution: Set Up Environment Variables and Initialize Database

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**Important**: Replace `your-project.supabase.co` with your actual Supabase project URL and `your_supabase_anon_key` with your actual Supabase anon key.

### Step 2: Get Your Supabase Project Credentials

1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project or select an existing project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **Anon Key**
5. Update the `NEXT_PUBLIC_DATABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file

### Step 3: Initialize Database

You have two options to initialize the database:

#### Option A: Command Line (Recommended)
1. Make sure your `.env.local` file is created with the correct values
2. Run: `npm run db:generate`
3. Run: `npm run db:push`
4. Run: `npm run db:seed` (optional)
5. Follow the console output

#### Option B: Web Interface
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/setup-database`
3. Click "Initialize Database" button
4. Wait for the setup to complete

### Step 4: Verify Setup

After successful setup, you should see:
- ✅ Database tables created: `users`, `wallets`, `transactions`, `notifications`, `support_tickets`, `admin_logs`, `prices`, `system_settings`
- ✅ Row Level Security (RLS) enabled
- ✅ Indexes created
- ✅ Sample data seeded (if using db:seed)

### Step 5: Test the Application

1. Go to `http://localhost:3000/user/dashboard`
2. The "Database not found" errors should be resolved
3. You should see the wallet overview and price chart components

## What Gets Created

The database setup creates:

### Database
- **Name**: `wallets_db`
- **Description**: Database for wallet and transaction management

### Collections

#### 1. Wallets Collection
- **Fields**: userId, balance, currency, lastUpdated
- **Permissions**: Users can only access their own wallet, admins have full access

#### 2. Transactions Collection
- **Fields**: userId, type, amount, status, gateway, createdAt
- **Types**: deposit, withdraw, buy, sell
- **Statuses**: pending, completed, failed
- **Permissions**: Users can only access their own transactions, admins have full access

#### 3. Settings Collection
- **Fields**: key, value, description, updatedAt
- **Permissions**: Users can read, admins have full access

#### 4. AdminLogs Collection
- **Fields**: adminId, action, targetType, targetId, details, ipAddress, userAgent, createdAt
- **Permissions**: Only admins can access

#### 5. Prices Collection
- **Fields**: symbol, price, volume, marketCap, timestamp, source
- **Permissions**: Users can read, admins have full access

## Troubleshooting

### "Database not found" Error
- Ensure your `.env.local` file exists and has the correct Appwrite Project ID
- Make sure you've run the database setup (either via web interface or command line)

### "Missing environment variables" Error
- Check that your `.env.local` file is in the project root
- Verify all required variables are set
- Restart your development server after creating/updating `.env.local`

### "Permission denied" Error
- Ensure your Appwrite project is active
- Check that your Project ID is correct
- Verify you have the necessary permissions in your Appwrite project

### Setup Fails
- Check your internet connection
- Verify your Appwrite project is accessible
- Check the browser console for detailed error messages
- Try running the setup again

## Next Steps

After successful database setup:

1. **Test User Registration**: Create a new user account
2. **Test Wallet Creation**: Check if wallet is automatically created for new users
3. **Test Transactions**: Try creating deposit/withdrawal requests
4. **Test Admin Features**: Access admin panels to manage transactions

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify your Appwrite project settings
3. Ensure all environment variables are correctly set
4. Try the web interface setup at `/setup-database` first

The database setup is a one-time process. Once completed, your application should work normally without the "Database not found" errors.




