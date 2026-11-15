'use strict';

const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 5001;
let backendProcess = null;
let mainWindow = null;

function startBackend() {
  const fs = require('fs');
  const isPackaged = app.isPackaged;
  const backendPath = isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', 'backend');

  // In packaged app, process.execPath is the Electron binary which acts as Node when ELECTRON_RUN_AS_NODE=1
  const nodeExec = isPackaged ? process.execPath : 'node';

  const backendEnv = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1',
    DATABASE_URL: 'postgresql://neondb_owner:npg_t56SpJUvaYNM@ep-shiny-unit-az77p0l9-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30',
    DATABASE_URL_POOLED: 'postgresql://neondb_owner:npg_t56SpJUvaYNM@ep-shiny-unit-az77p0l9-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30',
  };

  const envPath = path.join(backendPath, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let val = match[2] || '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          backendEnv[match[1]] = val;
        }
      }
    } catch (e) {
      console.warn('Could not read backend .env:', e);
    }
  }

  backendProcess = spawn(nodeExec, ['src/server.js'], {
    cwd: backendPath,
    env: backendEnv,
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
