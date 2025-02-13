"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
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
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  enhanceImage: (inputPath, selectedModel) => electron.ipcRenderer.invoke("enhanceImage", inputPath, selectedModel),
  onEnhanceProgress: (callback) => {
    electron.ipcRenderer.on("enhance-progress", (_, progress) => callback(progress));
  },
  removeEnhanceProgressListener: (callback) => {
    electron.ipcRenderer.removeListener("enhance-progress", callback);
  },
  onCurrentImageUpdate: (callback) => electron.ipcRenderer.on(
    "current-image-update",
    (event, imagePath) => callback(imagePath)
  ),
  removeCurrentImageUpdateListener: (callback) => electron.ipcRenderer.removeListener("current-image-update", callback)
});
