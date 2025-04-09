import { ipcMain as u, app as i, dialog as j, BrowserWindow as f } from "electron";
import { fileURLToPath as v } from "node:url";
import n from "node:path";
import { spawn as x } from "child_process";
import s from "node:process";
const h = n.dirname(v(import.meta.url));
s.env.APP_ROOT = n.join(h, "..");
const m = s.env.VITE_DEV_SERVER_URL, U = n.join(s.env.APP_ROOT, "dist-electron"), P = n.join(s.env.APP_ROOT, "dist");
s.env.VITE_PUBLIC = m ? n.join(s.env.APP_ROOT, "public") : P;
let r;
function w() {
  r = new f({
    icon: n.join(s.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1300,
    height: 940,
    minHeight: 500,
    minWidth: 600,
    title: "PixLift",
    backgroundColor: "#171717",
    webPreferences: {
      preload: n.join(h, "preload.mjs"),
      //contextIsolation: true,
      nodeIntegration: !0,
      nodeIntegrationInWorker: !0,
      webSecurity: !1
    }
  }), r.setMenuBarVisibility(!1), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), m ? r.loadURL(m) : r.loadFile(n.join(P, "index.html"));
}
function D(e) {
  const t = /(\d+(?:[.,]\d+)?)\s*%/, a = e.match(t);
  if (a) {
    const o = parseFloat(a[1].replace(",", "."));
    return o >= 0 && o <= 100 ? o : null;
  }
  return null;
}
function p(e, t) {
  const a = e.toString().split(/\r?\n/);
  for (let o of a)
    if (o = o.trim(), !!o && o.includes("%")) {
      const c = D(o);
      c !== null && t.sender.send("enhance-progress", c.toFixed(2));
    }
}
u.handle(
  "enhanceImage",
  async (e, t, a, o) => {
    const c = o || i.getPath("pictures"), _ = n.basename(t, n.extname(t)), R = n.extname(t), g = n.join(c, `${_}_${a}${R}`), E = i.isPackaged ? s.resourcesPath : s.env.APP_ROOT, I = n.join(
      E,
      "realesrgan-ncnn-vulkan-20220424-windows",
      "realesrgan-ncnn-vulkan.exe"
    );
    console.log(a);
    const T = ["-i", t, "-o", g, "-n", a];
    return console.log("Iniciando melhoria da imagem:", t), e.sender.send("current-image-update", t), e.sender.send("enhance-progress", 0), new Promise((b, O) => {
      const d = x(I, T);
      d.stdout.on("data", (l) => {
        p(l, e);
      }), d.stderr.on("data", (l) => {
        p(l, e);
      }), d.on("close", (l) => {
        l === 0 ? (console.log("Processo concluído!"), e.sender.send("enhance-progress", 100), b(`file://${g}`)) : O(`Processo falhou com código: ${l}`);
      });
    });
  }
);
u.handle("selectFolder", async () => {
  const e = await j.showOpenDialog({
    title: "Selecione a pasta para salvar a imagem melhorada",
    properties: ["openDirectory"],
    defaultPath: i.getPath("pictures")
  });
  return !e.canceled && e.filePaths.length > 0 ? e.filePaths[0] : i.getPath("pictures");
});
i.on("window-all-closed", () => {
  s.platform !== "darwin" && (i.quit(), r = null);
});
i.on("activate", () => {
  f.getAllWindows().length === 0 && w();
});
i.whenReady().then(w);
export {
  U as MAIN_DIST,
  P as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
