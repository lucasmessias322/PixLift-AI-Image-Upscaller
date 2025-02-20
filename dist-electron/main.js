import { ipcMain, app, dialog, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import process from "node:process";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1300,
    height: 940,
    minHeight: 500,
    minWidth: 600,
    backgroundColor: "#171717",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      //contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function parseProgressFromLine(line) {
  const regex = /(\d+(?:[.,]\d+)?)\s*%/;
  const match = line.match(regex);
  if (match) {
    const progress = parseFloat(match[1].replace(",", "."));
    return progress >= 0 && progress <= 100 ? progress : null;
  }
  return null;
}
function handleProcessData(data, event) {
  const lines = data.toString().split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.includes("%")) {
      const progress = parseProgressFromLine(line);
      if (progress !== null) {
        event.sender.send("enhance-progress", progress.toFixed(2));
      }
    }
  }
}
ipcMain.handle(
  "enhanceImage",
  async (event, inputPath, selectedModel, outputFolder) => {
    const folder = outputFolder || app.getPath("pictures");
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    const outputPath = path.join(folder, `${baseName}_${selectedModel}${ext}`);
    const esrganExecutable = path.join(
      process.env.APP_ROOT,
      "realesrgan-ncnn-vulkan-20220424-windows",
      "realesrgan-ncnn-vulkan.exe"
    );
    console.log(selectedModel);
    const args = ["-i", inputPath, "-o", outputPath, "-n", selectedModel];
    console.log("Iniciando melhoria da imagem:", inputPath);
    event.sender.send("current-image-update", inputPath);
    event.sender.send("enhance-progress", 0);
    return new Promise((resolve, reject) => {
      const childProcess = spawn(esrganExecutable, args);
      childProcess.stdout.on("data", (data) => {
        handleProcessData(data, event);
      });
      childProcess.stderr.on("data", (data) => {
        handleProcessData(data, event);
      });
      childProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Processo concluído!");
          event.sender.send("enhance-progress", 100);
          resolve(`file://${outputPath}`);
        } else {
          reject(`Processo falhou com código: ${code}`);
        }
      });
    });
  }
);
ipcMain.handle("selectFolder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecione a pasta para salvar a imagem melhorada",
    properties: ["openDirectory"],
    defaultPath: app.getPath("pictures")
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return app.getPath("pictures");
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
