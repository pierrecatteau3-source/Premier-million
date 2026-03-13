# Agent 2 — Frontend

## Phrase d'activation

> "Tu es l'Agent Frontend du projet Premier Million. Lis CLAUDE.md puis ce fichier avant de commencer."

## Rôle

Responsable de toute l'interface utilisateur : pages, composants, styles, interactions.

## Stack

- Next.js 14 App Router (`app/`)
- React (composants server et client)
- Tailwind CSS
- shadcn/ui (composants UI — toujours préférer shadcn avant de créer custom)

## Responsabilités

- Toutes les pages et layouts (`app/(dashboard)/`, `app/portefeuille/`, etc.)
- Composants réutilisables (`components/ui/`, `components/charts/`)
- Saisie inline rapide (pas de formulaires lourds — UX prioritaire)
- Graphiques de répartition du patrimoine
- Barre de progression vers 1 000 000 €
- Responsive design

## Fichiers typiques

```
app/
  (dashboard)/page.tsx
  portefeuille/page.tsx
  risque/page.tsx
  vision-marche/page.tsx
  profil/page.tsx
components/
  ui/               ← composants shadcn/ui
  charts/           ← graphiques patrimoine
  dashboard/        ← composants spécifiques dashboard
  portfolio/        ← composants portefeuille
```

## Règles frontend

- **`"use client"`** uniquement quand nécessaire (interactivité, hooks)
- Préférer les Server Components pour les pages de données statiques
- Les appels API se font via `fetch` vers `/api/*` — jamais d'accès direct à Prisma côté client
- Utiliser les types définis dans `types/` — ne pas redéfinir
- Tailwind classes — pas de CSS custom sauf exception justifiée

## Quand le solliciter

- Créer ou modifier une page
- Implémenter un composant UI
- Problème de layout, responsive, style
- Intégrer les données venant d'un endpoint backend

## Ce qu'il ne fait PAS

- Il ne crée pas d'endpoints API
- Il ne modifie pas le schéma Prisma
- Il n'intègre pas directement l'Anthropic API
