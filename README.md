# Premier Million 🚀

Application web personnelle de **suivi de patrimoine** vers le premier million d'euros.

Saisie manuelle, usage solo sécurisé, analyses macro générées par Claude (Anthropic).

---

## Fonctionnalités MVP

| Module | Description |
|--------|-------------|
| **Dashboard** | Barre de progression vers 1 M€, récap mensuel, vue par pilier avec saisie inline |
| **Portefeuille** | Graphique donut de répartition, tableau des actifs, écart à l'allocation cible |
| **Risque & Atouts** | Score de risque global, jauge SVG, alertes d'allocation, détail par pilier |
| **Vision Marché** | Analyses macro générées par Claude Sonnet — cache 7 jours, 4 horizons (1m/3m/6m/1an) |
| **Profil** | Objectif, épargne mensuelle, allocation cible, journal de décisions stratégiques |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS v3 + shadcn/ui |
| ORM | Prisma 7 (driver adapter PostgreSQL) |
| Base de données | PostgreSQL |
| Auth | NextAuth.js v4 (credentials solo) |
| IA | Anthropic API — Claude Sonnet |
| Déploiement | Vercel |

---

## Prérequis

- Node.js 18+
- PostgreSQL (locale ou hébergée — ex. Neon, Supabase, Railway)
- Clé API Anthropic (optionnelle — active le module Vision Marché)

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/ton-user/premier-million.git
cd premier-million
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/premier_million?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générer avec: openssl rand -base64 32"

# Utilisateur solo
SOLO_EMAIL="ton@email.fr"
SOLO_PASSWORD_HASH="hash bcrypt — voir commande ci-dessous"

# Anthropic (optionnel)
ANTHROPIC_API_KEY="sk-ant-..."
```

**Générer le hash bcrypt du mot de passe :**

```bash
node -e "require('bcryptjs').hash('TON_MOT_DE_PASSE', 12).then(console.log)"
```

### 3. Initialiser la base de données

```bash
# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Charger les données de démo
npm run db:seed
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) et se connecter avec les identifiants configurés dans `.env`.

---

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production (inclut prisma generate)
npm run start        # Démarrer le serveur de production
npm run lint         # Vérification ESLint + TypeScript

npm run db:migrate   # Créer et appliquer une migration Prisma
npm run db:generate  # Régénérer le client Prisma
npm run db:seed      # Charger les données de démo
npm run db:studio    # Ouvrir Prisma Studio
```

---

## Déploiement sur Vercel

### 1. Pousser sur GitHub

```bash
git add .
git commit -m "feat: MVP Premier Million"
git push origin main
```

### 2. Importer le projet sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Importer le dépôt GitHub
3. Vercel détecte automatiquement Next.js — aucune configuration supplémentaire requise

### 3. Configurer les variables d'environnement

Dans **Settings → Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL PostgreSQL de production (ex. Neon) |
| `NEXTAUTH_URL` | URL de production (ex. `https://premier-million.vercel.app`) |
| `NEXTAUTH_SECRET` | Secret aléatoire — `openssl rand -base64 32` |
| `SOLO_EMAIL` | Email de connexion |
| `SOLO_PASSWORD_HASH` | Hash bcrypt du mot de passe |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (optionnelle) |

### 4. Base de données PostgreSQL hébergée

Recommandé : **[Neon](https://neon.tech)** (free tier, serverless PostgreSQL)

Après création de la base, récupérer la connection string puis appliquer les migrations :

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## Architecture

```
premier-million/
├── app/
│   ├── (dashboard)/          # Pages protégées (layout avec sidebar)
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── portefeuille/     # Gestion des actifs
│   │   ├── risque/           # Score de risque
│   │   ├── vision-marche/    # Analyses Claude
│   │   └── profil/           # Paramètres utilisateur
│   ├── api/                  # API Routes Next.js
│   │   ├── assets/           # CRUD actifs
│   │   ├── snapshots/        # Historique des valeurs
│   │   ├── portfolio/        # Agrégations
│   │   ├── dashboard/        # Données dashboard
│   │   ├── risk/             # Score de risque
│   │   ├── analysis/         # Analyses Claude (cache 7j)
│   │   ├── decisions/        # Journal de décisions
│   │   └── profile/          # Profil utilisateur
│   └── login/                # Page de connexion
├── components/
│   ├── layout/               # Sidebar, Header, BottomNav (mobile)
│   ├── dashboard/            # ProgressBar, PilierCards, InlineEdit
│   ├── portfolio/            # AllocationChart, AssetTable
│   ├── risk/                 # RiskGauge, AlertBanner
│   ├── analysis/             # AnalysisCard (rendu Markdown)
│   └── profile/              # ProfileForm, DecisionList
├── lib/
│   ├── prisma.ts             # Singleton Prisma (adapter PG)
│   ├── auth.ts               # Config NextAuth
│   ├── claude.ts             # Client Anthropic singleton
│   ├── risk.ts               # Calcul score de risque
│   ├── session.ts            # Helper requireSession()
│   ├── prompts/              # Prompts Claude
│   └── services/             # Logique métier (portfolio, dashboard)
├── types/                    # Types TypeScript partagés
└── prisma/
    ├── schema.prisma         # Schéma de données
    └── seed.ts               # Données de démo (245 000 €)
```

---

## Modèle de données

```
User
 ├── objectif (Float)          — Objectif patrimonial en €
 ├── ageCible (Int?)           — Âge cible
 ├── epargneMensuelle (Float?) — Épargne mensuelle
 ├── allocationCible (Json)    — { pea, crypto, immo, autre } en %
 ├── assets[] → Asset
 ├── analyses[] → Analysis
 └── decisions[] → Decision

Asset
 ├── name, pilier (PEA|CRYPTO|IMMO|AUTRE), type
 └── snapshots[] → Snapshot (valeur à une date)

Analysis
 ├── horizon (MONTH_1|MONTH_3|MONTH_6|YEAR_1)
 └── content (Markdown généré par Claude, cache 7j)

Decision
 ├── date
 └── description
```

---

## Calcul du score de risque

```
score = Σ(poids_pilier × volatilité_pilier) + facteur_écart × 0.5
```

Volatilités par pilier : PEA 0.6 · CRYPTO 0.9 · IMMO 0.3 · AUTRE 0.1

Niveaux : **Faible** (< 0.35) · **Modéré** (< 0.55) · **Élevé** (≥ 0.55)

---

## Sécurité

- Clé Anthropic **jamais exposée côté client** — server-side uniquement
- Auth solo via credentials stockés dans `.env` (hash bcrypt)
- Toutes les routes API vérifient la session via `requireSession()`
- Inputs validés avec Zod sur tous les endpoints

---

## Roadmap

- [x] MVP solo — Dashboard, Portefeuille, Risque, Vision Marché, Profil
- [ ] v1.1 — Import CSV/PDF via Claude
- [ ] v2.0 — Mode multi-utilisateurs + leaderboard

---

## Licence

Projet personnel open source — MIT.
