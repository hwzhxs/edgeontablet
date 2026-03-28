const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1366,
    height: 1024,
    title: 'Edge iPad - Copilot Side Pane',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
});

app.on('window-all-closed', () => app.quit());
