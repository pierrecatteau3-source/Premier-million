# Feuille de route — Premier Million MVP

> **Comment lire ce document**
> Chaque étape a un agent assigné, une phrase pour l'activer, et une case à cocher.
> Ne passe à l'étape suivante que quand la précédente est ✅.
> En cas de doute sur une étape → appelle l'Agent Architecte.

---

## PHASE 0 — Mise en place du projet
*Durée estimée : 1 session*

### Étape 0.1 — Initialiser le projet Next.js
**Agent : Architecte**
```
"Tu es l'Agent Architecte. Lis CLAUDE.md et docs/agents/01-architecte.md.
Initialise un projet Next.js 14 avec TypeScript, Tailwind CSS et shadcn/ui
dans le dossier courant. Configure aussi le .gitignore et le .env.example."
```
- [ ] `npx create-next-app` exécuté avec les bonnes options
- [ ] Tailwind CSS configuré
- [ ] shadcn/ui initialisé (`npx shadcn@latest init`)
- [ ] `.env.example` créé avec les variables requises
- [ ] `.env.local` créé localement (non commité)

---

### Étape 0.2 — Configurer la base de données
**Agent : Data**
```
"Tu es l'Agent Data. Lis CLAUDE.md et docs/agents/04-data.md.
Installe Prisma, crée le schéma complet décrit dans ta fiche,
génère la première migration et vérifie que la connexion PostgreSQL fonctionne."
```
- [ ] Prisma installé et initialisé
- [ ] `prisma/schema.prisma` complet (User, Asset, Snapshot, Analysis, Decision)
- [ ] Première migration générée et appliquée
- [ ] `lib/prisma.ts` (singleton) créé
- [ ] `prisma db studio` accessible en local

---

### Étape 0.3 — Configurer l'authentification
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md.
Installe et configure NextAuth.js pour un usage solo (credentials provider).
Crée lib/auth.ts et l'API route app/api/auth/[...nextauth]/route.ts."
```
- [ ] NextAuth.js installé et configuré
- [ ] Login fonctionnel en local
- [ ] Session accessible dans les pages

---

## PHASE 1 — Structure visuelle de base
*Durée estimée : 1 session*

### Étape 1.1 — Layout principal (Sidebar + Header)
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée le layout principal avec une Sidebar (liens vers les 5 modules)
et un Header. Utilise shadcn/ui. Les pages sont vides pour l'instant."
```
- [ ] `app/(dashboard)/layout.tsx` créé
- [ ] `components/layout/Sidebar.tsx` avec les 5 liens de navigation
- [ ] `components/layout/Header.tsx`
- [ ] Les 5 pages créées et vides (`/dashboard`, `/portefeuille`, `/risque`, `/vision-marche`, `/profil`)
- [ ] Navigation entre les pages fonctionne

---

### Étape 1.2 — Types TypeScript partagés
**Agent : Architecte**
```
"Tu es l'Agent Architecte. Lis CLAUDE.md et docs/agents/01-architecte.md.
Crée le dossier types/ avec les types partagés entre frontend et backend :
Portfolio, Asset, Snapshot, Analysis, Horizon, Pilier, RiskScore, UserProfile."
```
- [ ] `types/portfolio.ts` créé
- [ ] `types/analysis.ts` créé
- [ ] `types/index.ts` (exports centralisés) créé

---

## PHASE 2 — Module Portefeuille (le cœur des données)
*Durée estimée : 2 sessions*

> Commence par le Portefeuille plutôt que le Dashboard,
> car le Dashboard dépend des données du Portefeuille.

### Étape 2.1 — API CRUD des actifs
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md.
Implémente les endpoints suivants avec validation Zod et vérification de session :
- GET/POST /api/assets
- PUT/DELETE /api/assets/[id]
- GET/POST /api/snapshots
- GET /api/portfolio/summary (agrégation par pilier)"
```
- [ ] `app/api/assets/route.ts` (GET + POST)
- [ ] `app/api/assets/[id]/route.ts` (PUT + DELETE)
- [ ] `app/api/snapshots/route.ts` (GET + POST)
- [ ] `app/api/portfolio/summary/route.ts`
- [ ] Testé avec un client HTTP (ex. curl ou Postman)

---

### Étape 2.2 — Page Portefeuille
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée la page /portefeuille avec :
- Un graphique en donut de répartition par pilier (PEA, Crypto, Immo, Autre)
- Un tableau des actifs avec valeur actuelle
- Un indicateur d'écart par rapport à l'allocation cible
Les données viennent de GET /api/portfolio/summary et GET /api/assets."
```
- [ ] `app/(dashboard)/portefeuille/page.tsx`
- [ ] `components/portfolio/AllocationChart.tsx` (donut chart)
- [ ] `components/portfolio/AssetTable.tsx`
- [ ] Données réelles affichées depuis l'API

---

### Étape 2.3 — Données de seed
**Agent : Data**
```
"Tu es l'Agent Data. Lis CLAUDE.md et docs/agents/04-data.md.
Crée prisma/seed.ts avec des données réalistes :
- Un user test
- Des actifs représentatifs des 4 piliers (PEA : ETF MSCI World, Crypto : ETH + SOL, Immo : Bricks SCI, Autre : livret)
- Des snapshots sur 6 mois pour simuler l'historique"
```
- [ ] `prisma/seed.ts` créé
- [ ] `npx prisma db seed` fonctionne
- [ ] Données visibles dans Prisma Studio

---

## PHASE 3 — Module Dashboard
*Durée estimée : 1 session*

### Étape 3.1 — API Dashboard
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md.
Crée GET /api/dashboard qui retourne :
- Total patrimoine actuel
- Variation vs mois précédent
- Progression vers 1 000 000 €
- Résumé par pilier"
```
- [ ] `app/api/dashboard/route.ts` créé

---

### Étape 3.2 — Page Dashboard
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée la page /dashboard avec :
- Barre de progression visuelle vers 1 000 000 €
- Récapitulatif mensuel (variation patrimoine, gains/pertes)
- Vue synthétique des 4 piliers
- Saisie rapide inline : clic sur une valeur → champ éditable → sauvegarde immédiate"
```
- [ ] `app/(dashboard)/dashboard/page.tsx`
- [ ] `components/dashboard/ProgressBar.tsx`
- [ ] `components/dashboard/MonthlyRecap.tsx`
- [ ] `components/dashboard/InlineEdit.tsx` (saisie sans navigation)

---

## PHASE 4 — Module Risque & Atouts
*Durée estimée : 1 session*

### Étape 4.1 — Logique de calcul du risque
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md
et docs/architecture/stack.md (section calcul du risque).
Crée lib/risk.ts avec le calcul du score global basé sur la volatilité
par pilier et l'écart à l'allocation cible. Puis crée GET /api/risk."
```
- [ ] `lib/risk.ts` avec la formule de score
- [ ] `app/api/risk/route.ts`
- [ ] Alertes déclenchées si un pilier dépasse le seuil

---

### Étape 4.2 — Page Risque & Atouts
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée la page /risque avec :
- Score de risque global (jauge visuelle)
- Liste des atouts (diversification, secteurs porteurs)
- Alertes si un pilier dépasse l'allocation cible"
```
- [ ] `app/(dashboard)/risque/page.tsx`
- [ ] `components/risk/RiskScore.tsx`
- [ ] `components/risk/AlertBanner.tsx`

---

## PHASE 5 — Module Vision Marché (IA)
*Durée estimée : 1-2 sessions*

### Étape 5.1 — Intégration Anthropic API
**Agent : IA**
```
"Tu es l'Agent IA. Lis CLAUDE.md et docs/agents/05-ia.md.
Crée lib/claude.ts (client Anthropic singleton) et le prompt
d'analyse marché dans lib/prompts/market-analysis.ts.
Le prompt doit intégrer le profil utilisateur et le portefeuille actuel.
Les 3 horizons sont : 3 mois, 1 an, 5 ans."
```
- [ ] `lib/claude.ts` créé (clé API serveur uniquement)
- [ ] `lib/prompts/market-analysis.ts` avec le prompt complet
- [ ] Prompt testé en isolation

---

### Étape 5.2 — API Analyse avec cache
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md.
Crée POST /api/analysis (déclenche une analyse pour un horizon donné)
et GET /api/analysis/[horizon] (retourne le cache si < 7 jours).
Utilise lib/claude.ts pour l'appel API."
```
- [ ] `app/api/analysis/route.ts` (POST)
- [ ] `app/api/analysis/[horizon]/route.ts` (GET avec cache)
- [ ] Logic de cache : ne pas rappeler l'API si analyse récente

---

### Étape 5.3 — Page Vision Marché
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée la page /vision-marche avec :
- 3 onglets : 3 mois / 1 an / 5 ans
- Bouton 'Générer une analyse' (appel manuel)
- Affichage de l'analyse avec date de génération
- Indicateur si l'analyse vient du cache"
```
- [ ] `app/(dashboard)/vision-marche/page.tsx`
- [ ] `components/analysis/AnalysisCard.tsx`
- [ ] Onglets par horizon fonctionnels

---

## PHASE 6 — Module Profil
*Durée estimée : 1 session*

### Étape 6.1 — API Profil
**Agent : Backend**
```
"Tu es l'Agent Backend. Lis CLAUDE.md et docs/agents/03-backend.md.
Crée GET/PUT /api/profile pour lire et modifier :
- Objectif financier, âge cible, épargne mensuelle
- Allocation cible par pilier (JSON)
- Historique des décisions stratégiques (GET/POST /api/decisions)"
```
- [ ] `app/api/profile/route.ts` (GET + PUT)
- [ ] `app/api/decisions/route.ts` (GET + POST)

---

### Étape 6.2 — Page Profil
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Crée la page /profil avec :
- Formulaire d'édition du profil (objectif, âge cible, épargne mensuelle)
- Sliders d'allocation cible par pilier (total doit faire 100%)
- Timeline des décisions stratégiques passées"
```
- [ ] `app/(dashboard)/profil/page.tsx`
- [ ] Formulaire profil avec validation
- [ ] Sliders allocation (PEA + Crypto + Immo + Autre = 100%)
- [ ] Timeline décisions

---

## PHASE 7 — Finitions MVP
*Durée estimée : 1 session*

### Étape 7.1 — Polish et cohérence visuelle
**Agent : Frontend**
```
"Tu es l'Agent Frontend. Lis CLAUDE.md et docs/agents/02-frontend.md.
Passe en revue les 5 modules et harmonise :
- Les couleurs par pilier (PEA = bleu, Crypto = orange, Immo = vert, Autre = gris)
- Les états de chargement (skeletons)
- Les messages d'erreur
- Le responsive mobile"
```
- [ ] Palette cohérente sur tous les modules
- [ ] Loading states sur tous les fetch
- [ ] Responsive vérifié

---

### Étape 7.2 — Déploiement Vercel
**Agent : Architecte**
```
"Tu es l'Agent Architecte. Lis CLAUDE.md et docs/agents/01-architecte.md.
Guide le déploiement sur Vercel :
- Variables d'environnement à configurer
- Base de données PostgreSQL en production (Railway ou Supabase)
- Vérification que la clé Anthropic n'est pas exposée"
```
- [ ] Repo GitHub créé et poussé
- [ ] DB PostgreSQL en production configurée
- [ ] Variables d'env configurées sur Vercel
- [ ] Premier déploiement réussi
- [ ] Clé Anthropic vérifiée côté serveur uniquement

---

### Étape 7.3 — README
**Agent : Architecte**
```
"Tu es l'Agent Architecte. Lis CLAUDE.md et docs/agents/01-architecte.md.
Rédige le README.md du projet pour GitHub avec :
- Description du problème résolu
- Screenshot du dashboard
- Stack technique
- Instructions d'installation locale
- Variables d'environnement requises"
```
- [ ] `README.md` rédigé
- [ ] Screenshots ajoutés
- [ ] Instructions claires pour faire tourner en local

---

## Récapitulatif des phases

| Phase | Contenu | Agent principal | Priorité |
|-------|---------|-----------------|----------|
| 0 | Mise en place | Architecte + Data + Backend | 🔴 Bloquant |
| 1 | Structure visuelle | Frontend + Architecte | 🔴 Bloquant |
| 2 | Module Portefeuille | Backend + Frontend + Data | 🔴 Cœur |
| 3 | Module Dashboard | Backend + Frontend | 🟠 Important |
| 4 | Module Risque | Backend + Frontend | 🟠 Important |
| 5 | Module Vision Marché | IA + Backend + Frontend | 🟡 Différenciateur |
| 6 | Module Profil | Backend + Frontend | 🟡 Complétion |
| 7 | Finitions + Déploiement | Frontend + Architecte | 🟢 Livraison |

---

> 💡 **Conseil** : complète chaque étape entièrement avant de passer à la suivante.
> Un MVP qui fonctionne à 80% vaut mieux qu'un projet à 100% qui ne tourne pas.
