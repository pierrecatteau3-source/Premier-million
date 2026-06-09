# Charte graphique — Premier Million

> Référence des patterns visuels réutilisables. Source de vérité des tokens : `app/globals.css` (dark only, accent or `#f59e0b`).

## 1. Couleurs (tokens)

| Rôle | Variable | Valeur HSL | Usage |
|---|---|---|---|
| Or de marque | `--primary` | `38 92% 50%` (≈ `#f59e0b`) | `text-primary`, accents, titres de pop-up |
| Fond de page | `--background` | `30 6% 5%` | fond global |
| Surface carte | `--card` | `30 6% 8%` | cartes posées sur le fond de page |
| Surface flottante | `--popover` | `30 6% 14%` | modals, menus (plus contrasté) |
| Muted | `--muted` | `30 6% 12%` | en-têtes de tableau, fonds discrets |

## 2. ⚠️ Piège des tokens couleur (channels-only)

Les variables stockent des **canaux HSL sans wrapper** (`30 6% 8%`) et `tailwind.config.ts` mappe `card: "var(--card)"`. Conséquence : `bg-card`, `bg-muted`, `bg-popover`, `border-border` génèrent une valeur **invalide** → la surface est en réalité **transparente**.

Ça ne se voit pas quand l'élément est posé directement sur le fond de page sombre, mais ça provoque un **bleed-through** dès qu'il y a du contenu derrière (modal sur backdrop flouté, en-tête/pied de tableau sticky).

**Pour une surface réellement opaque, wrapper explicitement en `hsl()` :**
- inline : `style={{ backgroundColor: "hsl(var(--popover))" }}`
- ou classe arbitraire Tailwind : `bg-[hsl(var(--muted))]`

## 3. Pop-ups / modals

Pattern validé (réf. `components/portfolio/AssetDetailModal.tsx`) :

- **Backdrop** : `fixed inset-0 bg-black/60 backdrop-blur-sm` — assombrit + floute le fond (à garder, effet apprécié).
- **Panneau** : fond **plein** `hsl(var(--popover))` (jamais `bg-card`/`bg-popover` qui sont transparents), `rounded-2xl border border-border shadow-2xl`, centré, `max-h-[90vh] overflow-y-auto`.
- **Titres en OR** : titre principal **et** titres de section en `text-primary`.
- **Chips d'information** : fond plein `hsl(var(--card))`.
- **Fermeture** : croix + clic sur le backdrop + touche `Échap`.
- **Montage** : `createPortal(..., document.body)` pour un centrage indépendant du parent.

## 4. En-têtes / pieds de tableau sticky

Réf. `components/portfolio/AssetManager.tsx` :

- **En-tête sticky** : `sticky top-0 z-10` + fond opaque `bg-[hsl(var(--muted))]` (sinon les lignes défilent à travers).
- **Pied (total) sticky** : `sticky bottom-0 z-10` + `bg-[hsl(var(--muted))]`.

## 5. Selects (anti-superposition du chevron)

Un `<select>` natif laissé tel quel affiche le chevron de l'OS, qui peut se
**superposer** au contenu (ou doubler un glyphe `↓` présent dans le label).

Pattern validé (réf. `FieldSelect` dans `components/portfolio/AssetManager.tsx`) :

- `appearance-none` pour masquer le chevron natif.
- Conteneur `relative` + un seul `ChevronDown` (lucide) en `absolute right-2 -translate-y-1/2 pointer-events-none text-muted-foreground`.
- Réserver la place : `pr-8` sur le `select`.
- **Ne pas** mettre de flèche unicode (`↓`/`↑`) dans le texte des `<option>` — utiliser des mots (« Valeur décroissante », « Nom A→Z »).

## 6. Mini-courbes (sparklines)

Réf. `components/portfolio/Sparkline.tsx` :

- SVG pur sans axes : `path` aire (`fillOpacity 0.1`) + `path` trait + point de fin.
- Couleur via **`currentColor`** → portée par une classe `text-*` du parent
  (`text-positive` / `text-negative` / `text-muted-foreground`).
- < 2 points → tiret pointillé discret (pas de fausse courbe).
- Données = **performance prix pure** (hors apports) : séries horaires CoinGecko
  `market_chart` / Yahoo `chart` via `/api/prices/sparkline`, hook `useSparklines`
  (cache 3 h : `revalidate` serveur + localStorage client). On récupère 7 j puis on
  tranche la fenêtre (1J/3J/7J) côté client par timestamp. Clé = ticker / id CoinGecko
  (les actifs sans cotation affichent « — »).
