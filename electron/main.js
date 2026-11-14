'use strict';

const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 5001;
let backendProcess = null;
let mainWindow = null;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend');

  backendProcess = spawn('node', ['src/server.js'], {
    cwd: backendPath,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: 'pipe',
  });

  backendProcess.stdout.on('data', (d) => {
    console.log('[Backend]', d.toString().trim());
  });

  backendProcess.stderr.on('data', (d) => {
    console.error('[Backend ERR]', d.toString().trim());
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[Backend] Exited with code ${code}, signal ${signal}`);
  });
}

function waitForBackend(retries = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    function attempt() {
      const req = http.get(`http://localhost:${PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          return resolve();
        }
        retry();
      });

      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (retries-- <= 0) {
        return reject(new Error('Backend did not respond in time on port ' + PORT));
      }
      setTimeout(attempt, interval);
    }

    attempt();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    title: 'PathFinder — AI Career Counselling',
    backgroundColor: '#0a0f1d',
    show: false, // Don't show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Log renderer errors to help debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  // Handle external links by opening them in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  console.log('[Electron] App starting...');
  startBackend();

  try {
    console.log('[Electron] Waiting for backend to become ready...');
    await waitForBackend();
    console.log('[Electron] Backend is live, opening window...');
    createWindow();
  } catch (err) {
    console.error('[Electron] Failed to start backend:', err.message);
    dialog.showErrorBox(
      'PathFinder Launch Error',
      `Failed to connect to backend server:\n\n${err.message}\n\nPlease verify that your .env file is present and port ${PORT} is free.`
    );
    app.quit();
  }
});

function cleanupBackend() {
  if (backendProcess) {
    try {
      console.log('[Electron] Stopping backend server...');
      backendProcess.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
    backendProcess = null;
  }
}

app.on('before-quit', cleanupBackend);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    cleanupBackend();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
