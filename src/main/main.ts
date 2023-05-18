/* eslint-disable prettier/prettier */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import { usb } from 'usb';
import { PadStack } from '../classes/padStack';
import { checkConnectedPads, handlePads } from './keypadInit'
import { resolveHtmlPath } from './util';

const AppStore = require('electron-store');

let isQuitting: boolean = false;

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

process.traceProcessWarnings = true;

const createWindow = async () => {

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false)

  mainWindow.on('minimize', function (event) {
      //temp test
  });

  mainWindow.on('close', function (event) {
      //temp test
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  return new Promise((resolve) => {
    mainWindow?.on('ready-to-show', () => {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }
      resolve(mainWindow)
    });
  });
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.disableHardwareAcceleration();

async function checkPads(padStack: PadStack) {
  const connectedPads = await checkConnectedPads(padStack) as any[];
  await handlePads(connectedPads, padStack);
  return connectedPads;
}

app.whenReady().then(async () => {

    await createWindow();

    const tray = new Tray(path.join(__dirname, '../../assets/icons/16x16.png'))
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open', type: 'normal', click: ()=>{
        mainWindow?.show();
      }},
      { type: 'separator'},
      { label: 'Quit', click: ()=> {
          isQuitting = true;
          app.quit();
      }}
    ])
    tray.setToolTip('Minitility')
    tray.setContextMenu(contextMenu)

    // Need to implement a better way of initialization for further methods instead of relying on async/await and Promises

    const AppStorage = new AppStore();

    app.on('activate', () => {
      // OSX solution for recreating window after clicking on the icon in the taskbar
      if (mainWindow === null) createWindow();
    });

    // Main communication channel handler
    ipcMain.on('ipc-app', async (event, msg) => {
      mainWindow?.webContents.send('ipc-app', 1);
    });

    // Initializing:
    // - USB Monitor
    // - Devices Stack collection storage object

    const usbMonitor = usb;
    const padStack = new PadStack();
    // If new compatable pad device added to Device Stack - sending data to renderer
    padStack.emitter.on('added', (data) => {
      mainWindow?.webContents.send('ipc-app', {type: 'device-connected', data: data.padMeta})
    });

    // If compatable pad device removed from Device Stack - sending data to renderer
    padStack.emitter.on('removed', (data) => {
      mainWindow?.webContents.send('ipc-app', {type: 'device-disconnected', data: data.padMeta})
    });

    // Checking if any connected serial device is from minitility eco-system
    await checkPads(padStack);

    // Checking if newly attached device is from minitility eco-system
    usbMonitor.on('attach', async() => {
      await checkPads(padStack);
    })

})
.catch(console.log);
