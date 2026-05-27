import type { Pilier } from "./enums";

// ─── Allocation cible ─────────────────────────────────────────────────────────

/** Répartition cible en pourcentage — total doit être égal à 100 */
export interface AllocationCible {
  pea: number;
  crypto: number;
  immo: number;
  autre: number;
}

/** Une ligne de l'allocation détaillée */
export interface AllocationDetailleeLine {
  type: string;
  subtype: string;
  pct: number;
}

/** Allocation détaillée complète */
export type AllocationDetaillee = AllocationDetailleeLine[];

// ─── Actif ────────────────────────────────────────────────────────────────────

/** Actif tel que retourné par l'API (dates sérialisées en string) */
export interface Asset {
  id: string;
  name: string;
  pilier: Pilier;
  type: string;
  userId: string;
  createdAt: string;
  /** Dernier snapshot connu — optionnel selon l'endpoint */
  latestValue?: number;
  latestDate?: string;
}

/** Payload pour créer un actif — POST /api/assets */
export interface CreateAssetInput {
  name: string;
  pilier: Pilier;
  type: string;
}

/** Payload pour modifier un actif — PUT /api/assets/[id] */
export interface UpdateAssetInput {
  name?: string;
  pilier?: Pilier;
  type?: string;
}

// ─── Snapshot (valeur mensuelle) ─────────────────────────────────────────────

/** Valeur d'un actif à une date donnée */
export interface Snapshot {
  id: string;
  assetId: string;
  value: number;
  date: string;
  createdAt: string;
}

/** Payload pour saisir une valeur — POST /api/snapshots */
export interface CreateSnapshotInput {
  assetId: string;
  value: number;
  date: string;
}

// ─── Investissements récurrents ───────────────────────────────────────────────

export interface RecurringInvestment {
  id: string;
  assetId: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  active: boolean;
  createdAt: string;
  asset: { name: string; pilier: string };
}

// ─── Agrégations portefeuille ────────────────────────────────────────────────

/** Actif tel qu'il apparaît dans un PilierSummary (inclut les champs de pricing et PnL) */
export interface PilierAsset extends Pick<Asset, "id" | "name" | "type" | "latestValue" | "latestDate"> {
  ticker?: string | null;
  pricingMode?: string;
  /** Quantité totale détenue (somme des transactions) */
  quantiteTotal?: number | null;
  /** Coût de revient total = Σ montantInvesti */
  coutRevient?: number | null;
  /** Prix moyen pondéré = coutRevient / quantiteTotal */
  pmp?: number | null;
  /** Plus-value latente = latestValue - coutRevient */
  pvLatente?: number | null;
  /** Performance % = (pvLatente / coutRevient) × 100 */
  pvPct?: number | null;
}

/** Résumé d'un pilier dans le portefeuille */
export interface PilierSummary {
  pilier: Pilier;
  totalValue: number;
  percentage: number;
  targetPercentage: number;
  /** Écart en points de % entre réel et cible (peut être négatif) */
  allocationGap: number;
  assets: PilierAsset[];
}

/** Réponse de GET /api/portfolio/summary */
export interface PortfolioSummary {
  totalValue: number;
  /** Variation en valeur absolue vs mois précédent */
  monthlyChange: number;
  /** Variation en % vs mois précédent */
  monthlyChangePercent: number;
  piliers: PilierSummary[];
  /** Date du snapshot le plus récent */
  lastUpdated: string | null;
  /**
   * Valeur totale des actifs de type "Compte courant" (pilier LIQUIDITE).
   * Incluse dans totalValue mais absente des piliers (PEA/Crypto/Immo/Autre).
   */
  liquidites: number;
  /**
   * Résumé des actifs "Compte courant" (pilier LIQUIDITE) pour l'affichage dans
   * la liste des actifs. Absent des graphiques de répartition et de Risque & Atouts.
   */
  liquiditeSummary: PilierSummary | null;
}
