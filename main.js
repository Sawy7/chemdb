const {app, BrowserWindow, ipcMain} = require('electron');
const url = require('url');
const path = require('path');
var fs = require('fs');
var Client = require('node-ftp');
const {autoUpdater} = require("electron-updater");

const userData = app.getPath('userData');

let mainWindow;

//Čekání na ready
app.on('ready', function() {
  //check pretty important files
  if (fs.existsSync(path.resolve(__dirname, userData + "/config.json"))) {
  } else {
    var configback = {
      "online-component": 0
    }
    fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
  }
  if (fs.existsSync(path.resolve(__dirname, userData + "/chemikalie_json.json"))) {
  } else {
    var chemikalieback = {
      "Chemikalie": [
        {
          "nazev": "Testovací chemikálie",
          "vzorec": "H2O",
          "trivialne": "-",
          "mnozstvi": "",
          "jednotka": "g",
          "cistota": "",
          "explosive": "0",
          "flammable": "0",
          "oxidising": "0",
          "gasunderpressure": "0",
          "corrosive": "0",
          "toxicity": "0",
          "health": "0",
          "chronichealth": "0",
          "environmental": "0",
          "poznamka": "",
          "vyloucit": "0"
        }
      ]
    }
    fs.writeFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"), JSON.stringify(chemikalieback, null, 2));
  }
  if (fs.existsSync(path.resolve(__dirname, userData + "/lastclaim.json"))) {
  } else {
    fs.writeFileSync(path.resolve(__dirname, userData + "/lastclaim.json"), JSON.stringify(0, null, 2));
  }
  mainWindow = new BrowserWindow({ width: 1060, height: 720});
  //mainWindow.webContents.openDevTools();
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  autoUpdater.checkForUpdates();
});

app.on('window-all-closed', function(){
  var timestampback = JSON.parse(fs.readFileSync(path.resolve(__dirname, userData + "/timestamp.json")));
  var parsedconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, userData + "/config.json")));
  timestampback.abandonlock = 1;
  fs.writeFileSync(path.resolve(__dirname, userData + "/timestamp.json"), JSON.stringify(timestampback, null, 2));
  var c = new Client();
  c.on('ready', function() {
    c.put(path.resolve(__dirname, userData + "/timestamp.json"), 'timestamp.json', function(err) {
      if (err) throw err;
      c.end();
      app.quit();
    }); 
  });
  c.connect({host: parsedconfig["ip"], user: parsedconfig["user"], password: parsedconfig["password"]}); 
});

// Notifikace pro BrowserWindow
autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updateReady')
});

// Signál pro vypnutí a update
ipcMain.on("quitAndInstall", (event, arg) => {
    autoUpdater.quitAndInstall();
})
