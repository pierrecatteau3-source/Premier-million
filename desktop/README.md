# Premier Million — App desktop (Electron)

Coquille desktop **option A** : une fenetre native qui affiche l'application web
deployee sur Railway. **Aucun serveur ni secret n'est embarque** — la cle
Anthropic, la base Postgres et NextAuth restent cote serveur (cf. CLAUDE.md §12).
C'est l'equivalent desktop de Slack/VS Code : une coquille native autour d'une
app web distante.

## Lancer en dev

```bash
cd desktop
npm install        # une seule fois (telecharge Electron)
npm start          # ouvre la fenetre
```

## Choisir l'URL chargee

Par defaut la coquille pointe sur la **prod** (URL gravee dans `DEFAULT_URL` en
haut de [`main.js`](main.js)) — c'est cette valeur qui part dans l'`.exe`.

Pour developper contre un serveur **local** sans toucher au code :

```bash
# Windows PowerShell
$env:PREMIER_MILLION_URL="http://localhost:3000"; npm start

# bash
PREMIER_MILLION_URL="http://localhost:3000" npm start
```

## Ce que fait la coquille

- Fenetre unique (instance unique), taille/position memorisees entre lancements.
- Liens externes ouverts dans le navigateur systeme (jamais piege dans l'app).
- Page de repli si le serveur est injoignable (avec re-essai auto).
- Menu FR : Recharger / Edition (copier-coller) / Affichage (zoom, plein ecran).
- Securite : `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.

## Produire l'executable Windows (Phase 3 — plus tard)

```bash
npm run dist       # genere dist/Premier Million Setup x.y.z.exe (NSIS)
```

Avant `npm run dist` :

1. Deposer une icone `assets/icon.ico` (256x256 conseille) et reactiver le champ
   `build.win.icon` dans `package.json`.
2. **Executable non signe** : au 1er lancement, Windows SmartScreen affiche
   « Windows a protege votre PC » → cliquer **Informations complementaires** puis
   **Executer quand meme**. Acceptable en usage solo/amis (pas de certificat
   Authenticode payant requis).
3. L'auto-update (a configurer plus tard) utilise une cle de signature Tauri/
   electron-updater **gratuite**, distincte du certificat Windows.
