const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isProjectSaved = false;
let componentsLoaded = [];
let filesLoaded = [];
let newProjectWindow;
let colorPickerWindow;
let codeWindow;
let blueprintWindow;
let outputWindow;

function logToFile(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(path.join(__dirname, 'debug.log'), logMessage);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
    frame: true,
    titleBarStyle: 'default'
  });

  mainWindow.maximize();
  mainWindow.loadFile('index.html');
  console.log('Main window loaded:', path.join(__dirname, 'index.html'));
  logToFile('Main window loaded: ' + path.join(__dirname, 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading, DevTools available');
    logToFile('Main window finished loading, DevTools available');
  });
}

function createNewProjectWindow() {
  if (newProjectWindow) {
    newProjectWindow.focus();
    return;
  }

  newProjectWindow = new BrowserWindow({
    width: 500,
    height: 400,
    parent: mainWindow,
    modal: false,
    resizable: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  newProjectWindow.loadFile('new-project.html');
  newProjectWindow.once('ready-to-show', () => {
    newProjectWindow.show();
    console.log('New project window shown:', path.join(__dirname, 'new-project.html'));
    logToFile('New project window shown: ' + path.join(__dirname, 'new-project.html'));
  });
  newProjectWindow.on('closed', () => {
    newProjectWindow = null;
    console.log('New project window closed');
    logToFile('New project window closed');
  });
}

function createSaveProjectWindow() {
  const saveProjectWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    resizable: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  saveProjectWindow.loadFile('save-project.html');
  saveProjectWindow.on('closed', () => {
    isProjectSaved = true;
    componentsLoaded = [];
    filesLoaded = [];
    createNewProjectWindow();
    console.log('Save project window closed, opening new project window');
    logToFile('Save project window closed, opening new project window');
  });
}

function createColorPickerWindow(initialColor, type) {
  if (colorPickerWindow) {
    colorPickerWindow.focus();
    return;
  }

  colorPickerWindow = new BrowserWindow({
    width: 300,
    height: 200,
    parent: mainWindow,
    modal: true,
    resizable: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  colorPickerWindow.loadFile('color-picker.html');
  colorPickerWindow.once('ready-to-show', () => {
    colorPickerWindow.webContents.send('set-initial-color', initialColor, type);
    colorPickerWindow.show();
    console.log('Color picker window shown:', path.join(__dirname, 'color-picker.html'), 'type:', type);
    logToFile('Color picker window shown: ' + path.join(__dirname, 'color-picker.html') + ', type: ' + type);
  });
  colorPickerWindow.on('closed', () => {
    colorPickerWindow = null;
    console.log('Color picker window closed');
    logToFile('Color picker window closed');
  });
}

function createCodeWindow() {
  if (codeWindow) {
    codeWindow.focus();
    return;
  }

  codeWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow,
    modal: false,
    resizable: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  codeWindow.loadFile('code-window.html');
  codeWindow.once('ready-to-show', () => {
    codeWindow.show();
    console.log('Code window shown:', path.join(__dirname, 'code-window.html'));
    logToFile('Code window shown: ' + path.join(__dirname, 'code-window.html'));
  });
  codeWindow.on('closed', () => {
    codeWindow = null;
    console.log('Code window closed');
    logToFile('Code window closed');
  });
}

function createBlueprintWindow() {
  if (blueprintWindow) {
    blueprintWindow.focus();
    return;
  }

  blueprintWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  blueprintWindow.maximize();
  blueprintWindow.loadFile('blueprint-window.html');
  blueprintWindow.once('ready-to-show', () => {
    blueprintWindow.show();
    console.log('Blueprint window shown:', path.join(__dirname, 'blueprint-window.html'));
    logToFile('Blueprint window shown: ' + path.join(__dirname, 'blueprint-window.html'));
  });
  blueprintWindow.on('closed', () => {
    blueprintWindow = null;
    console.log('Blueprint window closed');
    logToFile('Blueprint window closed');
  });
}

function createOutputWindow(windowData) {
  if (outputWindow) {
    outputWindow.focus();
    return;
  }

  outputWindow = new BrowserWindow({
    width: windowData.width,
    height: windowData.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    titleBarStyle: 'default'
  });

  outputWindow.loadFile('output-window.html');
  outputWindow.once('ready-to-show', () => {
    outputWindow.webContents.send('set-window-data', windowData);
    outputWindow.show();
    console.log('Output window shown:', path.join(__dirname, 'output-window.html'), 'data:', windowData);
    logToFile('Output window shown: ' + path.join(__dirname, 'output-window.html'));
  });
  outputWindow.on('closed', () => {
    outputWindow = null;
    console.log('Output window closed');
    logToFile('Output window closed');
  });
}

ipcMain.on('project-created', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-main-content', { message: 'New Project Created' });
    console.log('Project created, updating main window');
    logToFile('Project created, updating main window');
  }
});

ipcMain.on('open-color-picker', (event, initialColor) => {
  createColorPickerWindow(initialColor, 'font');
});

ipcMain.on('open-background-color-picker', (event, initialColor) => {
  createColorPickerWindow(initialColor, 'background');
});

ipcMain.on('open-code-window', () => {
  createCodeWindow();
});

ipcMain.on('open-blueprint-window', () => {
  createBlueprintWindow();
});

ipcMain.on('run-code', (event) => {
  if (mainWindow) {
    mainWindow.webContents.send('get-window-data');
    console.log('Received run-code IPC, requesting window data');
    logToFile('Received run-code IPC, requesting window data');
  }
});

ipcMain.on('window-data', (event, windowData) => {
  createOutputWindow(windowData);
});

ipcMain.on('close-code-window', () => {
  if (codeWindow) {
    codeWindow.close();
    console.log('Received close-code-window IPC, closing code window');
    logToFile('Received close-code-window IPC, closing code window');
  }
});

ipcMain.on('close-blueprint-window', () => {
  if (blueprintWindow) {
    blueprintWindow.close();
    console.log('Received close-blueprint-window IPC, closing blueprint window');
    logToFile('Received close-blueprint-window IPC, closing blueprint window');
  }
});

ipcMain.handle('get-window-data', async () => {
  if (mainWindow) {
    try {
      const result = await mainWindow.webContents.executeJavaScript(`
        ({ width: ${width}, height: ${height}, textBoxes: ${JSON.stringify(textBoxes)} })
      `);
      console.log('Window data retrieved:', result);
      logToFile('Window data retrieved: ' + JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error retrieving window data:', error);
      logToFile('Error retrieving window data: ' + error);
      throw error;
    }
  }
  return {};
});

ipcMain.on('color-confirmed', (event, color, type) => {
  if (mainWindow) {
    mainWindow.webContents.send(type === 'font' ? 'color-selected' : 'background-color-selected', color);
    console.log(`${type === 'font' ? 'Font' : 'Background'} color confirmed:`, color);
    logToFile(`${type === 'font' ? 'Font' : 'Background'} color confirmed: ` + color);
  }
  if (colorPickerWindow) {
    colorPickerWindow.close();
  }
});

ipcMain.on('color-cancelled', () => {
  if (colorPickerWindow) {
    colorPickerWindow.close();
    console.log('Color selection cancelled');
    logToFile('Color selection cancelled');
  }
});

const template = [
  {
    label: 'Electron',
    submenu: [
      { label: 'About Electron', role: 'about' },
      { type: 'separator' },
      { label: 'Quit', role: 'quit' }
    ]
  },
  {
    label: '檔案',
    submenu: [
      {
        label: '新增專案',
        click: async () => {
          if (componentsLoaded.length > 0 || filesLoaded.length > 0) {
            if (isProjectSaved) {
              componentsLoaded = [];
              filesLoaded = [];
              createNewProjectWindow();
            } else {
              createSaveProjectWindow();
            }
          } else {
            createNewProjectWindow();
          }
          console.log('New project clicked, componentsLoaded:', componentsLoaded, 'filesLoaded:', filesLoaded);
          logToFile('New project clicked, componentsLoaded: ' + JSON.stringify(componentsLoaded) + ', filesLoaded: ' + JSON.stringify(filesLoaded));
        }
      },
      {
        label: '開啟專案',
        click: async () => {
          console.log('Open Project clicked');
          logToFile('Open Project clicked');
        }
      }
    ]
  },
  {
    label: '檢視',
    submenu: [
      {
        label: '開啟開發者工具',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.openDevTools();
            console.log('Attempted to open DevTools');
            logToFile('Attempted to open DevTools');
          } else {
            console.log('Failed to open DevTools: mainWindow is null');
            logToFile('Failed to open DevTools: mainWindow is null');
          }
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

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