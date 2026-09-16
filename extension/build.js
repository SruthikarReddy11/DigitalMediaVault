import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Locate esbuild from root/frontend
let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  try {
    esbuild = require('../frontend/node_modules/esbuild');
  } catch {
    esbuild = require('../../frontend/node_modules/esbuild');
  }
}

const isWatch = process.argv.includes('--watch');
const distDir = path.resolve(__dirname, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyStaticAssets() {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy manifest.json
  fs.copyFileSync(
    path.resolve(__dirname, 'manifest.json'),
    path.resolve(distDir, 'manifest.json')
  );

  // Copy icons
  copyDir(path.resolve(__dirname, 'icons'), path.resolve(distDir, 'icons'));

  // Copy options HTML & CSS
  fs.copyFileSync(
    path.resolve(__dirname, 'src/options/options.html'),
    path.resolve(distDir, 'options.html')
  );
  fs.copyFileSync(
    path.resolve(__dirname, 'src/options/options.css'),
    path.resolve(distDir, 'options.css')
  );

  // Copy content CSS
  fs.copyFileSync(
    path.resolve(__dirname, 'src/content/content.css'),
    path.resolve(distDir, 'content.css')
  );

  console.log('✓ Static assets copied to dist/');
}

async function runBuild() {
  console.log('Building VaultXMedia Chrome Extension...');
  copyStaticAssets();

  const commonConfig = {
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch ? 'inline' : false,
    target: ['chrome110'],
    logLevel: 'info',
  };

  try {
    // 1. Background Service Worker (ESM format)
    await esbuild.build({
      ...commonConfig,
      entryPoints: [path.resolve(__dirname, 'src/background/index.ts')],
      outfile: path.resolve(distDir, 'background.js'),
      format: 'esm',
    });

    // 2. Content Script (IIFE format for browser page isolation)
    await esbuild.build({
      ...commonConfig,
      entryPoints: [path.resolve(__dirname, 'src/content/index.ts')],
      outfile: path.resolve(distDir, 'content.js'),
      format: 'iife',
    });

    // 3. Options Page Script (ESM format)
    await esbuild.build({
      ...commonConfig,
      entryPoints: [path.resolve(__dirname, 'src/options/options.ts')],
      outfile: path.resolve(distDir, 'options.js'),
      format: 'esm',
    });

    console.log('✨ Build completed successfully! Output ready in extension/dist/');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

runBuild();
