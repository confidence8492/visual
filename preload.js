const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    const validChannels = ['project-created'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});