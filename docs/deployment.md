# Déploiement Railway — Premier Million

Guide pas-à-pas pour déployer **Premier Million** sur Railway, de zéro.

> Avant de commencer, lis `CLAUDE.md` §10 (Déploiement Railway) et §11 (Secrets) pour le contexte.

---

## 1. Pré-requis

- Compte [Railway](https://railway.com) (login GitHub recommandé)
- Repo GitHub `premier-million` créé (peut être public, voir CLAUDE.md §1.2)
- Railway CLI installé localement *(facultatif mais recommandé pour les migrations)* :
  ```bash
  npm i -g @railway/cli
  railway login
  ```

---

## 2. Création du projet Railway

### 2.1 Nouveau projet

1. Va sur https://railway.com/new
2. Choisis **Deploy from GitHub repo**
3. Sélectionne le repo `premier-million`
4. Railway détecte automatiquement Next.js (via `package.json`)
5. **Renomme le projet** : `Settings` → `Name` → **Premier million**

### 2.2 Ajouter la base PostgreSQL

1. Dans le projet, clique sur **+ New** → **Database** → **Add PostgreSQL**
2. Railway provisionne un Postgres et expose automatiquement `DATABASE_URL` en variable de référence
3. Dans le service web (Premier million) :
   - `Variables` → `+ New Variable`
   - Nom : `DATABASE_URL`
   - Valeur : `${{Postgres.DATABASE_URL}}` *(référence vers le service Postgres)*
   - **Ne PAS hardcoder l'URL** — utilise la référence pour qu'elle se mette à jour automatiquement

---

## 3. Configuration des variables d'environnement

Dans `Project → Premier million → Variables`, ajoute les variables suivantes :

| Variable | Valeur | Comment l'obtenir |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Référence (cf. §2.2) |
| `NEXTAUTH_URL` | `https://<projet>.up.railway.app` | URL Railway après le 1er deploy |
| `NEXTAUTH_SECRET` | *(32 chars random)* | `openssl rand -base64 32` |
| `SOLO_EMAIL` | ton email | — |
| `SOLO_PASSWORD_HASH` | hash bcrypt | `node -e "require('bcryptjs').hash('TON_MDP', 12).then(h => console.log(h.replace(/\$/g, '\\$')))"` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com |
| `ANTHROPIC_ANALYSES_ENABLED` | `true` | killswitch |
| `ANTHROPIC_MAX_CALLS_PER_DAY` | `10` | rate-limit global |
| `ANTHROPIC_MAX_OUTPUT_TOKENS` | `1200` | ~900 mots |
| `CRON_SECRET` | *(32 chars random)* | `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Railway le set automatiquement, normalement pas besoin |

**Pour l'URL** : Railway génère un domaine par défaut lors du 1er déploiement. Tu peux le récupérer dans `Settings → Networking → Public Networking → Generate Domain`. Mets ensuite cette URL dans `NEXTAUTH_URL`.

⚠️ **Si `NEXTAUTH_URL` ne matche pas l'URL réelle, l'auth casse silencieusement** (callback URL invalide).

---

## 4. Build & déploiement

### 4.1 Build automatique

Le fichier `railway.json` à la racine configure le builder **Railpack** (qui a remplacé Nixpacks chez Railway en 2025) :

```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/login",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- **`npm run build`** lance `prisma generate && next build`
- **`npm run start`** lance `next start` qui respecte la variable `PORT` injectée par Railway
- **Healthcheck** sur `/login` (page publique, ne touche pas la DB → safe)

### 4.2 Premier déploiement

1. Push sur `main` → Railway build et déploie automatiquement
2. Suis les logs dans `Deployments → Latest → View logs`
3. Le **premier build échouera côté Prisma** si la DB n'a pas de tables (migrations pas encore appliquées) — passe à §5.

---

## 5. Migrations Prisma (étape critique)

**Stratégie choisie** (cf. CLAUDE.md §10.3) : **migrations manuelles via Railway CLI**, pas dans le build automatique.

### 5.1 Première migration (création des tables)

Une fois la DB Postgres provisionnée :

```bash
# Depuis ton poste, dans le dossier du projet
railway link             # sélectionne le projet "Premier million"
railway service          # sélectionne le service web (pas Postgres)
railway run npx prisma migrate deploy
```

Ou via le service Postgres directement :

```bash
railway run --service Postgres -- bash -c 'echo $DATABASE_URL'
# Récupère l'URL, puis depuis ton poste :
DATABASE_URL="<url-récupérée>" npx prisma migrate deploy
```

### 5.2 Migrations suivantes

À chaque PR qui modifie `prisma/schema.prisma` :

1. **En local** : `npm run db:migrate` → crée une nouvelle migration dans `prisma/migrations/`
2. **Commit + push** la migration
3. **Après merge sur `main`** : avant ou après le déploiement Railway (avant idéalement) :
   ```bash
   railway run npm run db:migrate:deploy
   ```

⚠️ **Ne PAS** ajouter `prisma migrate deploy` au `build` command — risque de bloquer le déploiement en cas de conflit migration et de mettre l'app hors-ligne.

### 5.3 Seed (optionnel)

Si tu veux pré-remplir des données :

```bash
railway run npm run db:seed
```

---

## 6. Cron quotidien (`/api/cron/snapshot`)

L'app a un endpoint cron qui prend un snapshot quotidien des actifs (`app/api/cron/snapshot/route.ts`). Sur Vercel c'était dans `vercel.json`. Sur Railway, deux options.

### Option A — Cron Railway natif (recommandé)

1. Dans le projet : **+ New** → **Empty Service** → renomme en `Cron - Snapshot`
2. Dans ce nouveau service, va dans `Settings → Cron`
3. Configure :
   - **Schedule** : `0 17 * * *` (17h UTC = 19h Paris)
   - **Image** : `curlimages/curl:latest`
   - **Start command** :
     ```
     curl -sf -H "Authorization: Bearer $CRON_SECRET" https://<ton-url>.up.railway.app/api/cron/snapshot
     ```
4. Variables du service cron :
   - `CRON_SECRET` : référence vers le service web → `${{Premier million.CRON_SECRET}}`

### Option B — GitHub Actions schedule

Si tu préfères découpler du facturation Railway, crée `.github/workflows/cron-snapshot.yml` :

```yaml
name: Daily snapshot
on:
  schedule:
    - cron: "0 17 * * *"
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sf -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            ${{ secrets.APP_URL }}/api/cron/snapshot
```

Et configure `CRON_SECRET` + `APP_URL` dans `Settings → Secrets → Actions` du repo GitHub.

**Recommandation** : Option A pour le MVP (tout dans un seul outil), Option B si tu veux séparer.

---

## 7. Domaine custom (optionnel)

1. `Settings → Networking → Custom Domain → + Custom Domain`
2. Renseigne ton domaine (ex : `premier-million.app`)
3. Railway donne un CNAME à configurer chez ton registrar
4. SSL géré automatiquement via Let's Encrypt (5-30 min)
5. **Met à jour `NEXTAUTH_URL`** avec le nouveau domaine
6. Redeploy

---

## 8. Vérification post-déploiement

Check-list après chaque déploiement majeur :

- [ ] L'app charge sur l'URL Railway
- [ ] `/login` s'affiche correctement
- [ ] Tu peux te connecter avec `SOLO_EMAIL` / mot de passe
- [ ] Le dashboard affiche tes données (DB OK)
- [ ] Les prix live crypto/equity remontent (yahoo-finance + CoinGecko OK)
- [ ] Aucune erreur dans les logs Railway (`Deployments → Latest → Logs`)
- [ ] Le cron snapshot s'est exécuté (vérifier le lendemain à 17h UTC)

---

## 9. Coûts estimés (MVP solo)

| Service | Plan | Coût/mois |
|---|---|---|
| Railway Hobby | Trial gratuit puis $5/mo crédit | $5 (couvre largement le MVP) |
| Postgres (inclus) | — | inclus dans le crédit |
| Anthropic API | pay-as-you-go | <$2/mois si analyses désactivées, $5-15/mois avec usage modéré |
| Domaine custom | OVH/Cloudflare/Gandi | ~$10/an |

**Total MVP solo** : ~$5-20/mois selon usage Claude.

---

## 10. Troubleshooting

### Le build échoue avec `prisma generate` error

→ Vérifie que `DATABASE_URL` est bien renseigné dans les variables Railway (même si non utilisé au build, `prisma generate` lit le datasource).

### NextAuth callback URL invalid

→ `NEXTAUTH_URL` ne matche pas l'URL réelle. Re-vérifie qu'elle est en `https://` et identique à celle du browser.

### Healthcheck timeout

→ L'app met trop de temps à démarrer (>100s). Augmente `healthcheckTimeout` dans `railway.json`, ou check les logs pour une erreur runtime.

### `Cannot find module '@/lib/generated/prisma/client'`

→ `prisma generate` n'a pas été exécuté avant `next build`. Le `buildCommand` du `railway.json` doit inclure `npm run build` (qui lance `prisma generate && next build`).

### Cron qui ne s'exécute pas

→ Vérifie le service `Cron - Snapshot` dans Railway (logs du dernier run). Si Option B (GitHub Actions), check les runs dans `Actions` du repo.
