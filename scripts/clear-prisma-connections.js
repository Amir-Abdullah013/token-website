// Script to clear Prisma connections and restart the development server
const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Clearing Prisma connections and restarting development server...');

// Function to kill Node.js processes
function killNodeProcesses() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('taskkill /f /im node.exe', (error) => {
        if (error) {
          console.log('No Node.js processes to kill');
        } else {
          console.log('✅ Killed existing Node.js processes');
        }
        resolve();
      });
    } else {
      exec('pkill -f "next"', (error) => {
        if (error) {
          console.log('No Next.js processes to kill');
        } else {
          console.log('✅ Killed existing Next.js processes');
        }
        resolve();
      });
    }
  });
}

// Function to clear Prisma cache
function clearPrismaCache() {
  return new Promise((resolve) => {
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Prisma generate had issues:', stderr);
      } else {
        console.log('✅ Prisma client regenerated');
      }
      resolve();
    });
  });
}

// Main function
async function main() {
  try {
    console.log('🔄 Step 1: Killing existing processes...');
    await killNodeProcesses();
    
    console.log('⏳ Waiting 3 seconds for processes to fully terminate...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔄 Step 2: Clearing Prisma cache...');
    await clearPrismaCache();
    
    console.log('⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🚀 Step 3: Starting fresh development server...');
    console.log('💡 The development server should now start without Prisma connection issues.');
    console.log('💡 If you still see errors, try running: npm run dev');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

main();
