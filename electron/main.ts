
import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  dialog,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile } from "child_process";
import { createInterface } from "node:readline";
import process from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuração das pastas do projeto
process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let busy = false; // controle de concorrência

/**
 * Cria a janela principal da aplicação.
 */
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(
      process.env.VITE_PUBLIC,
      "logo.png"
    ),
    width: 1300,
    height: 940,
    minHeight: 500,
    minWidth: 600,
    title: "PixLift",
    backgroundColor: "#171717",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  win.setMenuBarVisibility(false);

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

/**
 * Extrai o valor de progresso de uma linha de texto.
 */
function parseProgressFromLine(line: string): number | null {
  const regex = /(\d+(?:[.,]\d+)?)\s*%/;
  const match = line.match(regex);
  if (match) {
    const val = parseFloat(match[1].replace(",", "."));
    return val >= 0 && val <= 100 ? val : null;
  }
  return null;
}

ipcMain.handle(
  "enhanceImage",
  async (
    event: IpcMainInvokeEvent,
    inputPath: string,
    selectedModel: string,
    outputFolder?: string
  ) => {
    if (busy) {
      throw new Error("Já existe um processo em andamento");
    }
    busy = true;

    try {
      const folder = outputFolder || path.dirname(inputPath);
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);
      const outputPath = path.join(
        folder,
        `${baseName}_${selectedModel}${ext}`
      );

      const basePath = app.isPackaged
        ? process.resourcesPath
        : process.env.APP_ROOT!;
      const esrganExecutable = path.join(
        basePath,
        "realesrgan-ncnn-vulkan-20220424-windows",
        "realesrgan-ncnn-vulkan.exe"
      );

      const args = ["-i", inputPath, "-o", outputPath, "-n", selectedModel];

      console.log("Iniciando melhoria da imagem:", inputPath);
      event.sender.send("current-image-update", inputPath);
      event.sender.send("enhance-progress", 0);

      return await new Promise<string>((resolve, reject) => {
        const child = execFile(esrganExecutable, args, { windowsHide: true });

        // Throttle de envio de progresso (máx. 5x por segundo)
        let lastSent = 0;
        const sendProgress = (p: number) => {
          const now = Date.now();
          if (now - lastSent > 200) {
            event.sender.send("enhance-progress", p.toFixed(2));
            lastSent = now;
          }
        };

        const rlOut = createInterface({ input: child.stdout! });
        rlOut.on("line", (line) => {
          const p = parseProgressFromLine(line.trim());
          if (p !== null) sendProgress(p);
        });

        const rlErr = createInterface({ input: child.stderr! });
        rlErr.on("line", (line) => {
          const p = parseProgressFromLine(line.trim());
          if (p !== null) sendProgress(p);
        });

        child.on("close", (code) => {
          if (code === 0) {
            event.sender.send("enhance-progress", 100);
            resolve(`file://${outputPath}`);
          } else {
            reject(`Processo falhou com código: ${code}`);
          }
        });

        child.on("error", (err) => reject(err.message));
      });
    } finally {
      busy = false;
    }
  }
);

ipcMain.handle("selectFolder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecione a pasta para salvar a imagem melhorada",
    properties: ["openDirectory"],
    defaultPath: app.getPath("pictures"),
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return app.getPath("pictures");
});

// Ciclo de vida da aplicação
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
