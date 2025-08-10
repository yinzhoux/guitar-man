const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
let dbWrapper;
const { initDb, insertTab, updateTab, getAllTabs, deleteTabById } = require('./database');

const LIB_ROOT = path.join(app.getPath('documents'), 'TabTamer', 'Library');

function ensureLib() {
  if (!fs.existsSync(LIB_ROOT)) fs.mkdirSync(LIB_ROOT, { recursive: true });
}

async function bootstrap() {
  ensureLib();
  dbWrapper = await initDb(path.join(LIB_ROOT, 'tabs.db')); // wrapper {db, dbPath}
  createMainWindow();
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

function createViewerWindow(tab) {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('viewer.html');
  win.webContents.once('did-finish-load', () => win.webContents.send('viewer:load', tab));
}

app.whenReady().then(() => { Menu.setApplicationMenu(null); bootstrap(); });

app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('tabs:list', (_e, query) => {
  const all = getAllTabs(dbWrapper);
  const filtered = (() => {
    if (!query) return all;
    const { text = '', style = '', difficulty = '' } = query;
    const t = text.trim().toLowerCase();
    return all.filter(tab => {
      if (t && !(tab.title.toLowerCase().includes(t) || tab.artist.toLowerCase().includes(t) || (tab.tags||[]).some(tag => tag.toLowerCase().includes(t)))) return false;
      if (style && tab.style !== style) return false;
      if (difficulty && tab.difficulty !== difficulty) return false;
      return true;
    });
  })();
  return filtered.map(tab => ({
    ...tab,
    computedPaths: tab.image_files.map(f => 'file://' + path.join(LIB_ROOT, tab.id, f))
  }));
});
ipcMain.handle('tabs:add-dialog', async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
  if (parent) parent.focus();
  const result = await dialog.showOpenDialog(parent, { title: '选择吉他谱图片', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Images', extensions: ['png','jpg','jpeg','gif'] }] });
  if (result.canceled) return [];
  return result.filePaths;
});
ipcMain.handle('tabs:create', (_e, payload) => insertTab(dbWrapper, LIB_ROOT, payload));
ipcMain.handle('tabs:delete', (_e, id) => deleteTabById(dbWrapper, LIB_ROOT, id));
ipcMain.handle('tabs:update', (_e, payload) => updateTab(dbWrapper, LIB_ROOT, payload));
ipcMain.on('viewer:open', (_e, tab) => {
  const full = { ...tab, computedPaths: tab.image_files.map(f => 'file://' + path.join(LIB_ROOT, tab.id, f)) };
  createViewerWindow(full);
});
ipcMain.handle('global:enter-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isFullScreen()) win.setFullScreen(true);
  return true;
});
ipcMain.handle('global:exit-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && win.isFullScreen()) win.setFullScreen(false);
  return true;
});