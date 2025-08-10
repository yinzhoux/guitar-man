const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listTabs: (query) => ipcRenderer.invoke('tabs:list', query),
  chooseImages: () => ipcRenderer.invoke('tabs:add-dialog'),
  createTab: (data) => ipcRenderer.invoke('tabs:create', data),
  updateTab: (data) => ipcRenderer.invoke('tabs:update', data),
  deleteTab: (id) => ipcRenderer.invoke('tabs:delete', id),
  openViewer: (tab) => ipcRenderer.send('viewer:open', tab),
  onViewerLoad: (cb) => ipcRenderer.on('viewer:load', (_e, tab) => cb(tab)),
  enterFullscreen: () => ipcRenderer.invoke('global:enter-fullscreen'),
  exitFullscreen: () => ipcRenderer.invoke('global:exit-fullscreen')
});
