// @ts-nocheck
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  webContents,
  Menu
} = require('electron');
const { writeFileSync } = require('fs');
const path = require('path');
const url = require('url');

let mainWindow;
let current;
let ready = false;

function makeMenu() {
  const saveOpts = {
    filters: [{ name: 'Markwright', extensions: ['mw', 'markwright'] }]
  };
  return [
    {
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          role: 'open',
          accelerator: 'Cmd+O',
          click: () => {
            const files = dialog.showOpenDialog({ properties: ['openFile'] });
            if (files) {
              current = files[0];
              mainWindow.webContents.send('open', current);
            }
          }
        },
        {
          label: 'Save',
          role: 'save',
          accelerator: 'Cmd+S',
          click() {
            if (current) {
              mainWindow.webContents.send('save', current);
            } else {
              const file = dialog.showSaveDialog(saveOpts);
              if (file) {
                current = file;
                mainWindow.webContents.send('save', file);
              }
            }
          }
        },
        {
          label: 'Save As',
          role: 'save-as',
          accelerator: 'Cmd+Shift+S',
          click: () => {
            const file = dialog.showSaveDialog(saveOpts);
            if (file) {
              mainWindow.webContents.send('save', file);
              current = file;
            }
          }
        },
        {
          label: 'Export as PDF',
          role: 'print',
          accelerator: 'Cmd+Shift+E',
          click() {
            const file = dialog.showSaveDialog({
              filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });
            if (file) {
              const wc = webContents.getAllWebContents().shift();
              wc.printToPDF(
                {
                  marginsType: 1,
                  printBackground: true,
                  pageSize: 'Letter'
                },
                (err, data) => {
                  writeFileSync(file, data);
                }
              );
            }
          }
        },
        { role: 'quit', label: 'Quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    }
  ];
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1050,
    minWidth: 1280,
    titleBarStyle: 'hidden',
    vibrancy: 'dark'
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(makeMenu()));
  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'public/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    ready = false;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('open-file', (e, path) => {

  e.preventDefault();

  if (mainWindow === null) {
    createWindow();
  }

  ipcMain.on('app.ready', () => {
    ready = true;
    mainWindow.webContents.send('open', path);
  });

  if (ready) {
    mainWindow.webContents.send('open', path);
  }
});