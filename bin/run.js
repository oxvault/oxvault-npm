#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows   = process.platform === 'win32';
const binaryName  = isWindows ? 'oxvault.exe' : 'oxvault';
const binaryPath  = path.join(__dirname, binaryName);

if (!fs.existsSync(binaryPath)) {
  console.error(
    '[oxvault] Binary not found at ' + binaryPath + '.\n' +
    '[oxvault] The postinstall step may have failed. Try reinstalling:\n' +
    '[oxvault]   npm install -g oxvault\n' +
    '[oxvault] Or download the binary manually from:\n' +
    '[oxvault]   https://github.com/oxvault/scanner/releases'
  );
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: false,
});

child.on('error', (err) => {
  console.error(`[oxvault] Failed to start binary: ${err.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code !== null ? code : 1);
});
