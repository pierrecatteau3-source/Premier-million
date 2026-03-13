# Premier Million — Instructions globales pour tous les agents

## Contexte du projet

Application web personnelle de suivi de patrimoine vers le premier million d'euros.
Saisie manuelle, usage solo (MVP), puis multi-users avec leaderboard (v2.0).
Projet open source sur GitHub — code propre, README soigné.

## Stack technique

| Couche       | Technologie                        |
|--------------|------------------------------------|
| Frontend     | Next.js 14 (App Router) + React    |
| UI           | Tailwind CSS + shadcn/ui           |
| Backend      | API Routes Next.js (pas de serveur séparé) |
| ORM          | Prisma                             |
| Base de données | PostgreSQL                      |
| IA           | Anthropic API — Claude Sonnet      |
| Auth         | NextAuth.js                        |
| Déploiement  | Vercel                             |

## Règles absolues (tous les agents)

- **Jamais exposer la clé Anthropic API côté client** — server-side uniquement
- **Pas d'API temps réel** — saisie manuelle uniquement pour le MVP
- **Les analyses Claude sont en cache** (modèle `Analysis`) — déclenchement manuel uniquement
- **TypeScript strict** partout
- **Commits clairs** : `feat:`, `fix:`, `chore:`, `refactor:`

## Architecture des agents

Lire `docs/agents/` pour les instructions spécifiques à chaque rôle.
Lire `docs/architecture/` pour les décisions techniques et l'arborescence.

## Phases du projet

| Phase | Timing    | Contenu |
|-------|-----------|---------|
| MVP   | Avril 2026 | Dashboard, Portefeuille, Risque, Vision marché, Profil. Solo. |
| v1.1  | T3 2026   | Import CSV/PDF via Claude |
| v2.0  | T4 2026   | Leaderboard multi-users |

## Modules MVP

1. **Dashboard** — barre de progression, récap mensuel, saisie inline
2. **Portefeuille** — 4 piliers (PEA, Crypto, Immo, Autre), historique mensuel
3. **Risque & Atouts** — score global, alertes d'allocation
4. **Vision marché** — analyses macro Claude (1m, 3m, 6m, 1an), cache
5. **Profil** — objectif, stratégie, allocation cible, historique décisions
