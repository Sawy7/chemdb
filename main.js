const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
const {autoUpdater} = require("electron-updater");

let mainWindow;

//Čekání na ready
app.on('ready', function(){
  mainWindow = new BrowserWindow({ width: 1060, height: 720});
  //mainWindow.webContents.openDevTools();
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  autoUpdater.checkForUpdates();
});

// Notifikace pro BrowserWindow
autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updateReady')
});

// Signál pro vypnutí a update
ipcMain.on("quitAndInstall", (event, arg) => {
    autoUpdater.quitAndInstall();
})
