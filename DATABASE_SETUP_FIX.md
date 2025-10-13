# Database Setup Fix

## Problem
The deposit API is returning a 500 Internal Server Error due to database connection issues.

## Root Cause
The database connection is failing with: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

This indicates that the `DATABASE_URL` environment variable is not properly configured.

## Solution

### Step 1: Update Environment Variables

The `.env.local` file has been created with default values. You need to update it with your actual database credentials:

```env
# Update this with your actual database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DIRECT_URL=postgresql://username:password@localhost:5432/database_name
```

### Step 2: Database Options

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `token_website`
3. Update the connection string:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/token_website
   ```

#### Option B: Supabase (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Update your `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

#### Option C: Other Cloud Database
- Use any PostgreSQL-compatible database service
- Update the connection string accordingly

### Step 3: Run Database Migrations

After setting up the database connection:

```bash
# Push the schema to the database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 4: Test the Connection

```bash
# Test the database connection
node scripts/test-database-connection.js
```

### Step 5: Start the Development Server

```bash
npm run dev
```

## Verification

Once the database is properly configured, the deposit API should work correctly. You can test it by:

1. Going to the deposit page
2. Filling out the form
3. Submitting a deposit request

The API should now return a success response instead of a 500 error.

## Troubleshooting

If you still get errors:

1. **Check the database connection string format**
2. **Ensure the database server is running**
3. **Verify the database exists**
4. **Check firewall settings if using remote database**
5. **Run the database migrations**

## Error Messages

The API now provides more helpful error messages:

- `Database connection error. Please check your database configuration.` - Connection issue
- `Database table not found. Please run database migrations.` - Schema issue
- `Database constraint error. Please check your database setup.` - Foreign key issue

