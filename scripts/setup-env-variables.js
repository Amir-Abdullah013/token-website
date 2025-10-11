#!/usr/bin/env node

/**
 * Comprehensive Environment Variables Setup Script
 * Helps users set up the correct environment variables for Supabase + Prisma
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Environment Variables Setup');
console.log('============================\n');

// Check if .env.local exists
const envPath = '.env.local';
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📄 Found existing .env.local file');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check what variables are already set
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasDatabaseUrl = envContent.includes('DATABASE_URL');
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasPrismaUrl = envContent.includes('DATABASE_URL');
  
  console.log('\n📊 Current Environment Variables:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`DATABASE_URL: ${hasDatabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`DATABASE_URL: ${hasPrismaUrl ? '✅ Set' : '❌ Missing'}`);
  
  if (hasDatabaseUrl && !hasSupabaseUrl) {
    console.log('\n⚠️  IMPORTANT: You have DATABASE_URL set, but this should be used for Prisma, not Supabase!');
    console.log('You need to set NEXT_PUBLIC_SUPABASE_URL for Supabase authentication.');
  }
} else {
  console.log('❌ No .env.local file found');
}

console.log('\n📝 Required Environment Variables:');
console.log('==================================');

console.log('\n🔐 For Supabase Authentication (Client-side):');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');

console.log('\n🗄️  For Prisma Database Operations (Server-side):');
console.log('DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres');

console.log('\n🔑 Optional - Google OAuth:');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID');

console.log('\n📋 Complete .env.local Template:');
console.log('==================================');
const template = `# Supabase Configuration (for client-side authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (for Prisma - server-side database operations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional - Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_NEXT_PUBLIC_GOOGLE_CLIENT_ID`;

console.log(template);

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Update your .env.local file with the correct values');
console.log('2. Get your Supabase project URL and anon key from: https://supabase.com/dashboard');
console.log('3. Get your database connection string from Supabase Settings > Database');
console.log('4. Run: npm run dev');

console.log('\n🔍 How to Get Your Supabase Credentials:');
console.log('=========================================');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > API');
console.log('4. Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL');
console.log('5. Copy "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('6. Go to Settings > Database');
console.log('7. Copy "Connection string" → DATABASE_URL');

console.log('\n✨ Setup complete!');
















