# Guide de pilotage des agents IA — Premier Million

## Principe fondamental

Les agents ne se parlent pas entre eux. Ils se coordonnent via les fichiers du projet.
**Toi** tu es le chef d'orchestre. Tu passes d'un agent à l'autre en lui donnant le contexte.

---

## Comment activer un agent

Dans une nouvelle session Claude Code, copie-colle la phrase d'activation du rôle voulu :

| Agent | Phrase d'activation |
|-------|---------------------|
| Architecte | "Tu es l'Agent Architecte du projet Premier Million. Lis CLAUDE.md puis docs/agents/01-architecte.md avant de commencer." |
| Frontend | "Tu es l'Agent Frontend du projet Premier Million. Lis CLAUDE.md puis docs/agents/02-frontend.md avant de commencer." |
| Backend | "Tu es l'Agent Backend du projet Premier Million. Lis CLAUDE.md puis docs/agents/03-backend.md avant de commencer." |
| Data | "Tu es l'Agent Data du projet Premier Million. Lis CLAUDE.md puis docs/agents/04-data.md avant de commencer." |
| IA | "Tu es l'Agent IA du projet Premier Million. Lis CLAUDE.md puis docs/agents/05-ia.md avant de commencer." |

---

## Travailler en simultané (optionnel)

Si tu veux avancer sur plusieurs fronts en parallèle :

1. Ouvre **plusieurs terminaux** dans le dossier `premier-million/`
2. Lance `claude` dans chaque terminal
3. Active un agent différent dans chaque terminal
4. **Règle anti-conflit** : deux agents ne doivent jamais travailler sur le **même fichier** en même temps

Exemple de parallélisation sûre :
```
Terminal 1 → Agent Data     : travaille sur prisma/schema.prisma
Terminal 2 → Agent Frontend : travaille sur app/dashboard/page.tsx
Terminal 3 → Agent IA       : travaille sur lib/prompts/market-analysis.ts
```

---

## Workflow type par feature

### Exemple : implémenter le module "Portefeuille"

```
1. Agent Architecte
   → "Valide l'approche pour le module Portefeuille :
      quels endpoints, quels composants, quels types partagés ?"

2. Agent Data
   → "Le schéma Asset + Snapshot est-il complet pour le module Portefeuille ?
      Ajoute les index nécessaires et génère la migration."

3. Agent Backend
   → "Implémente GET /api/portfolio/summary qui agrège les Snapshots
      les plus récents par pilier."

4. Agent Frontend
   → "Crée la page app/(dashboard)/portefeuille/page.tsx avec :
      - AllocationChart (répartition par pilier)
      - AssetTable (détail par ligne)
      - Indicateur d'écart allocation cible"
```

---

## Passer une décision entre agents

Quand l'Agent Architecte prend une décision, tu la consignes dans `docs/decisions/`.
Les autres agents lisent ce dossier s'ils ont besoin de comprendre un choix.

```bash
# Exemple de passation
"L'Agent Architecte a décidé que les analyses Claude sont cachées 7 jours.
Voir docs/decisions/002-cache-analyses.md.
Implémente cette logique dans /api/analysis/route.ts."
```

---

## Checklist de démarrage du projet (ordre recommandé)

- [ ] **Agent Data** → Créer et migrer le schéma Prisma complet
- [ ] **Agent Backend** → Config NextAuth + lib/prisma.ts + lib/claude.ts
- [ ] **Agent Frontend** → Layout de base (Sidebar, Header, routes)
- [ ] **Agent Backend** → Endpoints CRUD (assets, snapshots, profile)
- [ ] **Agent Frontend** → Dashboard + saisie inline
- [ ] **Agent Frontend** → Portefeuille + graphiques
- [ ] **Agent Backend + IA** → Endpoint analysis + prompts
- [ ] **Agent Frontend** → Vision Marché (affichage analyse)
- [ ] **Agent Frontend** → Risque & Atouts
- [ ] **Agent Frontend** → Profil

---

## Signaux qui indiquent de solliciter l'Agent Architecte

- Un agent te dit "je ne sais pas où mettre cette logique"
- Deux agents ont modifié le même fichier et il y a un conflit
- Tu ajoutes une feature qui touche plusieurs couches
- Tu passes à une nouvelle phase (v1.1, v2.0)

---

## Passation à un nouveau collaborateur (ou nouvelle session)

Donne-lui simplement :
1. Ce fichier (`docs/workflow.md`)
2. Le fichier `CLAUDE.md`
3. La fiche de l'agent concerné (`docs/agents/0X-nom.md`)

C'est suffisant pour être opérationnel.
