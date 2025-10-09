const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting development server to fix Prisma connection issues...');

// Kill any existing Next.js processes
if (process.platform === 'win32') {
  // Windows
  spawn('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'inherit' });
} else {
  // Unix-like systems
  spawn('pkill', ['-f', 'next'], { stdio: 'inherit' });
}

// Wait a moment for processes to be killed
setTimeout(() => {
  console.log('🚀 Starting fresh development server...');
  
  // Start the development server
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  devServer.on('error', (error) => {
    console.error('❌ Error starting development server:', error);
  });
  
  devServer.on('exit', (code) => {
    console.log(`Development server exited with code ${code}`);
  });
  
}, 2000);
