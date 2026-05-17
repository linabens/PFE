const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Get the first non-loopback, non-APIPA IPv4 address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const entry of iface) {
      if (
        entry.family === 'IPv4' &&
        !entry.internal &&
        !entry.address.startsWith('169.254')
      ) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

const ip = getLocalIP();
const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.js');

// Patch LOCAL_IP in constants.js
let src = fs.readFileSync(constantsPath, 'utf8');
const updated = src.replace(
  /const LOCAL_IP = '[^']*';/,
  `const LOCAL_IP = '${ip}';`
);

if (src !== updated) {
  fs.writeFileSync(constantsPath, updated, 'utf8');
  console.log(`Updated LOCAL_IP → ${ip}`);
} else {
  console.log(`LOCAL_IP already set to ${ip}`);
}

console.log('Starting Expo...\n');

const expo = spawn('npx', ['expo', 'start', '--lan'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

expo.on('exit', (code) => process.exit(code ?? 0));
