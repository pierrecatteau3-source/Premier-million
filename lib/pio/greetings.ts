/**
 * Banque de 30 salutations de Pio, par tranche horaire.
 * Module pur (importable côté client pour le fallback). Pas d'import serveur (sauf un type).
 *
 * Le choix est aléatoire mais toujours cohérent avec l'heure locale.
 * Une vanne sur la PERF RÉELLE du portefeuille de la semaine peut être ajoutée
 * (buildPerfJab) — c'est ça qui chambre vraiment l'utilisateur.
 */

import type { MarketSnapshot } from "@/lib/services/market-data.service";

export type Slot = "nuit" | "matin" | "aprem" | "soir";

interface Greeting {
  slot: Slot;
  text: string;
}

export const GREETINGS: Greeting[] = [
  // ── Nuit (0h–6h) ──────────────────────────────────────────────
  { slot: "nuit", text: "Il est genre 3h et tu check ton patrimoine. Tout va bien dans ta vie ?" },
  { slot: "nuit", text: "À cette heure, les seuls qui bougent c'est les marchés asiatiques et toi. Va dormir." },
  { slot: "nuit", text: "Insomnie ? Compter les moutons c'est gratuit, contrairement à tes nuits blanches sur les graphiques." },
  { slot: "nuit", text: "Tu sais que fixer ton portefeuille à 4h du mat' le fera pas monter, hein ?" },
  { slot: "nuit", text: "La nuit on rêve d'être riche, le jour on bosse pour. Là, t'es juste censé dormir." },
  { slot: "nuit", text: "Coucou le vampire de la bourse. Rien n'a bougé depuis 22h, promis. Au lit." },

  // ── Matin (6h–12h) ────────────────────────────────────────────
  { slot: "matin", text: "Bien dormi ? Parfait, parce que ton portefeuille, lui, a fait des cauchemars." },
  { slot: "matin", text: "Café, douche, et on évite de regarder les cours avant le 2e expresso." },
  { slot: "matin", text: "Bonjour ! Nouvelle journée pour prendre des décisions que tu regretteras dans 6 mois." },
  { slot: "matin", text: "Réveil difficile ? Attends de voir l'ouverture des marchés." },
  { slot: "matin", text: "Salut champion. Aujourd'hui on enrichit pas le courtier, on s'enrichit nous." },
  { slot: "matin", text: "Le marché ouvre bientôt. Respire. Pose ce bouton 'acheter'." },
  { slot: "matin", text: "Hello ! T'as fait ton versement du mois ou tu comptes sur la chance ?" },
  { slot: "matin", text: "Matinée idéale pour faire semblant d'avoir une stratégie." },

  // ── Après-midi (12h–18h) ──────────────────────────────────────
  { slot: "aprem", text: "Petite pause boulot pour stresser sur tes investissements ? Très sain." },
  { slot: "aprem", text: "14h, le coup de barre. Tes plus-values aussi font la sieste on dirait." },
  { slot: "aprem", text: "Tu rafraîchis la page toutes les 5 minutes ? Spoiler : ça change rien." },
  { slot: "aprem", text: "Salut ! Le marché monte, descend, remonte... un vrai skatepark. Accroche-toi." },
  { slot: "aprem", text: "Yo. T'inquiète, j'ai tout surveillé pendant que tu 'travaillais'." },
  { slot: "aprem", text: "L'aprem, le moment parfait pour relire ta strat et te demander à quoi tu pensais." },
  { slot: "aprem", text: "Bonjour ! Tu veux la version qui rassure ou les vrais chiffres ?" },
  { slot: "aprem", text: "Re ! Alors, on vient prendre des nouvelles ou se faire chambrer ?" },

  // ── Soir (18h–0h) ─────────────────────────────────────────────
  { slot: "soir", text: "Bonsoir ! Bilan du jour : toujours pas millionnaire. Mais on y bosse." },
  { slot: "soir", text: "Le marché ferme, le stress aussi normalement. Normalement." },
  { slot: "soir", text: "Soirée Netflix et lignes de bourse ? T'as une vie passionnante toi." },
  { slot: "soir", text: "Salut ! Range le téléphone, tes actions vont pas s'envoler pendant le dîner." },
  { slot: "soir", text: "Bonne soirée. Demain, un autre jour pour perdre de l'argent intelligemment." },
  { slot: "soir", text: "Yo, l'heure du débrief. T'as fait combien de bêtises aujourd'hui ?" },
  { slot: "soir", text: "Coucou ! On souffle. Même Warren Buffett éteint son écran à un moment." },
  { slot: "soir", text: "Fin de journée. Un dernier coup d'œil paniqué et au lit, allez." },
];

export function slotForHour(hour: number): Slot {
  if (hour < 6) return "nuit";
  if (hour < 12) return "matin";
  if (hour < 18) return "aprem";
  return "soir";
}

/** Choisit une salutation cohérente avec l'heure, au hasard parmi le créneau. */
export function pickGreeting(date: Date = new Date()): string {
  return pickGreetingForHour(date.getHours());
}

export function pickGreetingForHour(hour: number): string {
  const slot = slotForHour(hour);
  const pool = GREETINGS.filter((g) => g.slot === slot);
  const list = pool.length > 0 ? pool : GREETINGS;
  return list[Math.floor(Math.random() * list.length)].text;
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Vanne sur la PERF RÉELLE du portefeuille sur 7 jours (en %).
 * Plus c'est rouge, plus Pio chambre. "" si pas de donnée.
 */
export function buildPerfJab(perfPct: number | null): string {
  if (perfPct == null || !Number.isFinite(perfPct)) return "";
  const v = Math.round(perfPct * 10) / 10;
  const abs = Math.abs(v);

  if (v <= -5) {
    return pick([
      `Et... -${abs} % cette semaine. T'as investi ou tu fais du don aux marchés ? 😂`,
      `-${abs} % en 7 jours. À ce rythme, le million c'est pour ta prochaine vie.`,
      `Aïe. -${abs} % cette semaine. Même moi sur ma planche je tombe moins souvent.`,
      `-${abs} % ! Bon. On respire... et on évite surtout de tout vendre maintenant.`,
    ]);
  }
  if (v <= -2) {
    return pick([
      `Petit -${abs} % cette semaine. Rien de fou, mais on va éviter d'en rajouter hein.`,
      `-${abs} % sur 7 jours. Le marché te teste. Tiens bon, lâche pas la rampe.`,
      `On est à -${abs} % cette semaine. C'est le jeu. On vend pas dans la panique.`,
    ]);
  }
  if (v < 2) {
    return pick([
      `Semaine plate (${v >= 0 ? "+" : ""}${v} %). Ennuyeux ? Non, sain. Le calme avant le million.`,
      `Quasi à l'équilibre cette semaine. Parfait pour rien faire de bête.`,
    ]);
  }
  if (v < 5) {
    return pick([
      `+${v} % cette semaine, joli. Garde la tête froide, c'est pas encore la villa à Saint-Barth.`,
      `+${v} % sur 7 jours, pas mal du tout. On reste humble par contre.`,
    ]);
  }
  return pick([
    `+${v} % cette semaine ?! Doucement le loup de Wall Street, ça monte pas toujours.`,
    `+${v} % ! Grosse semaine. Profite, mais rappelle-toi : ça redescend aussi.`,
  ]);
}

/** Ligne marché GÉNÉRAL pour le contexte du chat (pas les actifs de l'utilisateur). "" si rien. */
export function formatMarketContext(snapshot: MarketSnapshot | null): string {
  if (!snapshot) return "";
  const parts: string[] = [];
  const pct = (v: number) => `${v >= 0 ? "+" : ""}${(Math.round(v * 10) / 10).toFixed(1)} %`;

  if (snapshot.crypto?.btc) parts.push(`BTC ${pct(snapshot.crypto.btc.change24h)} (24h)`);
  if (snapshot.crypto?.eth) parts.push(`ETH ${pct(snapshot.crypto.eth.change24h)} (24h)`);
  if (snapshot.indices?.cac40) parts.push(`CAC40 ${pct(snapshot.indices.cac40.change1d)}`);
  if (snapshot.indices?.sp500) parts.push(`S&P500 ${pct(snapshot.indices.sp500.change1d)}`);
  if (snapshot.indices?.nasdaq) parts.push(`Nasdaq ${pct(snapshot.indices.nasdaq.change1d)}`);

  return parts.join(", ");
}
