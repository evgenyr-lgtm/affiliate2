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
const pagesManifestSource = path.join(root, '.next', 'server', 'pages-manifest.json');
const pagesManifestDestination = path.join(standaloneRoot, 'server', 'pages-manifest.json');
const nextFontManifestSource = path.join(root, '.next', 'server', 'next-font-manifest.json');
const nextFontManifestDestination = path.join(standaloneRoot, 'server', 'next-font-manifest.json');
const fontManifestSource = path.join(root, '.next', 'server', 'font-manifest.json');
const fontManifestDestination = path.join(standaloneRoot, 'server', 'font-manifest.json');
const pagesDirSource = path.join(root, '.next', 'server', 'pages');
const pagesDirDestination = path.join(standaloneRoot, 'server', 'pages');
const webpackRuntimeSource = path.join(root, '.next', 'server', 'webpack-runtime.js');
const webpackRuntimeDestination = path.join(standaloneRoot, 'server', 'webpack-runtime.js');
const serverChunksSource = path.join(root, '.next', 'server', 'chunks');
const serverChunksDestination = path.join(standaloneRoot, 'server', 'chunks');
const buildManifestSource = path.join(root, '.next', 'build-manifest.json');
const buildManifestDestination = path.join(standaloneRoot, 'build-manifest.json');

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

  if (fs.existsSync(pagesManifestSource)) {
    fs.mkdirSync(path.dirname(pagesManifestDestination), { recursive: true });
    fs.copyFileSync(pagesManifestSource, pagesManifestDestination);
    console.log('apphosting-postbuild: copied pages-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: pages-manifest.json not found, skipping.');
  }

  if (fs.existsSync(nextFontManifestSource)) {
    fs.mkdirSync(path.dirname(nextFontManifestDestination), { recursive: true });
    fs.copyFileSync(nextFontManifestSource, nextFontManifestDestination);
    console.log('apphosting-postbuild: copied next-font-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: next-font-manifest.json not found, skipping.');
  }

  if (fs.existsSync(fontManifestSource)) {
    fs.mkdirSync(path.dirname(fontManifestDestination), { recursive: true });
    fs.copyFileSync(fontManifestSource, fontManifestDestination);
    console.log('apphosting-postbuild: copied font-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: font-manifest.json not found, skipping.');
  }

  if (fs.existsSync(pagesDirSource)) {
    fs.mkdirSync(pagesDirDestination, { recursive: true });
    if (fs.cpSync) {
      fs.cpSync(pagesDirSource, pagesDirDestination, { recursive: true });
    } else {
      const copyDir = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyDir(pagesDirSource, pagesDirDestination);
    }
    console.log('apphosting-postbuild: copied pages directory into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: pages directory not found, skipping.');
  }

  if (fs.existsSync(webpackRuntimeSource)) {
    fs.mkdirSync(path.dirname(webpackRuntimeDestination), { recursive: true });
    fs.copyFileSync(webpackRuntimeSource, webpackRuntimeDestination);
    console.log('apphosting-postbuild: copied webpack-runtime.js into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: webpack-runtime.js not found, skipping.');
  }

  if (fs.existsSync(serverChunksSource)) {
    fs.mkdirSync(serverChunksDestination, { recursive: true });
    if (fs.cpSync) {
      fs.cpSync(serverChunksSource, serverChunksDestination, { recursive: true });
    } else {
      const copyDir = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyDir(serverChunksSource, serverChunksDestination);
    }
    console.log('apphosting-postbuild: copied server chunks into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: server chunks not found, skipping.');
  }

  if (fs.existsSync(buildManifestSource)) {
    fs.mkdirSync(standaloneRoot, { recursive: true });
    fs.copyFileSync(buildManifestSource, buildManifestDestination);
    console.log('apphosting-postbuild: copied build-manifest.json into standalone bundle.');
  } else {
    console.warn('apphosting-postbuild: build-manifest.json not found, skipping.');
  }
} catch (error) {
  console.error('apphosting-postbuild: failed to copy routes-manifest.json:', error);
  process.exit(1);
}
