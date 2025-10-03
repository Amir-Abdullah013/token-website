# Complete Setup Guide - Supabase + Prisma Migration

## 🚀 Quick Start

### 1. Environment Variables Setup

Create a `.env.local` file in your project root:

```env
# Supabase Configuration (for client-side)
NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (for Prisma - server-side)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google OAuth Configuration (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

## 🔧 Environment Variables Explained

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Supabase project URL for client-side | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | Database connection string for Prisma | `postgresql://postgres:password@db.your-project.supabase.co:5432/postgres` |

### Optional Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789-abcdefghijklmnop.apps.googleusercontent.com` |

## 🛠️ Helper Scripts

### Environment Setup
```bash
# Create .env.local template
npm run setup:env

# Check environment variables
npm run env:check

# Check migration status
npm run env:migration-check
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Development
```bash
# Fix import issues
npm run fix-imports

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Invalid supabaseUrl" Error
**Problem**: `NEXT_PUBLIC_DATABASE_URL` is not a valid Supabase URL
**Solution**: Ensure your URL is in the format `https://your-project.supabase.co`

#### 2. "Module not found: Can't resolve '@/lib/appwrite'"
**Problem**: Old import statements still exist
**Solution**: Run `npm run fix-imports`

#### 3. "Missing environment variables"
**Problem**: Required environment variables not set
**Solution**: Run `npm run env:check` and update your `.env.local`

### Environment Variable Validation

The application includes automatic validation that will:
- ✅ Check if all required variables are set
- ⚠️ Warn about missing optional variables
- 🔧 Provide fallback values for development

### Development vs Production

#### Development
- Uses fallback values for missing environment variables
- Shows warnings in console
- Allows building without all variables set

#### Production
- Requires all environment variables to be set
- No fallback values
- Strict validation

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js          # Supabase client & auth helpers
│   ├── database.js          # Database operations (Prisma)
│   ├── prisma.js            # Prisma client
│   └── env-config.js        # Environment configuration
├── components/              # React components
├── app/                     # Next.js app directory
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.js             # Database seeding
```

## 🚀 Deployment

### 1. Set Environment Variables
Set all required environment variables in your deployment platform (Vercel, Netlify, etc.)

### 2. Build and Deploy
```bash
npm run build
npm start
```

### 3. Database Setup
Run the database setup commands in your deployment environment:
```bash
npm run db:generate
npm run db:push
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter issues:

1. Check the console for error messages
2. Verify your environment variables with `npm run env:check`
3. Run `npm run fix-imports` to fix any import issues
4. Check the troubleshooting section above

## ✨ Features

- ✅ **Supabase Authentication**: Secure user authentication
- ✅ **Prisma ORM**: Type-safe database operations
- ✅ **Real-time Features**: Supabase real-time subscriptions
- ✅ **OAuth Integration**: Google OAuth support
- ✅ **Environment Validation**: Automatic configuration checking
- ✅ **Development Tools**: Helper scripts for setup and maintenance


