# Arborescence du projet — Premier Million

## Structure complète

```
premier-million/
│
├── CLAUDE.md                          ← Instructions globales (lu par tous les agents)
│
├── docs/                              ← Documentation projet
│   ├── agents/                        ← Fiches de rôle des 5 agents IA
│   │   ├── 01-architecte.md
│   │   ├── 02-frontend.md
│   │   ├── 03-backend.md
│   │   ├── 04-data.md
│   │   └── 05-ia.md
│   ├── architecture/
│   │   ├── arborescence.md            ← Ce fichier
│   │   └── stack.md                  ← Détails techniques de la stack
│   ├── decisions/                     ← ADR (Architecture Decision Records)
│   │   └── 001-saisie-manuelle.md    ← Pourquoi pas d'API temps réel
│   └── workflow.md                   ← Guide de pilotage des agents
│
├── app/                               ← Next.js App Router
│   ├── layout.tsx                     ← Layout racine
│   ├── page.tsx                       ← Redirect vers /dashboard
│   ├── (dashboard)/                   ← Groupe de routes authentifiées
│   │   ├── layout.tsx                 ← Layout avec sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← Module 1 : Dashboard
│   │   ├── portefeuille/
│   │   │   └── page.tsx              ← Module 2 : Portefeuille
│   │   ├── risque/
│   │   │   └── page.tsx              ← Module 3 : Risque & Atouts
│   │   ├── vision-marche/
│   │   │   └── page.tsx              ← Module 4 : Vision marché
│   │   └── profil/
│   │       └── page.tsx              ← Module 5 : Profil
│   └── api/                           ← API Routes (Backend)
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── assets/
│       │   ├── route.ts              ← GET (liste) / POST (créer)
│       │   └── [id]/
│       │       └── route.ts          ← PUT / DELETE
│       ├── snapshots/
│       │   └── route.ts              ← GET / POST valeurs
│       ├── portfolio/
│       │   └── summary/
│       │       └── route.ts          ← Agrégation par pilier
│       ├── risk/
│       │   └── route.ts              ← Score de risque global
│       ├── analysis/
│       │   ├── route.ts              ← POST : déclencher analyse
│       │   └── [horizon]/
│       │       └── route.ts          ← GET : récupérer cache
│       └── profile/
│           └── route.ts              ← GET / PUT profil utilisateur
│
├── components/                        ← Composants React réutilisables
│   ├── ui/                            ← Composants shadcn/ui (générés)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   │   ├── ProgressBar.tsx           ← Barre progression vers 1M€
│   │   ├── MonthlyRecap.tsx
│   │   └── InlineEdit.tsx            ← Saisie rapide inline
│   ├── portfolio/
│   │   ├── PilierCard.tsx
│   │   ├── AssetTable.tsx
│   │   └── AllocationChart.tsx       ← Graphique répartition
│   ├── risk/
│   │   ├── RiskScore.tsx
│   │   └── AlertBanner.tsx
│   └── analysis/
│       └── AnalysisCard.tsx
│
├── lib/                               ← Utilitaires serveur
│   ├── prisma.ts                      ← Singleton Prisma
│   ├── auth.ts                        ← Config NextAuth
│   ├── claude.ts                      ← Client Anthropic singleton
│   ├── prompts/
│   │   └── market-analysis.ts        ← Prompt Vision Marché
│   ├── risk.ts                        ← Calcul score de risque
│   └── cache.ts                       ← Logique cache analyses
│
├── types/                             ← Types TypeScript partagés
│   ├── index.ts                       ← Exports centralisés
│   ├── portfolio.ts                   ← Types Portfolio, Asset, Snapshot
│   └── analysis.ts                   ← Types Analysis, Horizon
│
├── prisma/                            ← Base de données
│   ├── schema.prisma                  ← Schéma complet
│   ├── migrations/                    ← Migrations générées
│   └── seed.ts                        ← Données de test
│
├── public/                            ← Assets statiques
│
├── .env.local                         ← Variables d'environnement (non commité)
├── .env.example                       ← Template variables (commité)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Variables d'environnement requises

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."        # Jamais côté client
```

## Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Composants React | PascalCase | `ProgressBar.tsx` |
| Fichiers utilitaires | camelCase | `prisma.ts`, `risk.ts` |
| API Routes | `route.ts` | `app/api/assets/route.ts` |
| Types | PascalCase | `PortfolioSummary`, `AssetWithSnapshots` |
| Enums | PascalCase | `Pilier.PEA`, `Horizon.MONTH_1` |
