const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'src', 'web');
const electronAppDir = path.join(rootDir, 'src', 'electron', 'app');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function copyWebToElectronApp() {
  cleanDir(electronAppDir);
  fs.cpSync(webDir, electronAppDir, { recursive: true });
}

function main() {
  if (!fs.existsSync(webDir)) {
    throw new Error(`Web source directory not found: ${webDir}`);
  }

  copyWebToElectronApp();
  console.log(`Prepared Electron app from ${path.relative(rootDir, webDir)} to ${path.relative(rootDir, electronAppDir)}`);
}

main();
