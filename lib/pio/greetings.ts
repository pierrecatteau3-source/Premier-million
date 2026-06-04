/**
 * Banque de 30 salutations de Pio, par tranche horaire.
 * Module pur (importable côté client pour le fallback). Pas d'import serveur.
 *
 * Le choix est aléatoire mais toujours cohérent avec l'heure locale.
 * Une "vanne marché du jour" peut être ajoutée à partir de données live
 * (voir buildMarketJab), côté serveur.
 */

import type { MarketSnapshot } from "@/lib/services/market-data.service";

export type Slot = "nuit" | "matin" | "aprem" | "soir";

interface Greeting {
  slot: Slot;
  text: string;
}

export const GREETINGS: Greeting[] = [
  // ── Nuit (0h–6h) ──────────────────────────────────────────────
  { slot: "nuit", text: "Oula, il est tard. Le marché dort, toi aussi tu devrais." },
  { slot: "nuit", text: "Tu check ton patrimoine à cette heure ? Respect. Mais va dormir un peu." },
  { slot: "nuit", text: "La nuit porte conseil, jamais les ordres de bourse. On verra ça demain, au calme." },
  { slot: "nuit", text: "Insomnie ou motivation ? Dans les deux cas, je suis là." },
  { slot: "nuit", text: "À cette heure, même les bougies japonaises sont au dodo. Pose-toi." },
  { slot: "nuit", text: "Coucou noctambule. Rien d'urgent ce soir : le million attendra le réveil." },

  // ── Matin (6h–12h) ────────────────────────────────────────────
  { slot: "matin", text: "Bien dormi ? Allez, nouvelle journée, nouveau petit pas vers le million." },
  { slot: "matin", text: "Café d'abord, patrimoine ensuite. Dans cet ordre, sinon ça pique." },
  { slot: "matin", text: "Le marché ouvre : on respire, on regarde, on panique pas." },
  { slot: "matin", text: "Bonjour ! Aujourd'hui on construit, brique par brique." },
  { slot: "matin", text: "Réveil tranquille ? Parfait, les meilleures décisions se prennent à froid." },
  { slot: "matin", text: "Salut l'investisseur. On garde le cap, comme d'hab." },
  { slot: "matin", text: "Matinée idéale pour ne rien faire de précipité. C'est ça, la force." },
  { slot: "matin", text: "Hello ! T'as pensé à ton versement du mois ? Je dis ça, je dis rien." },
  { slot: "matin", text: "Le soleil se lève, ton patrimoine aussi — sur le long terme, hein." },

  // ── Après-midi (12h–18h) ──────────────────────────────────────
  { slot: "aprem", text: "Petite pause patrimoine en plein aprem ? Bonne idée." },
  { slot: "aprem", text: "Coup de barre de 14h ? Regarder ses progrès, ça réveille." },
  { slot: "aprem", text: "L'après-midi, le moment parfait pour relire ta stratégie au calme." },
  { slot: "aprem", text: "Salut ! Le marché s'agite, nous on reste posés sur la planche." },
  { slot: "aprem", text: "Yo. Rien ne presse, on glisse vers l'objectif tranquillement." },
  { slot: "aprem", text: "Bonjour ! Un petit check rapide et on retourne vivre sa vie ?" },
  { slot: "aprem", text: "Milieu de journée, milieu de chemin vers le million. On avance." },
  { slot: "aprem", text: "Re ! T'inquiète, j'ai gardé un œil sur tout pendant ce temps." },

  // ── Soir (18h–0h) ─────────────────────────────────────────────
  { slot: "soir", text: "Bonsoir ! Journée finie, on fait le point sans stress ?" },
  { slot: "soir", text: "Le marché ferme, l'esprit bientôt aussi. On regarde vite fait." },
  { slot: "soir", text: "Soirée tranquille ? Parfait pour penser long terme, pas court terme." },
  { slot: "soir", text: "Salut ! Bilan du soir : t'es un cran plus près du million qu'hier." },
  { slot: "soir", text: "Bonne soirée. Les paniques de fin de journée, c'est pas notre style." },
  { slot: "soir", text: "Yo, l'heure de débrancher approche. Un dernier coup d'œil et au lit." },
  { slot: "soir", text: "Coucou ! On souffle, on relativise : demain est un autre jour de bourse." },
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

/** Petit pic sur le marché du jour à partir d'un snapshot live. "" si pas de données. */
export function buildMarketJab(snapshot: MarketSnapshot | null): string {
  if (!snapshot) return "";

  const btc = snapshot.crypto?.btc?.change24h;
  if (typeof btc === "number" && Number.isFinite(btc)) {
    const v = Math.round(btc * 10) / 10;
    if (v >= 5) return `Et le BTC qui fait +${v} % aujourd'hui — t'as bien fait de pas tout vendre 😏`;
    if (v >= 1.5) return `Le BTC est dans le vert (+${v} %), mais on s'enflamme pas hein.`;
    if (v <= -5) return `Le BTC se prend ${v} % aujourd'hui. Respire, on joue le long terme.`;
    if (v <= -1.5) return `Petit coup de mou sur le BTC (${v} %), rien de dramatique.`;
    return `BTC quasi à plat aujourd'hui (${v >= 0 ? "+" : ""}${v} %) — journée parfaite pour rien faire de bête.`;
  }

  const cac = snapshot.indices?.cac40?.change1d;
  if (typeof cac === "number" && Number.isFinite(cac)) {
    const v = Math.round(cac * 10) / 10;
    return v >= 0
      ? `Le CAC est à +${v} % aujourd'hui, tranquille.`
      : `Le CAC fait ${v} % aujourd'hui, on garde le cap.`;
  }

  return "";
}

/** Ligne marché factuelle pour le contexte du chat (pas une vanne). "" si rien. */
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
