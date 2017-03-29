const { app, BrowserWindow } = require('electron')
const path = require('path');
const url = require('url');
const glob = require('glob')

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 350
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, '/views/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.webContents.openDevTools();

  win.on('closed', () => {
    win = null;
  })
}

function loadMainProcess() {
  let files = glob.sync(path.join(__dirname, 'main-process/**/*.js'));
  files.forEach(function (file) {
    require(file);
  });
}

loadMainProcess();

app.on('ready', createWindow);

app.on('activate', () => {
  if (!win) {
    createWindow();
  }
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
