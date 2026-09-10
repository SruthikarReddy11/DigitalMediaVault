const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function setup() {
  console.log('[Setup yt-dlp] Checking environment...');

  // 1. Check if already runnable via python/pip
  try {
    const cmd = process.platform === 'win32' ? 'python -m yt_dlp --version' : 'python3 -m yt_dlp --version';
    execSync(cmd, { stdio: 'ignore' });
    console.log('[Setup yt-dlp] yt-dlp is already available via Python module.');
    return;
  } catch {}

  // 2. Try installing via pip / pip3
  try {
    console.log('[Setup yt-dlp] Trying pip install yt-dlp...');
    const pipCmd = process.platform === 'win32'
      ? 'pip install --no-cache-dir yt-dlp'
      : 'pip3 install --no-cache-dir yt-dlp || pip install --no-cache-dir yt-dlp';
    execSync(pipCmd, { stdio: 'inherit' });
    console.log('[Setup yt-dlp] Successfully installed yt-dlp via pip.');
    return;
  } catch (err) {
    console.log('[Setup yt-dlp] Pip install was not available or failed. Falling back to standalone binary download...');
  }

  // 3. Download standalone binary
  const binDir = path.join(__dirname, '..', 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const isWindows = process.platform === 'win32';
  const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
  const targetPath = path.join(binDir, binName);

  if (fs.existsSync(targetPath)) {
    console.log(`[Setup yt-dlp] Standalone binary already exists at ${targetPath}`);
    if (!isWindows) {
      try { fs.chmodSync(targetPath, 0o755); } catch {}
    }
    return;
  }

  const downloadUrl = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  console.log(`[Setup yt-dlp] Downloading standalone binary from ${downloadUrl}...`);
  try {
    await downloadFile(downloadUrl, targetPath);
    if (!isWindows) {
      fs.chmodSync(targetPath, 0o755);
    }
    console.log(`[Setup yt-dlp] Successfully downloaded and set executable at ${targetPath}`);
  } catch (downloadErr) {
    console.warn(`[Setup yt-dlp] Warning: Failed to download standalone binary: ${downloadErr.message}`);
  }
}

setup().catch((e) => {
  console.warn('[Setup yt-dlp] Setup finished with notice:', e.message);
});
