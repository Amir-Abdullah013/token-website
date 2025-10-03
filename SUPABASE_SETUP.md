# Supabase + Prisma Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration (for client-side)
NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (for Prisma - server-side)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional: For production
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings > API

3. **Set up Database**
   - Use the project URL from your Supabase project
   - Update the `DATABASE_URL` in your `.env.local`

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

5. **Push Database Schema**
   ```bash
   npm run db:push
   ```

6. **Seed Database (Optional)**
   ```bash
   npm run db:seed
   ```

## Database Schema

The migration includes the following tables:
- `users` - User accounts
- `wallets` - User wallet balances
- `transactions` - Transaction records
- `notifications` - User and system notifications
- `support_tickets` - Customer support tickets
- `admin_logs` - Admin action logs
- `prices` - Token price history
- `system_settings` - System configuration

## Authentication

The system now uses Supabase Auth instead of Appwrite. Key features:
- Email/password authentication
- OAuth providers (Google, GitHub)
- Password reset functionality
- User profile management

## API Changes

All database operations now use Prisma instead of Appwrite. The API structure remains the same, but the underlying implementation has changed.

## Migration Notes

- All existing Appwrite collections have been mapped to Prisma models
- Authentication is now handled by Supabase Auth
- Database operations use Prisma ORM
- Environment variables have changed (see above)

