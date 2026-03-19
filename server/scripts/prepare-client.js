const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const clientDistPath = path.join(__dirname, '../../client/dist/index.html');
const clientPath = path.join(__dirname, '../../client');

if (!fs.existsSync(clientDistPath)) {
  console.log('⚠️  Client build not found! Starting install and build...');
  try {
    console.log('📦 Running npm install in client...');
    execSync('npm install', { cwd: clientPath, stdio: 'inherit' });

    console.log('🏗️  Running npm run build in client...');
    execSync('npm run build', { cwd: clientPath, stdio: 'inherit' });
    
    console.log('✅ Client successfully built!');
  } catch (error) {
    console.error('❌ Error during client build:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Client build found, skipping build.');
}
