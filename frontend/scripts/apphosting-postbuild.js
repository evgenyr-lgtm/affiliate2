const fs = require('fs');
const path = require('path');

const root = process.cwd();
const source = path.join(root, '.next', 'routes-manifest.json');
const standaloneDir = path.join(root, '.next', 'standalone', '.next');
const destination = path.join(standaloneDir, 'routes-manifest.json');

try {
  if (!fs.existsSync(source)) {
    console.warn('apphosting-postbuild: routes-manifest.json not found, skipping.');
    process.exit(0);
  }

  fs.mkdirSync(standaloneDir, { recursive: true });
  fs.copyFileSync(source, destination);
  console.log('apphosting-postbuild: copied routes-manifest.json into standalone bundle.');
} catch (error) {
  console.error('apphosting-postbuild: failed to copy routes-manifest.json:', error);
  process.exit(1);
}
