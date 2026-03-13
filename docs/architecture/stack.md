# Stack technique — Premier Million

## Choix techniques et justifications

### Frontend : Next.js 14 (App Router)

- **App Router** : Server Components par défaut → meilleures performances, SEO
- **Server Components** pour les pages de données (dashboard, portefeuille)
- **Client Components** (`"use client"`) uniquement pour l'interactivité (saisie inline, graphiques)
- Déploiement natif sur Vercel

### UI : Tailwind CSS + shadcn/ui

- shadcn/ui : composants copiés dans le projet, pas une dépendance externe
- Composants installés au besoin via `npx shadcn@latest add <composant>`
- Tailwind pour tout le style custom

### Backend : API Routes Next.js

- Pas de serveur séparé pour le MVP → un seul projet à déployer
- Routes sous `app/api/` — format standard Next.js 14

### ORM : Prisma

- Schéma typé, autocomplétion TS, migrations propres
- Client singleton dans `lib/prisma.ts` (pattern standard Next.js)

### Base de données : PostgreSQL

- Gratuit en local via Docker ou service Supabase/Railway pour la prod
- Compatible Prisma, robuste pour les données financières

### IA : Anthropic API (Claude Sonnet)

- Analyses macro contextualisées au profil de l'utilisateur
- Cache en DB pour éviter les coûts inutiles
- Clé API serveur uniquement (`ANTHROPIC_API_KEY` dans `.env.local`)

### Auth : NextAuth.js

- Simple à configurer pour usage solo MVP
- Extensible pour multi-users en v2.0
- Support providers multiples (email/password, OAuth)

### Déploiement : Vercel

- Natif Next.js
- Gratuit pour usage personnel
- Preview deployments automatiques sur PR

## Flux de données

```
Utilisateur (navigateur)
    │
    ├── Server Component → accès direct aux données via Prisma (pages statiques)
    │
    └── Client Component → fetch vers /api/* → API Route → Prisma → PostgreSQL
                                                           └── Anthropic API (si Vision Marché)
```

## Règle : Sécurité de la clé Anthropic

```
❌ INTERDIT
app/vision-marche/page.tsx → import Anthropic → appel API

✅ CORRECT
app/vision-marche/page.tsx → fetch('/api/analysis/month-1')
app/api/analysis/[horizon]/route.ts → lib/claude.ts → Anthropic API
```

## Gestion du cache des analyses Claude

```
Request POST /api/analysis { horizon: "MONTH_3" }
  │
  ├── Vérifier DB : Analysis WHERE userId AND horizon AND createdAt > NOW() - 7 days
  │     ├── Trouvé → retourner le cache (0 coût API)
  │     └── Non trouvé → appeler Claude API → sauvegarder en DB → retourner
  │
  └── Response : { content: "...", cached: true/false, createdAt: "..." }
```

## Calcul du score de risque (lib/risk.ts)

Basé sur la volatilité estimée par pilier et l'écart à l'allocation cible :

| Pilier | Volatilité estimée |
|--------|--------------------|
| PEA    | Modérée (0.4)      |
| Crypto | Haute (0.9)        |
| Immo   | Faible (0.2)       |
| Autre  | Variable (0.3)     |

Score = Σ (poids_pilier × volatilité_pilier) × facteur_écart_allocation

## Évolutions prévues

| Version | Changement technique |
|---------|---------------------|
| v1.1 | Parser CSV/PDF via Claude (prompt structuré → JSON d'actifs) |
| v2.0 | Auth multi-users, Leaderboard (ajout userId sur toutes les ressources) |
