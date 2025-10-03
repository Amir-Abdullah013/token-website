#!/usr/bin/env node

const https = require('https');

console.log('🔍 Google OAuth Configuration Fixer');
console.log('=====================================\n');

// Test the OAuth URL generation
async function testOAuthUrl() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/oauth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get OAuth URL');
    }

    const data = await response.json();
    const url = new URL(data.url);
    const params = new URLSearchParams(url.search);
    
    const redirectUri = decodeURIComponent(params.get('redirect_uri'));
    const clientId = params.get('client_id');
    
    console.log('✅ OAuth URL generated successfully');
    console.log('📋 Current Configuration:');
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   Full OAuth URL: ${data.url}\n`);
    
    console.log('🔧 Google OAuth App Configuration Required:');
    console.log('=============================================');
    console.log('1. Go to: https://console.developers.google.com/');
    console.log('2. Select your project');
    console.log('3. Go to "APIs & Services" → "Credentials"');
    console.log('4. Click on your OAuth 2.0 Client ID');
    console.log('5. In "Authorized redirect URIs" section:');
    console.log(`   ➤ Add: ${redirectUri}`);
    console.log('6. In "Authorized JavaScript origins" section:');
    console.log('   ➤ Add: http://localhost:3000');
    console.log('7. Click "SAVE"');
    console.log('8. Wait 2-3 minutes for changes to propagate\n');
    
    console.log('🧪 Testing Instructions:');
    console.log('=======================');
    console.log('1. Visit: http://localhost:3000/debug-oauth-redirect');
    console.log('2. Click "Test OAuth URL" button');
    console.log('3. You should see Google OAuth page (not error)');
    console.log('4. Select your Google account');
    console.log('5. You should be redirected back to your app\n');
    
    console.log('❌ If you still get redirect_uri_mismatch:');
    console.log('   • Double-check the redirect URI matches exactly');
    console.log('   • Make sure you\'re using http:// not https://');
    console.log('   • Check for extra/missing slashes');
    console.log('   • Wait a few minutes for Google changes to propagate\n');
    
    return { redirectUri, clientId, fullUrl: data.url };
    
  } catch (error) {
    console.error('❌ Error testing OAuth URL:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Next.js app is running (npm run dev)');
    console.log('2. Check your environment variables in .env.local');
    console.log('3. Verify NEXT_PUBLIC_GOOGLE_CLIENT_ID is set correctly');
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Google OAuth configuration check...\n');
  
  const result = await testOAuthUrl();
  
  if (result) {
    console.log('✅ Configuration check completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Update your Google OAuth app with the redirect URI shown above');
    console.log('   2. Test the OAuth flow using the debug tool');
    console.log('   3. Your Google OAuth should work without redirect_uri_mismatch errors');
  } else {
    console.log('❌ Configuration check failed. Please fix the issues above and try again.');
  }
}

// Run the script
main().catch(console.error);
