const fs = require('fs');
const path = require('path');

const root = process.cwd();
const standaloneBase = path.join(root, '.next', 'standalone');
const standaloneRoot = path.join(standaloneBase, '.next');
const routesSource = path.join(root, '.next', 'routes-manifest.json');
const routesDestination = path.join(standaloneRoot, 'routes-manifest.json');
const middlewareSource = path.join(root, '.next', 'server', 'middleware-manifest.json');
const middlewareDestination = path.join(standaloneRoot, 'server', 'middleware-manifest.json');
const buildIdSource = path.join(root, '.next', 'BUILD_ID');
const buildIdDestination = path.join(standaloneRoot, 'BUILD_ID');
const prerenderSource = path.join(root, '.next', 'prerender-manifest.json');
const prerenderDestination = path.join(standaloneRoot, 'prerender-manifest.json');

try {
  const nestedServer = path.join(standaloneBase, 'frontend', 'server.js');
  const rootServer = path.join(standaloneBase, 'server.js');

  if (!fs.existsSync(rootServer) && fs.existsSync(nestedServer)) {
    fs.copyFileSync(nestedServer, rootServer);
    console.log('apphosting-postbuild: copied nested standalone server.js to root.');
  }

  if (fs.existsSync(routesSource)) {
    fs.mkdirSync(standaloneRoot, { recursive: true });
    fs.copyFileSync(routesSource, routesDestination);
    console.log('apphosting-postbuild: copied routes-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: routes-manifest.json not found, skipping.');
  }

  if (fs.existsSync(middlewareSource)) {
    fs.mkdirSync(path.dirname(middlewareDestination), { recursive: true });
    fs.copyFileSync(middlewareSource, middlewareDestination);
    console.log('apphosting-postbuild: copied middleware-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: middleware-manifest.json not found, skipping.');
  }

  if (fs.existsSync(buildIdSource)) {
    fs.mkdirSync(standaloneRoot, { recursive: true });
    fs.copyFileSync(buildIdSource, buildIdDestination);
    console.log('apphosting-postbuild: copied BUILD_ID into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: BUILD_ID not found, skipping.');
  }

  if (fs.existsSync(prerenderSource)) {
    fs.mkdirSync(standaloneRoot, { recursive: true });
    fs.copyFileSync(prerenderSource, prerenderDestination);
    console.log('apphosting-postbuild: copied prerender-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: prerender-manifest.json not found, skipping.');
  }
} catch (error) {
  console.error('apphosting-postbuild: failed to copy routes-manifest.json:', error);
  process.exit(1);
}
