import type { AchievementDef } from "@/types";

export interface AchievementContext {
  assetCount: number;
  transactionCount: number;
  recurringCount: number;
  analysisCount: number;
  decisionCount: number;
  /** Ensemble des valeurs Pilier présentes dans les actifs */
  piliers: Set<string>;
  /** patrimoine total = snapshots + epargnePrecautionMontant */
  totalValue: number;
  epargneMensuelle: number | null | undefined;
  epargnePrecautionMontant: number | null | undefined;
  ageCible: number | null | undefined;
  ageActuel: number | null | undefined;
  allocationDetaillee: unknown[] | null | undefined;
}

export type AchievementWithCriteria = AchievementDef & {
  criteria: (ctx: AchievementContext) => boolean;
};

export const ACHIEVEMENTS: AchievementWithCriteria[] = [
  // ── Portefeuille ────────────────────────────────────────────────────────────
  {
    id: "premiers_pas",
    label: "Premiers pas",
    description: "Créer votre premier actif",
    category: "portefeuille",
    tier: "bronze",
    icon: "Footprints",
    criteria: (ctx) => ctx.assetCount >= 1,
  },
  {
    id: "premier_achat",
    label: "Premier achat",
    description: "Enregistrer une première transaction",
    category: "portefeuille",
    tier: "bronze",
    icon: "ShoppingCart",
    criteria: (ctx) => ctx.transactionCount >= 1,
  },
  {
    id: "investisseur_regulier",
    label: "Investisseur régulier",
    description: "Créer un investissement récurrent",
    category: "portefeuille",
    tier: "silver",
    icon: "RefreshCcw",
    criteria: (ctx) => ctx.recurringCount >= 1,
  },
  {
    id: "diversifie",
    label: "Diversifié",
    description: "Avoir des actifs dans les 4 piliers",
    category: "portefeuille",
    tier: "silver",
    icon: "Layers",
    criteria: (ctx) =>
      ctx.piliers.has("PEA") &&
      ctx.piliers.has("CRYPTO") &&
      ctx.piliers.has("IMMO") &&
      ctx.piliers.has("AUTRE"),
  },
  // ── Profil ──────────────────────────────────────────────────────────────────
  {
    id: "epargne_active",
    label: "Épargnant actif",
    description: "Saisir une épargne mensuelle",
    category: "profil",
    tier: "bronze",
    icon: "PiggyBank",
    criteria: (ctx) =>
      ctx.epargneMensuelle != null && ctx.epargneMensuelle > 0,
  },
  {
    id: "matelas_precaution",
    label: "Matelas de précaution",
    description: "Renseigner une épargne de précaution",
    category: "profil",
    tier: "bronze",
    icon: "Shield",
    criteria: (ctx) =>
      ctx.epargnePrecautionMontant != null && ctx.epargnePrecautionMontant > 0,
  },
  {
    id: "profil_complet",
    label: "Profil complet",
    description: "Renseigner âge actuel, âge cible et épargne mensuelle",
    category: "profil",
    tier: "silver",
    icon: "UserCheck",
    criteria: (ctx) =>
      ctx.ageActuel != null &&
      ctx.ageCible != null &&
      ctx.epargneMensuelle != null &&
      ctx.epargneMensuelle > 0,
  },
  {
    id: "stratege",
    label: "Stratège",
    description: "Définir une allocation cible détaillée",
    category: "profil",
    tier: "silver",
    icon: "Target",
    criteria: (ctx) =>
      Array.isArray(ctx.allocationDetaillee) && ctx.allocationDetaillee.length > 0,
  },
  // ── Patrimoine ──────────────────────────────────────────────────────────────
  {
    id: "premier_cap",
    label: "Cap des 10 000 €",
    description: "Atteindre 10 000 € de patrimoine",
    category: "patrimoine",
    tier: "bronze",
    icon: "TrendingUp",
    criteria: (ctx) => ctx.totalValue >= 10_000,
  },
  {
    id: "cap_50k",
    label: "Cap des 50 000 €",
    description: "Atteindre 50 000 € de patrimoine",
    category: "patrimoine",
    tier: "silver",
    icon: "BarChart2",
    criteria: (ctx) => ctx.totalValue >= 50_000,
  },
  {
    id: "cap_100k",
    label: "Cap des 100 000 €",
    description: "Atteindre 100 000 € de patrimoine",
    category: "patrimoine",
    tier: "silver",
    icon: "Award",
    criteria: (ctx) => ctx.totalValue >= 100_000,
  },
  {
    id: "cap_250k",
    label: "Cap des 250 000 €",
    description: "Atteindre 250 000 € de patrimoine",
    category: "patrimoine",
    tier: "gold",
    icon: "Star",
    criteria: (ctx) => ctx.totalValue >= 250_000,
  },
  {
    id: "cap_500k",
    label: "Mi-chemin",
    description: "Atteindre 500 000 € de patrimoine",
    category: "patrimoine",
    tier: "gold",
    icon: "Flag",
    criteria: (ctx) => ctx.totalValue >= 500_000,
  },
  {
    id: "millionnaire",
    label: "Premier Million",
    description: "Atteindre 1 000 000 € de patrimoine",
    category: "patrimoine",
    tier: "diamond",
    icon: "Trophy",
    criteria: (ctx) => ctx.totalValue >= 1_000_000,
  },
  // ── Engagement ──────────────────────────────────────────────────────────────
  {
    id: "analyste",
    label: "Analyste",
    description: "Générer une analyse Claude",
    category: "engagement",
    tier: "silver",
    icon: "Zap",
    criteria: (ctx) => ctx.analysisCount >= 1,
  },
  {
    id: "decision_posee",
    label: "Décision posée",
    description: "Enregistrer une décision stratégique",
    category: "engagement",
    tier: "bronze",
    icon: "BookOpen",
    criteria: (ctx) => ctx.decisionCount >= 1,
  },
];
