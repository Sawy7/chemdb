const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow} = electron;

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
});
