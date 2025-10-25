const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Run a shell command synchronously in the given cwd and print output or a failure message.
// This ensures `npm ls` runs in the correct directory (root or frontend).
function run(cmd, cwd) {
  try {
    const out = execSync(cmd, { stdio: 'pipe', cwd, encoding: 'utf8' });
    console.log(`\n=== ${cwd || 'root'} ===\n${out}`);
  } catch (e) {
    console.log(`\n=== ${cwd || 'root'} ===\n(FAILED) ${e.message}`);
    if (e.stdout) console.log(e.stdout.toString());
  }
}

console.log('Checking React installation trees (root then frontend)...');

// Check root install: shows if React is installed at project root (should be empty for frontend-managed React)
run('npm ls react --all --depth=0', process.cwd());

// Check frontend only if the folder exists — prevents the "frontend/frontend" ENOENT error we saw
const frontendDir = path.join(process.cwd(), 'frontend');
if (fs.existsSync(frontendDir)) {
  run('npm ls react --all --depth=0', frontendDir);
} else {
  // Helpful error when frontend folder doesn't exist or path is wrong
  console.log(`\n=== frontend ===\n(FAILED) frontend directory not found at ${frontendDir}`);
}
