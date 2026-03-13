# ADR 001 — Saisie manuelle plutôt qu'APIs temps réel

**Date :** Mars 2026
**Statut :** Accepté

## Contexte

Les agrégateurs existants (Finary, etc.) dépendent des APIs des plateformes.
Bricks, certaines SCI et plateformes crypto ne proposent pas d'intégration.
Les données sont donc incomplètes ou décalées.

## Décision

Le MVP adopte la saisie manuelle avec une UX ultra-rapide (inline, sans formulaire lourd).

## Conséquences

- **Avantage** : exactitude garantie, aucune dépendance externe, zéro coût d'intégration
- **Avantage** : simplicité du code (pas de gestion d'OAuth tiers)
- **Inconvénient** : l'utilisateur doit mettre à jour manuellement
- **Mitigation** : saisie inline rapide dans le Dashboard, pas de navigation vers un formulaire séparé

## Évolution prévue

v1.1 : import CSV/PDF via Claude pour les plateformes qui le proposent.
