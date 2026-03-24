'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const REPO = 'oxvault/scanner';
const BINARY_NAME = 'oxvault';
const PKG_VERSION = require('../package.json').version;

// Map process.platform → GoReleaser OS name
function getOS() {
  switch (process.platform) {
    case 'linux':   return 'linux';
    case 'darwin':  return 'darwin';
    case 'win32':   return 'windows';
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

// Map process.arch → GoReleaser arch name
function getArch() {
  switch (process.arch) {
    case 'x64':   return 'amd64';
    case 'arm64': return 'arm64';
    default:
      throw new Error(`Unsupported architecture: ${process.arch}`);
  }
}

// Fetch JSON from a URL, following redirects, resolving with parsed body
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const request = (target) => {
      https.get(target, { headers: { 'User-Agent': 'oxvault-npm-installer' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} fetching ${target}`));
        }
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${target}: ${e.message}`));
          }
        });
      }).on('error', reject);
    };
    request(url);
  });
}

// Download a URL to a local file, following redirects
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (target) => {
      https.get(target, { headers: { 'User-Agent': 'oxvault-npm-installer' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} downloading ${target}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      }).on('error', reject);
    };
    request(url);
  });
}

// Resolve the version to download: try GitHub latest release, fall back to package version
async function resolveVersion() {
  try {
    const data = await fetchJSON(
      `https://api.github.com/repos/${REPO}/releases/latest`
    );
    if (data && data.tag_name) {
      // Strip leading 'v' if present
      return data.tag_name.replace(/^v/, '');
    }
  } catch (e) {
    console.warn(`[oxvault] Could not fetch latest release from GitHub (${e.message}). Falling back to package version ${PKG_VERSION}.`);
  }
  return PKG_VERSION;
}

async function main() {
  let goos, goarch;
  try {
    goos  = getOS();
    goarch = getArch();
  } catch (e) {
    console.error(`[oxvault] ${e.message}`);
    console.error('[oxvault] You can install oxvault manually from https://github.com/oxvault/scanner/releases');
    process.exit(0); // Non-fatal — let npm install succeed
  }

  const version = await resolveVersion();
  const ext     = goos === 'windows' ? '.zip' : '.tar.gz';
  const archive = `scanner_${version}_${goos}_${goarch}${ext}`;
  const url     = `https://github.com/${REPO}/releases/download/v${version}/${archive}`;

  const binDir      = path.join(__dirname, '..', 'bin');
  const binaryName  = goos === 'windows' ? `${BINARY_NAME}.exe` : BINARY_NAME;
  const binaryDest  = path.join(binDir, binaryName);
  const tmpArchive  = path.join(os.tmpdir(), archive);

  // Ensure bin/ directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log(`[oxvault] Downloading v${version} for ${goos}/${goarch}...`);
  console.log(`[oxvault] ${url}`);

  try {
    await downloadFile(url, tmpArchive);
  } catch (e) {
    console.error(`[oxvault] Download failed: ${e.message}`);
    console.error(`[oxvault] Please install manually from https://github.com/oxvault/scanner/releases`);
    process.exit(0); // Non-fatal
  }

  console.log(`[oxvault] Extracting binary...`);

  try {
    if (ext === '.tar.gz') {
      // tar is available on Linux, macOS, and Windows 10 1803+
      execSync(`tar xzf "${tmpArchive}" -C "${binDir}" "${BINARY_NAME}"`, { stdio: 'inherit' });
    } else {
      // .zip for Windows — use PowerShell's Expand-Archive
      execSync(
        `powershell -Command "Expand-Archive -Force -Path '${tmpArchive}' -DestinationPath '${binDir}'"`,
        { stdio: 'inherit' }
      );
    }
  } catch (e) {
    console.error(`[oxvault] Extraction failed: ${e.message}`);
    console.error(`[oxvault] Please install manually from https://github.com/oxvault/scanner/releases`);
    // Clean up partial archive
    try { fs.unlinkSync(tmpArchive); } catch (_) {}
    process.exit(0); // Non-fatal
  }

  // Clean up downloaded archive
  try { fs.unlinkSync(tmpArchive); } catch (_) {}

  // Verify the binary landed where we expect
  if (!fs.existsSync(binaryDest)) {
    console.error(`[oxvault] Binary not found at ${binaryDest} after extraction.`);
    console.error(`[oxvault] Please install manually from https://github.com/oxvault/scanner/releases`);
    process.exit(0);
  }

  // Make executable on Unix
  if (goos !== 'windows') {
    fs.chmodSync(binaryDest, 0o755);
  }

  console.log(`[oxvault] Installed successfully → ${binaryDest}`);
}

main().catch((e) => {
  console.error(`[oxvault] Unexpected error during install: ${e.message}`);
  process.exit(0); // Non-fatal — let npm install succeed
});
