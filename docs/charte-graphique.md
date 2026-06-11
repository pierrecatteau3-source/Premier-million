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

## 7. Mobile (téléphone, < 768px)

Règles posées lors de la passe mobile (2026-06) — à respecter sur tout nouveau composant :

- **`dvh`, jamais `vh`** dans les hauteurs d'overlays (`h-[100dvh]`, `calc(100dvh-…)`) :
  `vh` ignore le clavier virtuel et la barre d'adresse iOS → zones de saisie masquées.
- **Safe areas** : tout élément `fixed` collé à un bord d'écran prend
  `env(safe-area-inset-*)` (ex. BottomNav `pb-[env(safe-area-inset-bottom)]`,
  header plein écran `pt-[max(0.75rem,env(safe-area-inset-top))]`). Le viewport racine
  est en `viewportFit: "cover"` (`app/layout.tsx`).
- **Inputs ≥ 16px sur mobile** : iOS zoome au focus sous 16px. Filet global dans
  `globals.css` (`@media (max-width: 767px) { input, select, textarea { font-size: 16px } }`) ;
  sur les champs stylés, préférer aussi l'explicite `text-base sm:text-sm`.
- **Toasts bottom** : décalés au-dessus de la BottomNav (`bottom-24 md:bottom-6`).
  Toasts top : bornés `left-4 right-4 sm:left-auto` pour ne pas déborder sur 320px.
- **Chat Pio** : plein écran sur mobile (`fixed inset-0 h-[100dvh]`), panneau flottant
  inchangé en `md:`. Scroll de la page verrouillé quand ouvert (`document.body.style.overflow`).
- **Formulaires** : toute grille de champs commence en `grid-cols-1` et ne passe en
  colonnes qu'à partir de `sm:` ; groupes de boutons/pilules en `w-full overflow-x-auto sm:w-fit`.
- **Tap feedback** : `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation`
  posés globalement — le feedback visuel vient des styles `:active` du composant.
