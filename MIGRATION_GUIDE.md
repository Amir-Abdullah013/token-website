# Migration from Appwrite to Supabase + Prisma

This guide will help you migrate your token website from Appwrite to Supabase with Prisma ORM.

## 🎯 What's Changed

### Database
- **From**: Appwrite Database with collections
- **To**: PostgreSQL with Prisma ORM

### Authentication
- **From**: Appwrite Auth
- **To**: Supabase Auth

### API Layer
- **From**: Appwrite SDK calls
- **To**: Prisma database operations

## 📋 Migration Checklist

### ✅ Completed
- [x] Removed Appwrite dependencies
- [x] Added Supabase and Prisma dependencies
- [x] Created Prisma schema with all tables
- [x] Created Supabase client configuration
- [x] Created Prisma client configuration
- [x] Created new database helpers using Prisma
- [x] Updated authentication system
- [x] Updated notification API routes
- [x] Created migration helper script
- [x] Created setup documentation

### 🔄 In Progress
- [ ] Update remaining API routes
- [ ] Update frontend components
- [ ] Test all functionality

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Get your database connection string from Settings > Database

### 3. Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_DATABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data (optional)
npm run db:seed
```

### 5. Verify Migration
```bash
npm run migrate:check
```

## 📊 Database Schema

The following tables have been created:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and profiles |
| `wallets` | User wallet balances |
| `transactions` | Transaction records |
| `notifications` | User and system notifications |
| `support_tickets` | Customer support tickets |
| `admin_logs` | Admin action logs |
| `prices` | Token price history |
| `system_settings` | System configuration |

## 🔄 API Changes

### Authentication
- All auth operations now use Supabase Auth
- OAuth providers (Google, GitHub) supported
- Password reset functionality included

### Database Operations
- All database operations use Prisma ORM
- Same API structure, different implementation
- Better type safety with Prisma

### Example API Route Update
```javascript
// Before (Appwrite)
import { notificationHelpers, authHelpers } from '@/lib/appwrite';
const notifications = await notificationHelpers.getUserNotifications(user.$id);

// After (Supabase + Prisma)
import { databaseHelpers } from '@/lib/database';
import { authHelpers } from '@/lib/supabase';
const notifications = await databaseHelpers.notifications.getUserNotifications(user.id);
```

## 🧪 Testing the Migration

### 1. Check Database Connection
```bash
npm run db:studio
```

### 2. Test Authentication
- Try signing up a new user
- Test sign in/sign out
- Test OAuth providers

### 3. Test API Routes
- Test notification endpoints
- Test transaction endpoints
- Test admin endpoints

### 4. Test Frontend
- Check all pages load correctly
- Test user interactions
- Verify data persistence

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env.local`
   - Ensure Supabase project is active

2. **Authentication Errors**
   - Verify Supabase URL and anon key
   - Check OAuth provider configuration

3. **Prisma Client Errors**
   - Run `npm run db:generate`
   - Check if schema is pushed: `npm run db:push`

4. **API Route Errors**
   - Check imports are updated
   - Verify database helpers are working

### Getting Help

1. Check the migration helper: `npm run migrate:check`
2. Review the setup guide: `SUPABASE_SETUP.md`
3. Check Prisma documentation: https://prisma.io/docs
4. Check Supabase documentation: https://supabase.com/docs

## 📈 Benefits of Migration

### Performance
- Faster database queries with Prisma
- Better connection pooling
- Optimized PostgreSQL performance

### Developer Experience
- Type-safe database operations
- Better error handling
- Improved debugging

### Scalability
- PostgreSQL can handle larger datasets
- Better indexing and query optimization
- Horizontal scaling options

### Features
- Real-time subscriptions with Supabase
- Better authentication options
- Advanced PostgreSQL features

## 🔄 Rollback Plan

If you need to rollback:

1. Restore the original `package.json`
2. Restore Appwrite files from git history
3. Update environment variables
4. Revert API route changes

## 📝 Next Steps

1. Complete API route updates
2. Update frontend components
3. Test all functionality
4. Deploy to production
5. Monitor performance

## 🤝 Support

If you encounter issues during migration:

1. Check the troubleshooting section
2. Review the setup documentation
3. Test with the migration helper script
4. Check Supabase and Prisma documentation

