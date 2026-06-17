// Premier Million — coquille desktop (Electron, option A).
// Affiche l'application web deployee dans une fenetre native.
// AUCUN secret ni serveur embarque ici : la cle Anthropic, la base Postgres et
// NextAuth restent strictement cote serveur (cf. CLAUDE.md §12). Ce process ne
// fait qu'ouvrir une fenetre et y charger une URL.

const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// ── Config URL ────────────────────────────────────────────────────────────
// L'app installee se connecte a la prod (URL gravee ci-dessous au build).
// Pour developper contre un serveur local, surcharge sans toucher au code :
//   Windows : $env:PREMIER_MILLION_URL="http://localhost:3000"; npm start
//   bash    : PREMIER_MILLION_URL="http://localhost:3000" npm start
const DEFAULT_URL = "https://premier-million-production.up.railway.app";
const APP_URL = process.env.PREMIER_MILLION_URL || DEFAULT_URL;

let APP_ORIGIN = null;
try {
  APP_ORIGIN = new URL(APP_URL).origin;
} catch {
  APP_ORIGIN = null;
}

// ── Persistance taille / position de la fenetre ─────────────────────────────
const stateFile = path.join(app.getPath("userData"), "window-state.json");

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return {};
  }
}

function saveState(win) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();
  try {
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ ...bounds, maximized: win.isMaximized() })
    );
  } catch {
    // disque plein / droits — non critique, on ignore
  }
}

let mainWindow = null;

function loadApp() {
  if (mainWindow) mainWindow.loadURL(APP_URL);
}

function createWindow() {
  const state = loadState();

  mainWindow = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 860,
    x: state.x,
    y: state.y,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#0b0b0f",
    title: "Premier Million",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (state.maximized) mainWindow.maximize();

  mainWindow.once("ready-to-show", () => mainWindow.show());

  const wc = mainWindow.webContents;

  // Liens target=_blank / window.open → navigateur systeme (jamais dans l'app).
  wc.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Navigation vers une autre origine → navigateur systeme.
  wc.on("will-navigate", (event, url) => {
    try {
      if (APP_ORIGIN && new URL(url).origin !== APP_ORIGIN) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      // URL invalide — on laisse Electron gerer
    }
  });

  // Serveur injoignable / hors-ligne → page de repli.
  wc.on("did-fail-load", (event, errorCode, _desc, _url, isMainFrame) => {
    // -3 = ERR_ABORTED (navigation annulee volontairement) → on ignore
    if (isMainFrame && errorCode !== -3) {
      mainWindow.loadFile(path.join(__dirname, "error.html"), {
        query: { target: APP_URL },
      });
    }
  });

  ["resize", "move", "close"].forEach((evt) =>
    mainWindow.on(evt, () => saveState(mainWindow))
  );
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  loadApp();
}

function buildMenu() {
  const goBack = () => {
    const wc = mainWindow && mainWindow.webContents;
    if (!wc) return;
    const nav = wc.navigationHistory;
    if (nav && typeof nav.canGoBack === "function") {
      if (nav.canGoBack()) nav.goBack();
    } else if (wc.canGoBack()) {
      wc.goBack();
    }
  };
  const goForward = () => {
    const wc = mainWindow && mainWindow.webContents;
    if (!wc) return;
    const nav = wc.navigationHistory;
    if (nav && typeof nav.canGoForward === "function") {
      if (nav.canGoForward()) nav.goForward();
    } else if (wc.canGoForward()) {
      wc.goForward();
    }
  };

  const template = [
    {
      label: "Premier Million",
      submenu: [
        {
          label: "Recharger l'app",
          accelerator: "CmdOrCtrl+R",
          click: () => loadApp(),
        },
        { type: "separator" },
        { role: "quit", label: "Quitter" },
      ],
    },
    {
      label: "Edition",
      submenu: [
        { role: "undo", label: "Annuler" },
        { role: "redo", label: "Retablir" },
        { type: "separator" },
        { role: "cut", label: "Couper" },
        { role: "copy", label: "Copier" },
        { role: "paste", label: "Coller" },
        { role: "selectAll", label: "Tout selectionner" },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { label: "Precedent", accelerator: "Alt+Left", click: goBack },
        { label: "Suivant", accelerator: "Alt+Right", click: goForward },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom 100 %" },
        { role: "zoomIn", label: "Zoom +" },
        { role: "zoomOut", label: "Zoom -" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Plein ecran" },
        { role: "toggleDevTools", label: "Outils de developpement" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Cycle de vie (instance unique) ──────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
