# Premier Million — Instructions globales (CLAUDE.md)

> **Document maître.** Tout agent Claude Code (ou contributeur humain) lit ce fichier en premier avant d'écrire la moindre ligne de code. En cas de conflit avec une autre doc, c'est ce fichier qui fait foi.

---

## 1. Mission & stratégie produit

### 1.1 Mission

Application web personnelle de **suivi de patrimoine vers le premier million d'euros**. Saisie manuelle (pas de scraping bancaire), analyses macro et portefeuille assistées par Claude, visualisation claire de la progression.

### 1.2 Stratégie de diffusion : **"amis-first, compatible freemium"**

| Phase | Public | Auth | Repo | Paiement |
|---|---|---|---|---|
| **MVP (avril 2026)** | Solo (moi) | Email/password | Public GitHub | Aucun |
| **v2.0** | Amis (~5-50 users) | OAuth + allowlist email | Public | Aucun (je paie Claude) |
| **v3.0 (option)** | Public | OAuth ouvert | Public | Stripe freemium |

**Conséquence architecture :** dès aujourd'hui le code doit être **strictement multi-tenant** (toute requête Prisma filtrée par `userId`). Bascule v2→v3 = activer signup public + brancher Stripe, **pas de refonte**.

### 1.3 Principes directeurs

1. **Open source par défaut** — code propre, README soigné, secrets jamais en dur.
2. **Saisie manuelle uniquement** — pas d'API bancaire, pas de scraping. v1.1 ajoutera l'import CSV/PDF via Claude.
3. **Coûts Claude maîtrisés** — cache 30 jours sur toutes les analyses, rate-limit global et par user, kill-switch via `ANTHROPIC_ANALYSES_ENABLED=false`.
4. **Solo-friendly mais multi-tenant clean** — toute la logique métier filtre par `userId` même avec un seul user.
5. **Railway-first** — buildable et déployable sans config exotique.

---

## 2. État actuel & MVP target

### 2.1 Scope MVP (avril 2026)

Les **4 modules bloquants** pour le release MVP :

- ✅ **Dashboard** — patrimoine global, progression vers 1M€, KPIs, saisie inline par pilier
- ✅ **Portefeuille** — 4 piliers (PEA, Crypto, Immo, Autre), CRUD actifs/transactions, prix live crypto/equity
- ✅ **Risque & alertes** — moteur avancé `riskEngine.ts` (4 composantes), jauge, alertes d'allocation
- ✅ **Achievements (gamification light)** — système de succès débloqués, affichage carte/grille, toast de notification

### 2.2 Hors scope MVP (code présent mais non bloquant)

Ces features existent dans le code mais **ne sont pas bloquantes pour le release MVP**. Elles peuvent rester actives en interne ou être désactivées via feature flag :

- **Vision marché / Analyses Claude** — code complet (`/api/analysis`, `/analyse`, `/vision-marche`). Coûte des crédits API → garder désactivé tant qu'on n'a pas validé l'usage.
- **Investissements récurrents** — `RecurringInvestments.tsx` existant, à finaliser pour v1.1.
- **Snapshots / historique** — `/api/cron/snapshot`, `PortfolioChart`. Fonctionnel.

### 2.3 Modules à ne PAS implémenter en MVP

- ❌ Leaderboard — repoussé à v2.0 (ouverture amis)
- ❌ Création de personnage / skins / items — repoussé à v3.0
- ❌ Notifications email — repoussé à v1.2 (cf. roadmap §13)
- ❌ Analytics / monitoring (Plausible/Sentry) — solo MVP, logs Railway suffisent

---

## 3. Stack technique

| Couche | Techno | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 20.x | Aligné avec Railway nixpacks par défaut |
| Framework | Next.js (App Router) | 14.2.x | Pas de migration v15 tant que MVP pas livré |
| UI | React + Tailwind CSS + shadcn/ui | 18 / 3.4 / latest | shadcn copié dans `components/ui/`, pas une dépendance |
| Charts | Recharts | 3.x | |
| Markdown | react-markdown + remark-gfm | latest | Pour rendu analyses Claude |
| ORM | Prisma | 7.5.x | Client généré dans `lib/generated/prisma/` (gitignored) |
| Base de données | PostgreSQL (Railway natif) | 16 | Plugin Postgres Railway provisionne `DATABASE_URL` |
| Auth | NextAuth.js | 4.24.x | MVP : credentials email/password (solo). v2.0 : ajouter OAuth Google |
| IA | Anthropic SDK | 0.78.x | Modèle : Claude Sonnet 4.6 (à confirmer à chaque release) |
| Prix marché | yahoo-finance2 + CoinGecko (fetch direct) | — | Pas de clé API requise actuellement |
| Email (v1.2+) | Resend | — | Pas encore installé |
| Déploiement | **Railway** | — | (Vercel abandonné — voir `vercel.json` à supprimer) |
| Hosting fichiers PDF | local (`pdf-parse`) | — | Pour v1.1 import PDF |

---

## 4. Architecture des dossiers

```
premier-million/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Groupe de routes authentifiées
│   │   ├── analyse/              # Analyses Claude (hors MVP — feature flag)
│   │   ├── dashboard/            # Page d'accueil après login
│   │   ├── historique/           # Évolution + décisions + transactions
│   │   ├── portefeuille/         # Gestion 4 piliers + actifs
│   │   ├── profil/               # Objectifs, allocation cible, décisions
│   │   ├── risque/               # Score + alertes
│   │   ├── succes/               # Achievements (gamification light)
│   │   ├── vision-marche/        # Analyses macro Claude (hors MVP)
│   │   ├── layout.tsx            # Layout authentifié (Sidebar + BottomNav)
│   │   └── loading.tsx           # Skeleton global
│   ├── api/                      # Route handlers
│   │   ├── achievements/         # POST = recheck/unlock
│   │   ├── analysis/             # POST = générer | [horizon] GET = cache (peu utilisé, lecture directe Prisma)
│   │   ├── assets/               # CRUD actifs
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── cron/snapshot/        # Cron Railway quotidien (snapshot patrimoine)
│   │   ├── dashboard/            # GET data dashboard (peu utilisé — pages SSR appellent les services directement)
│   │   ├── decisions/            # CRUD décisions
│   │   ├── portfolio/
│   │   │   ├── history/          # GET historique snapshots
│   │   │   └── summary/          # GET résumé (peu utilisé)
│   │   ├── prices/               # GET prix live (crypto/equity)
│   │   ├── profile/              # GET/PATCH profil user
│   │   ├── recurring-investments/# CRUD + execute
│   │   ├── risk/                 # GET score (peu utilisé)
│   │   ├── snapshots/            # POST/sync
│   │   └── transactions/         # CRUD
│   ├── login/                    # Page login (publique)
│   ├── layout.tsx                # Layout racine (SessionProvider + ThemeProvider)
│   └── page.tsx                  # Redirige vers /dashboard ou /login
├── components/
│   ├── achievements/             # AchievementCard, Grid, Toast, Checker, icons
│   ├── analysis/                 # AnalysisCard (Markdown viewer + régénération)
│   ├── dashboard/                # HeroCard, KpiCard, PilierCards, InlineEdit
│   ├── history/                  # TransactionHistoryTable
│   ├── layout/                   # Header, Sidebar, BottomNav, SessionProvider
│   ├── portfolio/                # AssetManager, AllocationGap, PortfolioChart, PortfolioHero, PilierChart, TransactionForm, RecurringInvestments, MigrationPrompt, AssetPriceRow, DateRangePicker, PortfolioClient
│   ├── profile/                  # ProfileForm, DecisionList
│   ├── providers/                # ThemeProvider
│   ├── risk/                     # RiskGauge, RiskDetail, AlertBanner
│   └── ui/                       # shadcn primitives (button, card, input, etc.)
├── hooks/
│   └── usePrices.ts              # Hook fetch prix live avec batching
├── lib/
│   ├── achievements/definitions.ts    # Catalogue des achievements
│   ├── constants/allocation-types.ts  # Mapping type→pilier, libellés
│   ├── prompts/market-analysis.ts     # Prompts Claude
│   ├── services/                      # Logique métier serveur
│   │   ├── achievements.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── market-data.service.ts
│   │   └── portfolio.service.ts
│   ├── utils/projection.ts            # Calcul intérêts composés
│   ├── analysisRateLimit.ts           # Rate limit Anthropic (user + global)
│   ├── auth.ts                        # Config NextAuth
│   ├── claude.ts                      # Wrapper Anthropic SDK
│   ├── prisma.ts                      # Singleton Prisma client
│   ├── risk.ts                        # Score risque simple (0-1, utilisé /risque)
│   ├── riskEngine.ts                  # Score risque avancé (0-10, utilisé /analyse)
│   ├── session.ts                     # Helper requireSession()
│   └── utils.ts                       # cn() shadcn helper
├── prisma/
│   ├── schema.prisma             # Modèle de données
│   ├── migrations/
│   └── seed.ts                   # Seed dev
├── types/                        # Types métier (PascalCase)
├── docs/                         # Documentation interne (architecture, agents, ADR)
├── public/                       # Assets statiques
├── .env.example                  # Template variables d'env (versionné)
├── .gitignore
├── CLAUDE.md                     # CE FICHIER
├── README.md                     # Doc publique du projet
├── components.json               # Config shadcn
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── railway.json                  # Config build/deploy Railway (à créer)
├── tailwind.config.ts
└── tsconfig.json
```

### 4.1 Convention de nommage des dossiers

- **Routes (`app/(dashboard)/*`) = français** (`portefeuille`, `risque`, `profil`, `historique`, `succes`, `analyse`, `vision-marche`)
- **Composants & lib (`components/*`, `lib/*`) = anglais** (`portfolio`, `risk`, `profile`, `history`, `achievements`, `analysis`)
- **Composants React = PascalCase.tsx** (`HeroCard.tsx`)
- **Helpers/services = camelCase.ts** (`portfolio.service.ts`, `riskEngine.ts`)
- **Variables/fonctions = camelCase**, **Types/Interfaces = PascalCase**, **Constantes = UPPER_SNAKE_CASE**

---

## 5. Architecture de données (modèles Prisma principaux)

> Source de vérité : `prisma/schema.prisma`. Toute relation est strictement liée à un `User` (multi-tenant).

| Modèle | Rôle | Champs clés |
|---|---|---|
| `User` | Compte utilisateur | objectif, ageActuel/ageCible, epargneMensuelle, epargnePrecaution, objectifCroissance, allocationCible |
| `Asset` | Actif détenu | pilier (enum), type, name, pricingMode (manual/live_crypto/live_equity), ticker |
| `Transaction` | Achat/vente d'un actif | assetId, date, quantite, prixEntreeEur, montantInvesti |
| `Snapshot` | Photo valeur d'un actif à une date | assetId, date, value |
| `Decision` | Journal des décisions stratégiques | date, description |
| `Analysis` | Cache des analyses Claude | horizon (1m/3m/6m/1an), type (PORTFOLIO/MARKET), content |
| `RecurringInvestment` | Investissement programmé | assetId, montant, fréquence |
| `Achievement` | Succès débloqué par user | userId, achievementId, unlockedAt |

**Règle d'or** : **toute requête Prisma doit filtrer par `userId`**. Pas d'exception. Pas même en dev.

---

## 6. Conventions de code (à respecter sans exception)

### 6.1 TypeScript

- **Strict mode partout** (`tsconfig.json` `"strict": true`)
- Pas de `any`. Si tu en as besoin, c'est que la modélisation est mauvaise.
- Préfère `type` aux `interface` sauf pour les contrats publics (props de composants).
- Import des types : `import type { Foo } from "..."` si possible.
- Path alias : **toujours `@/`** (configuré dans `tsconfig.json`). Pas de `../../../`.

### 6.2 React / Next.js

- **Server Components par défaut**. Ajoute `"use client"` uniquement si nécessaire (state, effects, browser APIs).
- **Composants** : un fichier = un composant exporté (named export). Pas de default export sauf pour les pages.
- **Props** : toujours typées via `interface Props {}` ou `type Props = {}` au-dessus du composant.
- **Pas de fetch dans Server Components vers ses propres routes API** — appelle directement le service (`@/lib/services/*`).
- **Pas de `useEffect` pour fetch initial** — utilise les Server Components + `await` direct.

### 6.3 Sécurité

- **Anthropic API key strictement server-side**. Aucune lib n'importe `@/lib/claude` côté client.
- **Toujours `requireSession()`** en tête de chaque route handler protégée. Pas d'exception.
- **Validation Zod** pour tout `body` POST/PATCH.
- **Pas de leak d'erreur interne** dans les réponses HTTP — message générique, vrai détail en log serveur.

### 6.4 Commits

- Format : `<type>(<scope>): <subject>` en français OK.
- Types : `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`, `ci`.
- Exemples : `feat(portfolio): ajoute le PnL par pilier`, `fix(risk): corrige le clamp du score`.

---

## 7. ⚠️ Règle absolue avant de coder : **CHECK EXISTANT**

Avant de **créer** un composant, un helper, un service ou un type — **fais l'inventaire de ce qui existe déjà**. Recréer ce qui existe = dette technique immédiate et incohérences UI.

### 7.1 Check-list obligatoire avant d'écrire un nouveau composant

1. **Grep le nom (et synonymes)** dans `components/` :
   ```
   Grep "MonComposant|SimilarName" components/
   ```
2. **Liste les fichiers du module concerné** : si tu vas créer un composant de portefeuille, fais `ls components/portfolio/` d'abord.
3. **Vérifie les conventions de naming** :
   - Page française → composant anglais (voir §4.1)
   - Pas de duplicate avec un suffixe différent (`Card`/`CardV2`/`NewCard`)
4. **Réutilise les primitives shadcn** (`components/ui/`) avant d'écrire ton propre `Button`, `Card`, `Input`, etc.
5. **Réutilise les helpers existants** :
   - `cn()` pour les classes (`@/lib/utils`)
   - `calculateProjection()` pour les calculs financiers (`@/lib/utils/projection`)
   - `requireSession()` pour la session (`@/lib/session`)
   - `getPortfolioSummary()` pour les agrégats portefeuille (`@/lib/services/portfolio.service`)

### 7.2 Check-list avant de créer une route API

1. Liste les routes existantes : `find app/api -name "route.ts"`
2. **La route existe-t-elle déjà ?** Beaucoup de pages SSR appellent directement les services au lieu de leur route API — vérifie les deux.
3. Utilise `requireSession()` + Zod + erreur générique (voir §6.3).

### 7.3 Quand RECRÉER vs ÉTENDRE

- **Étendre** : si le composant existant fait 80% du besoin, ajoute des props (avec defaults pour la rétrocompat).
- **Recréer** : seulement si la sémantique est vraiment différente (ex : `RiskGauge` simple vs avancé — décision à challenger avant).
- **Si tu hésites** → propose les 2 options à l'utilisateur, ne tranche pas seul.

---

## 8. Workflow Git & GitHub

### 8.1 Stratégie de branches : **main protégée + feature branches**

```
main                  ← branche prod, protégée
  ├─ feat/portfolio-pnl
  ├─ fix/risk-score-clamp
  └─ chore/cleanup-dead-code
```

- **Aucun commit direct sur `main`**. Même en solo. Toujours via PR.
- Une feature = une branche = une PR.
- Nom de branche : `<type>/<sujet-kebab-case>`.

### 8.2 Pull Requests

- Titre PR = même format que commit (`feat(scope): sujet`).
- Description = 2-3 lignes max : **pourquoi** (pas **quoi**, le diff parle).
- Test plan : checklist markdown des routes/écrans à valider.
- **Self-review** avant merge (relire le diff complet).
- **Squash and merge** par défaut.

### 8.3 Protection de `main` (à configurer sur GitHub)

- Require PR before merging
- Require status checks to pass (CI typecheck + lint)
- Require linear history
- Pas de force-push autorisé

### 8.4 Sensibilité GitHub : **0 SECRET COMMIT**

Voir §11 pour le détail. Règles non-négociables :

- **`.env`, `.env.local`, `.env.*.local` jamais commités** (déjà dans `.gitignore`).
- **`SOLO_PASSWORD_HASH` jamais commité** (même hashé — c'est un hash bcrypt d'un mot de passe perso).
- **`lib/generated/prisma/` jamais commité** (régénéré au build).
- Si un secret est leaké : rotation immédiate (Anthropic, NEXTAUTH_SECRET) + `git filter-repo` + force-push (cas exceptionnel — me prévenir).

---

## 9. CI / GitHub Actions

À configurer dès la création du repo. Fichier `.github/workflows/ci.yml` (à créer) :

| Job | Trigger | Action |
|---|---|---|
| **typecheck** | push + PR | `npm ci && npx prisma generate && npx tsc --noEmit` |
| **lint** | push + PR | `npm ci && npm run lint` |
| **build** | PR uniquement | `npm ci && npm run build` (sans DB pour vérifier compile) |

**Pas de tests automatisés en MVP** — le coût/bénéfice n'est pas là pour un projet solo en phase d'évolution rapide. À réintroduire avant l'ouverture aux amis (v2.0).

---

## 10. Déploiement Railway

### 10.1 Architecture de déploiement

```
Railway Project: premier-million
├── Service: Web (Next.js)
│   └── Source: GitHub repo (auto-deploy sur push main)
└── Service: Postgres (plugin natif Railway)
    └── DATABASE_URL injecté automatiquement
```

### 10.2 Setup initial (une seule fois)

1. **Créer le projet Railway** : `New Project` → `Deploy from GitHub repo`.
2. **Ajouter le plugin Postgres** : `+ New` → `Database` → `PostgreSQL`. Railway pose `DATABASE_URL` automatiquement.
3. **Variables d'environnement** à ajouter manuellement (voir §11) — ne PAS toucher `DATABASE_URL`.
4. **Healthcheck** : Railway détecte Next.js, le healthcheck pointe `GET /` par défaut.
5. **Build & Start** :
   - Build command : `npm run build` (lance `prisma generate && next build`)
   - Start command : `npm run start`
   - Pas besoin de `nixpacks.toml` — Railway auto-détecte Next.js.

### 10.3 Migrations Prisma au déploiement

**Stratégie recommandée** : migration manuelle via Railway CLI avant chaque release significative.

```bash
# Depuis ta machine, après avoir lié le projet
railway run --service postgres -- npx prisma migrate deploy
```

Alternative auto : ajouter `prisma migrate deploy &&` dans le `build` du `package.json`. **À éviter en MVP** — risque de bloquer le déploiement si conflit migration.

### 10.4 Cron Job

Le cron actuel (`/api/cron/snapshot`) est configuré dans `vercel.json`. Pour Railway :

- Option A (recommandée MVP) : créer un **service Cron Railway** séparé qui hit l'endpoint avec `CRON_SECRET` chaque jour à 17h UTC.
- Option B : externe (GitHub Actions schedule) — moins fiable.

**À supprimer** : `vercel.json` (obsolète depuis migration Railway).

### 10.5 Domaines & SSL

- Domaine par défaut Railway : `<project>.up.railway.app` (SSL auto).
- Domaine custom : configurer DNS CNAME → Railway, SSL auto via Let's Encrypt.
- **`NEXTAUTH_URL`** doit matcher l'URL prod exacte (sinon NextAuth casse).

### 10.6 Fichier `railway.json` (à créer si besoin)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS", "buildCommand": "npm run build" },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## 11. Variables d'environnement & secrets

### 11.1 Liste exhaustive

| Variable | Type | Local | Railway | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | secret | `.env` (manuel) | auto (plugin Postgres) | jamais commité |
| `NEXTAUTH_URL` | config | `http://localhost:3000` | URL Railway prod | doit matcher l'URL exacte |
| `NEXTAUTH_SECRET` | secret | `.env` (manuel) | manual | `openssl rand -base64 32` |
| `SOLO_EMAIL` | config | `.env` (perso) | manual | mon email |
| `SOLO_PASSWORD_HASH` | **secret** | `.env` (perso) | manual | bcrypt 12 rounds, échapper les `$` |
| `ANTHROPIC_API_KEY` | secret | `.env` (perso) | manual | `sk-ant-...` |
| `ANTHROPIC_ANALYSES_ENABLED` | config | `true` | `true` | mettre `false` pour killswitch |
| `ANTHROPIC_MAX_CALLS_PER_DAY` | config | `10` | `10` | rate-limit global |
| `ANTHROPIC_MAX_OUTPUT_TOKENS` | config | `1200` | `1200` | ~900 mots |
| `CRON_SECRET` | secret | `.env` (perso) | manual | protège `/api/cron/snapshot` |
| `RESEND_API_KEY` (v1.2+) | secret | non | manual | quand on ajoutera les digests |
| `GOOGLE_CLIENT_ID` (v2.0+) | secret | non | manual | OAuth ouverture amis |
| `GOOGLE_CLIENT_SECRET` (v2.0+) | secret | non | manual | OAuth ouverture amis |

### 11.2 Règles strictes

1. **Tout secret listé "secret" doit être uniquement dans :**
   - `.env` local (gitignored)
   - Railway Variables (UI ou CLI)
   - 1Password / gestionnaire perso
2. **Tout secret commité même par erreur = rotation immédiate.**
3. **`.env.example` à jour** = source de vérité publique pour les autres devs. Met-le à jour à chaque nouvelle variable.
4. **Logs ne loggent jamais de secret.** Même en dev. Pas même tronqué.

### 11.3 Génération des secrets

```bash
# NEXTAUTH_SECRET et CRON_SECRET
openssl rand -base64 32

# SOLO_PASSWORD_HASH (bcrypt — échapper les $ pour dotenv-expand)
node -e "require('bcryptjs').hash('TON_MDP', 12).then(h => console.log(h.replace(/\$/g, '\\$')))"
```

---

## 12. Sécurité

### 12.1 Règles non-négociables

- **`ANTHROPIC_API_KEY` jamais côté client.** Toute lib qui importe `@/lib/claude` est server-only.
- **`requireSession()` en tête de toute route protégée.** Pas d'exception.
- **`userId` dans tous les `where` Prisma.** Même les queries internes.
- **Validation Zod sur tout `body` POST/PATCH.**
- **Pas de SQL brut.** Prisma exclusivement. Si tu en as besoin, justifie.
- **Pas de `dangerouslySetInnerHTML`.** Utilise `react-markdown` qui sanitize.
- **Pas de `eval`, `Function()`, etc.**

### 12.2 Données utilisateur

Patrimoine = donnée sensible. Même en local dev :

- Pas de logs avec valeurs en euros identifiables (`console.log("user has 250000€")` → interdit).
- Backups DB Railway = activés (Railway Pro). Pour MVP solo, snapshot manuel hebdo OK.

### 12.3 Rate limiting

Le système actuel (`lib/analysisRateLimit.ts`) limite :
- Par user (1 appel / 5 min sur même horizon)
- Global (`ANTHROPIC_MAX_CALLS_PER_DAY`)

À étendre v2.0 : rate limit IP via middleware Next.js.

---

## 13. Roadmap détaillée

### v1.0 — MVP (cible : avril 2026)

- [x] Auth solo (credentials)
- [x] Dashboard + KPIs + saisie inline
- [x] Portefeuille (4 piliers, CRUD actifs/transactions)
- [x] Prix live crypto + equity
- [x] Score de risque avancé (4 composantes)
- [x] Alertes d'allocation
- [x] Achievements (light)
- [ ] **Déploiement Railway propre**
- [ ] **Repo public GitHub + README soigné**
- [ ] **CI GitHub Actions (typecheck + lint)**
- [ ] **Suppression de `vercel.json`**
- [ ] **`.env.example` à jour**

### v1.1 — Robustesse (T3 2026)

- [ ] Finaliser investissements récurrents (UI + exécution auto)
- [ ] Import CSV / PDF via Claude (relevés bancaires, brokers)
- [ ] Améliorer historique (filtres, export)
- [ ] Tests E2E critiques (login, ajout asset, snapshot)

### v1.2 — Notifications (T3 2026)

- [ ] Resend installé + templates React Email
- [ ] Digest mensuel : récap progression + alertes risque
- [ ] Opt-in/opt-out dans Profil
- [ ] Cron Railway dédié

### v1.3 — Vision marché propre (T4 2026)

- [ ] Réactiver analyses Claude avec budget contrôlé
- [ ] UI plus claire sur la fraîcheur du cache
- [ ] Analyses portfolio personnalisées validées

### v2.0 — Ouverture aux amis (T4 2026 / T1 2027)

- [ ] OAuth Google + GitHub (NextAuth)
- [ ] Allowlist email (table `AllowedEmail`)
- [ ] **Leaderboard "local"** (ranking entre amis)
- [ ] Profil public minimal (pseudo, avatar, progression %)
- [ ] Rate limit IP via middleware
- [ ] CGU + Privacy Policy minimales

### v3.0 — Gamification poussée (2027+)

- [ ] **Création de personnage à l'inscription** (avatar custom + nom)
- [ ] **Système d'items débloqués par achievements** (skins, accessoires)
- [ ] Customisation profil (background, badges)
- [ ] Achievements étoffés (quêtes, paliers, saisonniers)
- [ ] Effets visuels lors d'un déblocage

### v4.0 — Freemium public (2028, optionnel)

- [ ] Signup public ouvert
- [ ] Stripe (abonnements, webhooks, billing UI)
- [ ] Quotas par tier (free : 1 analyse/mois, premium : illimité)
- [ ] Marketing landing
- [ ] Support / docs publiques

---

## 14. Anti-patterns à éviter (retours d'audit)

Ces erreurs ont déjà été rencontrées et nettoyées. Ne pas les réintroduire.

1. **Composants dupliqués avec nom identique** dans 2 dossiers (ex : `RiskGauge` dans `analyse/` et `risk/`). Toujours UN seul composant par concept, dans le dossier du module concerné.
2. **Dossiers en français + anglais mélangés** dans `components/` (ex : `analyse/` vs `analysis/`). Convention : composants TOUS en anglais (§4.1).
3. **Fichiers morts non importés** qui pourrissent le repo. Avant de "commencer à coder un nouveau composant", check qu'il n'existe pas déjà mais non importé.
4. **Routes API doublons SSR** : éviter de créer `/api/foo` quand un Server Component appelle déjà `getFoo()` directement. Sauf vrai besoin client.
5. **`.DS_Store` commités** (macOS) → déjà dans `.gitignore`, mais supprimer si jamais ils apparaissent sur Windows aussi.
6. **`vercel.json`** reste dans le repo après migration Railway → à supprimer.
7. **`lib/utils.ts` ET `lib/utils/`** (fichier + dossier homonyme) → confus, mais fonctionne. À refactor plus tard si une cleanup s'impose.

---

## 15. En cas de doute

- **Question fonctionnelle/produit** → me poser la question avant de coder. Pas de décision produit en autonomie.
- **Question technique avec plusieurs options viables** → propose 2-3 options avec trade-offs, je tranche.
- **Question d'archi qui touche plusieurs modules** → produire un ADR court dans `docs/decisions/` avant d'implémenter.

---

**Dernière mise à jour** : 2026-05-27 — refonte complète post-audit (suppressions doublons + path harmonisés + cap Railway).
