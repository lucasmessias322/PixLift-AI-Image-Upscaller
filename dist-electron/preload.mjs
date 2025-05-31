"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Agora enhanceImage aceita um terceiro parâmetro: selectedFolder
  enhanceImage: (inputPath, selectedModel, selectedFolder) => electron.ipcRenderer.invoke("enhanceImage", inputPath, selectedModel, selectedFolder),
  // Função para chamar o diálogo de seleção de pasta
  selectFolder: () => electron.ipcRenderer.invoke("selectFolder"),
  onEnhanceProgress: (callback) => {
    electron.ipcRenderer.on("enhance-progress", (_, progress) => callback(progress));
  },
  removeEnhanceProgressListener: (callback) => {
    electron.ipcRenderer.removeListener("enhance-progress", callback);
  },
  onCurrentImageUpdate: (callback) => electron.ipcRenderer.on("current-image-update", (event, imagePath) => callback(imagePath)),
  removeCurrentImageUpdateListener: (callback) => electron.ipcRenderer.removeListener("current-image-update", callback)
});
