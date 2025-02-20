import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  dialog,
} from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn } from "child_process";
import process from "node:process";

const require = createRequire(import.meta.url);
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

/**
 * Cria a janela principal da aplicação.
 */
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
      webSecurity: false,
    },
  });

  // Garante que a barra de menu esteja oculta
  win.setMenuBarVisibility(false);

  // Envia mensagem ao renderer quando a janela terminar de carregar
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Carrega a URL do dev ou o arquivo HTML gerado
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

/**
 * Extrai o valor de progresso de uma linha de texto.
 * Retorna o número (entre 0 e 100) ou null se não encontrar.
 *
 * @param line Linha de texto contendo o progresso.
 */
function parseProgressFromLine(line: string): number | null {
  const regex = /(\d+(?:[.,]\d+)?)\s*%/;
  const match = line.match(regex);
  if (match) {
    const progress = parseFloat(match[1].replace(",", "."));
    return progress >= 0 && progress <= 100 ? progress : null;
  }
  return null;
}

/**
 * Processa os dados de saída do processo e emite o progresso via IPC.
 *
 * @param data Dados recebidos (stdout/stderr) do processo.
 * @param event Evento IPC para envio do progresso.
 */
function handleProcessData(data: Buffer | string, event: IpcMainInvokeEvent) {
  const lines = data.toString().split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // Apenas processa linhas que contenham '%' indicando progresso
    if (line.includes("%")) {
      const progress = parseProgressFromLine(line);
      if (progress !== null) {
        event.sender.send("enhance-progress", progress.toFixed(2));
      }
    }
  }
}

/**
 * Manipulador IPC para a função de upscale da imagem.
 * Executa o comando utilizando spawn e emite o progresso para o renderer.
//  */
// ipcMain.handle(
//   "enhanceImage",
//   async (
//     event: IpcMainInvokeEvent,
//     inputPath: string,
//     selectedModel: string
//   ) => {
//     // Define o caminho de saída da imagem
//     const outputPath = inputPath.replace(/(\.\w+)$/, `_enhanced$1`);

//     // Define o executável e os argumentos
//     const esrganExecutable = path.join(
//       process.env.APP_ROOT!,
//       "real-esrgan",
//       "realesrgan-ncnn-vulkan.exe"
//     );
//     const args = ["-i", inputPath, "-o", outputPath, "-n", selectedModel];

//     console.log("Iniciando melhoria da imagem:", inputPath);
//     event.sender.send("current-image-update", inputPath);
//     event.sender.send("enhance-progress", 0);
//     return new Promise<string>((resolve, reject) => {
//       // Inicia o processo com spawn
//       const childProcess = spawn(esrganExecutable, args);

//       // Lida com a saída padrão e erros em tempo real
//       childProcess.stdout.on("data", (data) => {
//         handleProcessData(data, event);
//       });
//       childProcess.stderr.on("data", (data) => {
//         handleProcessData(data, event);
//       });

//       // Quando o processo finalizar, garante que o progresso seja 100 em caso de sucesso
//       childProcess.on("close", (code) => {
//         if (code === 0) {
//           console.log("Processo concluído!");
//           event.sender.send("enhance-progress", 100);
//           resolve(`file://${outputPath}`);
//         } else {
//           reject(`Processo falhou com código: ${code}`);
//         }
//       });
//     });
//   }
// );

ipcMain.handle(
  "enhanceImage",
  async (
    event: IpcMainInvokeEvent,
    inputPath: string,
    selectedModel: string,
    outputFolder?: string // novo parâmetro opcional para a pasta de saída
  ) => {
    // Se nenhuma pasta for informada, utiliza a pasta de imagens padrão do sistema.
    const folder = outputFolder || app.getPath("pictures");
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    const outputPath = path.join(folder, `${baseName}_${selectedModel}${ext}`);

    // Configuração do executável e argumentos
    const esrganExecutable = path.join(
      process.env.APP_ROOT!,
      "realesrgan-ncnn-vulkan-20220424-windows",
      "realesrgan-ncnn-vulkan.exe"
    );

    console.log(selectedModel);

    const args = ["-i", inputPath, "-o", outputPath, "-n", selectedModel];

    console.log("Iniciando melhoria da imagem:", inputPath);
    event.sender.send("current-image-update", inputPath);
    event.sender.send("enhance-progress", 0);
    return new Promise<string>((resolve, reject) => {
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
    defaultPath: app.getPath("pictures"),
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return app.getPath("pictures");
});

// Eventos para controle do ciclo de vida da aplicação
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
