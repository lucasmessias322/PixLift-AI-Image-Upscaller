// app.whenReady().then(createWindow)
import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "child_process";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    minWidth: 800,
    minHeight: 600,

    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true, // Ativa o context isolation
      nodeIntegration: false, // Desativa a integração direta do Node.js no frontend
      webSecurity: false,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

ipcMain.handle("enhanceImage", async (_, inputPath: string) => {
  const outputPath = inputPath.replace(/(\.\w+)$/, "_enhanced$1");
  const esrganExecutable = path.join(
    process.env.APP_ROOT!,
    "real-esrgan",
    "realesrgan-ncnn-vulkan.exe"
  );

  const command = `"${esrganExecutable}" -i "${inputPath}" -o "${outputPath}"`;
  console.log("iniciando Melhoria da imagens: " + inputPath);

  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing Real-ESRGAN:", stderr);
        reject(stderr);
      } else {
        console.log("Real-ESRGAN output:", stdout);
        // Aqui, você pode ajustar o caminho para que ele seja acessível corretamente
        const filePath = `file://${outputPath}`;
        resolve(filePath); // Passar o caminho no formato file://
      }
    });
  });
});

// Quit when all windows are closed, except on macOS
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
