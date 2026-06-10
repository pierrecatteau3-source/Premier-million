/**
 * Moteur de scoring de risque avancé — 4 composantes.
 *
 * score_total = score_vol (0-5) + score_concentration (0-2)
 *             + score_liquidite (0-2) + score_levier (0-1)
 * Clampé entre 0 et 10.
 */

import { TYPE_TO_PILIER } from "@/lib/constants/allocation-types";
import type { AllocationDetailleeLine, PilierSummary } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskPilierInput {
  pilier: "PEA" | "CRYPTO" | "IMMO" | "AUTRE" | "LIQUIDITE";
  totalValue: number;   // valeur ajustée (AUTRE déjà nette du matelas)
  percentage: number;   // poids en % sur totalInvestissable
  lines?: { type: string; subtype: string; pct: number }[];
}

export interface RiskScoreInput {
  piliers: RiskPilierInput[];
  totalDebt?: number;   // dette totale consolidée
  totalValue: number;   // valeur totale investissable
}

export interface RiskScoreResult {
  total: number;
  scoreVol: number;
  scoreConcentration: number;
  scoreLiquidite: number;
  scoreLevier: number;
  detail: { pilier: string; volAjustee: number; hhi: number }[];
}

// ─── Tables de volatilité par subtype ─────────────────────────────────────────

/** Volatilité par subtype (chaîne exacte depuis allocationDetaillee) */
const VOL_BY_SUBTYPE: Record<string, number> = {
  // PEA / Actions
  "ETF Monde (PEA)": 0.12,
  "ETF Monde (CTO)": 0.12,
  "Actions Françaises": 0.25,
  "Actions Européennes": 0.25,
  "Actions Dividendes": 0.22,
  "Small Caps Européennes": 0.28,
  "Small Caps": 0.28,
  "Marchés Émergents": 0.22,
  "Titres vifs (Stock Picking)": 0.30,
  "Fonds Actifs": 0.20,

  // Crypto
  "Bitcoin (BTC)": 0.55,
  "Ethereum (ETH)": 0.65,
  "Altcoins": 0.80,
  "Stablecoins (Staking)": 0.01,

  // Immo
  "Résidence Principale": 0.05,
  "Investissement Locatif": 0.07,
  "SCPI / OPCI": 0.06,
  "SIIC / REITs": 0.07,
  "Crowdfunding Immobilier": 0.09,

  // Autre — Obligations / Sécurité
  "Fonds Euro": 0.005,
  "Obligations d'État": 0.04,
  "Obligations d'Entreprises": 0.06,
  "Dette Privée": 0.08,

  // Autre — Épargne
  "Livret A": 0.005,
  "LDD / LDDS": 0.005,
  "LEP": 0.005,
  "Comptes à Terme": 0.01,
  "Monétaire": 0.01,

  // Autre — Cash
  "Compte courant": 0.00,
  "Cash disponible": 0.00,

  // Autre — Alternatifs
  "Or et Métaux Précieux": 0.15,
  "Matières Premières": 0.15,
  "Private Equity": 0.20,
  "Produits Structurés": 0.12,
  "Art et Collection": 0.15,
};

/** Fallback par type de pilier quand allocationDetaillee est null */
export const VOL_FALLBACK: Record<string, number> = {
  PEA: 0.15,
  CRYPTO: 0.65,
  IMMO: 0.08,
  AUTRE: 0.05,
};

// ─── Tables de liquidité par subtype ──────────────────────────────────────────

const LIQ_BY_SUBTYPE: Record<string, number> = {
  // Très liquide
  "Compte courant": 0.00,
  "Cash disponible": 0.00,
  "Livret A": 0.00,
  "LDD / LDDS": 0.00,
  "LEP": 0.00,
  "Comptes à Terme": 0.05,
  "Monétaire": 0.02,
  "Fonds Euro": 0.05,

  // Marchés cotés
  "ETF Monde (PEA)": 0.10,
  "ETF Monde (CTO)": 0.10,
  "Actions Françaises": 0.10,
  "Actions Européennes": 0.10,
  "Actions Dividendes": 0.10,
  "Small Caps Européennes": 0.12,
  "Small Caps": 0.12,
  "Marchés Émergents": 0.12,
  "Titres vifs (Stock Picking)": 0.10,
  "Fonds Actifs": 0.10,
  "Obligations d'État": 0.10,
  "Obligations d'Entreprises": 0.12,
  "Dette Privée": 0.40,
  "SIIC / REITs": 0.10,

  // Crypto
  "Bitcoin (BTC)": 0.15,
  "Ethereum (ETH)": 0.15,
  "Altcoins": 0.20,
  "Stablecoins (Staking)": 0.10,

  // Immo peu liquide
  "SCPI / OPCI": 0.60,
  "Crowdfunding Immobilier": 0.55,
  "Résidence Principale": 0.70,
  "Investissement Locatif": 0.70,

  // Alternatifs
  "Or et Métaux Précieux": 0.15,
  "Matières Premières": 0.15,
  "Produits Structurés": 0.40,
  "Private Equity": 0.90,
  "Art et Collection": 0.80,
};

/** Fallback liquidité par pilier quand allocationDetaillee est null */
const LIQ_FALLBACK: Record<string, number> = {
  PEA: 0.10,
  CRYPTO: 0.15,
  IMMO: 0.75,
  AUTRE: 0.10,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Volatilité de référence d'un sous-type (fallback 0.20 si inconnu). */
export function volForSubtype(subtype: string): number {
  return VOL_BY_SUBTYPE[subtype] ?? 0.20;
}

function liqForSubtype(subtype: string, hasCredit: boolean): number {
  const base = LIQ_BY_SUBTYPE[subtype] ?? 0.30;
  // Si l'actif immo a un crédit → plus illiquide
  if (hasCredit && ["Résidence Principale", "Investissement Locatif", "Locatif meublé / saisonnier"].includes(subtype)) {
    return 0.85;
  }
  return base;
}

/** Volatilité pondérée d'un pilier depuis ses lignes d'allocation détaillée */
function computePilierVol(
  pilier: string,
  lines: { type: string; subtype: string; pct: number }[]
): number {
  const total = lines.reduce((s, l) => s + l.pct, 0);
  if (total === 0) return VOL_FALLBACK[pilier] ?? 0.15;

  let volPondere = 0;
  for (const line of lines) {
    const w = line.pct / total;
    volPondere += w * volForSubtype(line.subtype);
  }

  // Pénalité concentration sectorielle PEA : si une ligne > 50% du poids total
  if (pilier === "PEA") {
    const dominante = lines.find((l) => l.pct / total > 0.5);
    if (dominante) volPondere *= 1.20;
  }

  return volPondere;
}

/** HHI interne d'un pilier (0-1) */
function computeHHI(lines: { pct: number }[]): number {
  const total = lines.reduce((s, l) => s + l.pct, 0);
  if (total === 0) return 0;
  return lines.reduce((acc, l) => acc + Math.pow(l.pct / total, 2), 0);
}

// ─── Fonction principale ───────────────────────────────────────────────────────

export function computeAdvancedRiskScore(input: RiskScoreInput): RiskScoreResult {
  const { piliers, totalDebt = 0, totalValue } = input;

  if (totalValue === 0 || piliers.length === 0) {
    return {
      total: 0,
      scoreVol: 0,
      scoreConcentration: 0,
      scoreLiquidite: 0,
      scoreLevier: 0,
      detail: piliers.map((p) => ({ pilier: p.pilier, volAjustee: VOL_FALLBACK[p.pilier] ?? 0, hhi: 0 })),
    };
  }

  // ── Filtrer les lignes par pilier depuis allocationDetaillee ─────────────
  // lines[] dans RiskPilierInput sont déjà filtrées par le caller via TYPE_TO_PILIER

  // ── Composante 1 : Volatilité ajustée (cap /5) ───────────────────────────
  const detail: { pilier: string; volAjustee: number; hhi: number }[] = [];
  let volPortefeuille = 0;

  for (const p of piliers) {
    const lines = p.lines ?? [];
    const volAjustee = lines.length > 0
      ? computePilierVol(p.pilier, lines)
      : (VOL_FALLBACK[p.pilier] ?? 0.15);

    const hhi = lines.length > 0 ? computeHHI(lines) : 0;
    detail.push({ pilier: p.pilier, volAjustee, hhi });
    volPortefeuille += (p.percentage / 100) * volAjustee;
  }

  // 50 % de vol → score max de 5
  const scoreVol = Math.min((volPortefeuille / 0.50) * 5, 5);

  // ── Composante 2 : Concentration HHI (cap /2) ────────────────────────────
  const hhiGlobal = piliers.reduce((acc, p) => acc + Math.pow(p.percentage / 100, 2), 0);
  let scoreConcentration = hhiGlobal * 2;

  // Pénalité concentration interne PEA
  const peaDetail = detail.find((d) => d.pilier === "PEA");
  if (peaDetail && peaDetail.hhi > 0.4) {
    scoreConcentration += 0.3;
  }
  scoreConcentration = Math.min(scoreConcentration, 2);

  // ── Composante 3 : Liquidité (cap /2) ────────────────────────────────────
  let liquiditePortefeuille = 0;

  for (const p of piliers) {
    const lines = p.lines ?? [];
    if (lines.length > 0) {
      const total = lines.reduce((s, l) => s + l.pct, 0);
      let liqPilier = 0;
      for (const line of lines) {
        const w = total > 0 ? line.pct / total : 0;
        liqPilier += w * liqForSubtype(line.subtype, false);
      }
      liquiditePortefeuille += (p.percentage / 100) * liqPilier;
    } else {
      liquiditePortefeuille += (p.percentage / 100) * (LIQ_FALLBACK[p.pilier] ?? 0.30);
    }
  }
  const scoreLiquidite = Math.min(liquiditePortefeuille * 2, 2);

  // ── Composante 4 : Levier global (cap /1) ────────────────────────────────
  const levierGlobal = totalValue > 0 ? totalDebt / totalValue : 0;
  let scoreLevier = Math.min(levierGlobal * 2, 1);
  if (levierGlobal > 0.5) scoreLevier = Math.min(scoreLevier + 0.3, 1);

  // ── Score final ───────────────────────────────────────────────────────────
  const total = Math.min(
    Math.max(scoreVol + scoreConcentration + scoreLiquidite + scoreLevier, 0),
    10
  );

  return {
    total: Math.round(total * 100) / 100,
    scoreVol: Math.round(scoreVol * 100) / 100,
    scoreConcentration: Math.round(scoreConcentration * 100) / 100,
    scoreLiquidite: Math.round(scoreLiquidite * 100) / 100,
    scoreLevier: Math.round(scoreLevier * 100) / 100,
    detail,
  };
}

// ─── Assemblage de l'entrée du score depuis le portefeuille + profil ──────────

/** Champs profil nécessaires à l'ajustement matelas + allocation détaillée */
export interface RiskScoreInputProfile {
  epargnePrecautionMontant: number | null;
  epargnePrecaution: number | null;
  epargneMensuelle: number | null;
  /** Json Prisma — castée si c'est bien un tableau de lignes */
  allocationDetaillee: unknown;
}

export interface RiskScoreAssembly {
  /** Entrée prête pour computeAdvancedRiskScore */
  input: RiskScoreInput;
  /** Piliers ajustés (matelas déduit de AUTRE) avec % et écarts recalculés */
  piliersNet: PilierSummary[];
  /** Patrimoine net investissable (hors matelas de précaution) */
  patrimoineNet: number;
  /** Lignes d'allocation détaillée (vide si non renseignée) */
  allocationLines: AllocationDetailleeLine[];
}

/**
 * Assemble l'entrée du moteur de risque depuis un portefeuille + un profil :
 * déduit le matelas de précaution du pilier AUTRE, recalcule les % investissables,
 * et mappe l'allocation détaillée par pilier. Partagé entre /analyse-patrimoine
 * et le contexte advisor de Pio pour éviter toute divergence de calcul.
 */
export function buildRiskScoreInput(
  portfolio: { piliers: PilierSummary[] },
  profile: RiskScoreInputProfile
): RiskScoreAssembly {
  const matelasEur =
    profile.epargnePrecautionMontant ??
    (profile.epargnePrecaution ?? 0) * (profile.epargneMensuelle ?? 0);

  const piliersAjustes = portfolio.piliers.map((p) => ({
    ...p,
    totalValue:
      p.pilier === "AUTRE" ? Math.max(0, p.totalValue - matelasEur) : p.totalValue,
  }));

  const totalInvestissable = piliersAjustes.reduce((sum, p) => sum + p.totalValue, 0);

  const piliersNet: PilierSummary[] = piliersAjustes.map((p) => {
    const percentage =
      totalInvestissable > 0
        ? Math.round((p.totalValue / totalInvestissable) * 1000) / 10
        : 0;
    return { ...p, percentage, allocationGap: percentage - p.targetPercentage };
  });

  const allocationLines: AllocationDetailleeLine[] = Array.isArray(
    profile.allocationDetaillee
  )
    ? (profile.allocationDetaillee as AllocationDetailleeLine[])
    : [];

  const input: RiskScoreInput = {
    piliers: piliersNet.map((p) => ({
      pilier: p.pilier,
      totalValue: p.totalValue,
      percentage: p.percentage,
      lines: allocationLines.filter((l) => TYPE_TO_PILIER[l.type] === p.pilier),
    })),
    totalDebt: 0,
    totalValue: totalInvestissable,
  };

  return { input, piliersNet, patrimoineNet: totalInvestissable, allocationLines };
}

// Re-export TYPE_TO_PILIER for convenience
export { TYPE_TO_PILIER };
