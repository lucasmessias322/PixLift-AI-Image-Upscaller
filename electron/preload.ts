
import { ipcRenderer, contextBridge } from "electron";

// Expondo a API para o Renderer via contextBridge
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  // Agora enhanceImage aceita um terceiro parâmetro: selectedFolder
  enhanceImage: (inputPath: string, selectedModel: string, selectedFolder?: string) =>
    ipcRenderer.invoke("enhanceImage", inputPath, selectedModel, selectedFolder),

  // Função para chamar o diálogo de seleção de pasta
  selectFolder: () => ipcRenderer.invoke("selectFolder"),

  onEnhanceProgress: (callback: (progress: string) => void) => {
    ipcRenderer.on("enhance-progress", (_, progress) => callback(progress));
  },

  removeEnhanceProgressListener: (callback: (progress: string) => void) => {
    ipcRenderer.removeListener("enhance-progress", callback);
  },

  onCurrentImageUpdate: (callback: (imagePath: string) => void) =>
    ipcRenderer.on("current-image-update", (event, imagePath) => callback(imagePath)),

  removeCurrentImageUpdateListener: (callback: (imagePath: string) => void) =>
    ipcRenderer.removeListener("current-image-update", callback),
});
