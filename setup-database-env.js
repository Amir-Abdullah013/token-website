const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up database environment...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local already exists');
  
  // Read current content
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if DATABASE_URL is set
  if (envContent.includes('DATABASE_URL=')) {
    console.log('✅ DATABASE_URL is already set');
  } else {
    console.log('❌ DATABASE_URL is missing');
    console.log('Please add DATABASE_URL to your .env.local file');
    console.log('Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/tokenapp');
  }
} else {
  console.log('❌ .env.local does not exist');
  console.log('Creating .env.local with basic configuration...\n');
  
  const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/tokenapp

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local created successfully');
    console.log('⚠️  Please update DATABASE_URL with your actual database connection string');
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
    console.log('\nPlease create .env.local manually with the following content:');
    console.log(envContent);
  }
}

console.log('\n📋 Next steps:');
console.log('1. Update DATABASE_URL in .env.local with your actual database connection string');
console.log('2. Restart the development server: npm run dev');
console.log('3. Test the admin users page: http://localhost:3000/admin/users');
console.log('4. Test the API directly: http://localhost:3000/test-admin-users');

