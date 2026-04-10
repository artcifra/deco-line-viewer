const { app, BrowserWindow, screen } = require('electron');
const path = require('node:path');

function getPreferredDisplay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  return displays.find((display) => display.id !== primaryDisplay.id) || primaryDisplay;
}

function centerBoundsOnDisplay(display, width, height) {
  const area = display.workArea;
  return {
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    width,
    height
  };
}

function applyWindowsKiosk(window, targetDisplay) {
  const display = targetDisplay || screen.getDisplayMatching(window.getBounds());
  window.setBounds(display.bounds);
  window.setKiosk(true);
  window.focus();
}

function moveWindowsKioskToNextDisplay(window) {
  const displays = screen.getAllDisplays();
  if (displays.length < 2) return;

  const currentDisplay = screen.getDisplayMatching(window.getBounds());
  const currentIndex = displays.findIndex((display) => display.id === currentDisplay.id);
  const nextDisplay = displays[(currentIndex + 1) % displays.length];
  applyWindowsKiosk(window, nextDisplay);
}

function createWindow() {
  const isWindows = process.platform === 'win32';
  const preferredDisplay = isWindows ? getPreferredDisplay() : screen.getPrimaryDisplay();
  const initialBounds = isWindows
    ? preferredDisplay.bounds
    : centerBoundsOnDisplay(preferredDisplay, 1440, 900);

  const window = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#f5f7fc',
    autoHideMenuBar: true,
    frame: !isWindows,
    kiosk: false,
    fullscreen: false,
    resizable: !isWindows,
    movable: !isWindows,
    minimizable: !isWindows,
    maximizable: !isWindows,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, 'app', 'index.html'));

  if (isWindows) {
    window.once('ready-to-show', () => {
      applyWindowsKiosk(window, getPreferredDisplay());
    });

    window.webContents.on('before-input-event', (event, input) => {
      const isKeyDown = input.type === 'keyDown';
      if (!isKeyDown) return;

      if (input.control && input.shift && input.key.toLowerCase() === 'd') {
        event.preventDefault();
        moveWindowsKioskToNextDisplay(window);
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
