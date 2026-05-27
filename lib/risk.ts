/**
 * Calcul du score de risque global du portefeuille.
 *
 * Formule :
 *   score = Σ (poids_réel × volatilité_pilier) + facteur_écart_allocation
 *
 * Base de référence : portfolio.totalValue (actifs investis uniquement).
 * L'épargne de précaution (matelasEur / epargnePrecautionMontant) est exclue —
 * c'est une réserve hors portefeuille, pas un actif investi.
 *
 * Les actifs de type Cash qui sont de vrais Asset en base (pilier AUTRE)
 * sont inclus normalement dans le pilier AUTRE avec leur volatilité propre.
 *
 * Plage finale : 0 (risque minimal théorique) → 1 (risque maximal)
 */

import type { RiskScore, PilierRisk, RiskAlert } from "@/types";
import { PILIER, PILIER_VOLATILITY } from "@/types";
import type { Pilier } from "@/types";

interface PilierInput {
  pilier: Pilier;
  totalValue: number;
  percentage: number;       // poids réel en % — calculé sur portfolio.totalValue
  targetPercentage: number; // poids cible en %
  allocationGap: number;    // percentage - targetPercentage
}

// Seuils d'alerte d'écart (en points de %)
const ALERT_WARNING_GAP = 5;
const ALERT_DANGER_GAP = 15;

// Seuils de niveau de risque global
const LEVEL_MODERE = 0.35;
const LEVEL_ELEVE = 0.55;

/**
 * @param piliers  Piliers avec percentage calculé sur portfolio.totalValue
 */
export function computeRiskScore(
  piliers: PilierInput[],
): RiskScore {
  const totalValue = piliers.reduce((s, p) => s + p.totalValue, 0);

  if (totalValue === 0) {
    return buildEmptyScore();
  }

  // ── Calcul du score de base ──────────────────────────────────────
  // score_base = Σ (poids_réel × volatilité) sur piliers investis
  const detail: PilierRisk[] = piliers.map((p) => {
    const weight = p.percentage / 100;
    const volatility = PILIER_VOLATILITY[p.pilier];
    const contribution = weight * volatility;

    return {
      pilier: p.pilier,
      weight,
      volatility,
      contribution: Math.round(contribution * 1000) / 1000,
      allocationGap: p.allocationGap,
    };
  });

  const baseScore = detail.reduce((s, d) => s + d.contribution, 0);

  // ── Facteur d'écart ─────────────────────────────────────────────
  // Chaque sur/sous-pondération d'un pilier volatile modifie le score.
  // facteur = Σ (gap_normalisé × volatilité)
  const gapFactor = detail.reduce((f, d) => {
    const normalizedGap = d.allocationGap / 100;
    return f + normalizedGap * d.volatility;
  }, 0);

  // Score final borné entre 0 et 1
  const rawScore = Math.max(0, Math.min(1, baseScore + gapFactor * 0.5));
  const score = Math.round(rawScore * 1000) / 1000;

  const level: RiskScore["level"] =
    score < LEVEL_MODERE ? "faible" : score < LEVEL_ELEVE ? "modéré" : "élevé";

  // ── Alertes ─────────────────────────────────────────────────────
  const alerts: RiskAlert[] = [];

  for (const p of piliers) {
    const absGap = Math.abs(p.allocationGap);
    const isOver = p.allocationGap > 0;

    if (absGap >= ALERT_DANGER_GAP) {
      alerts.push({
        pilier: p.pilier,
        severity: "danger",
        message: isOver
          ? `${pilierLabel(p.pilier)} surpondéré de ${absGap.toFixed(1)} pts — rééquilibrage urgent`
          : `${pilierLabel(p.pilier)} sous-pondéré de ${absGap.toFixed(1)} pts vs objectif`,
      });
    } else if (absGap >= ALERT_WARNING_GAP) {
      alerts.push({
        pilier: p.pilier,
        severity: "warning",
        message: isOver
          ? `${pilierLabel(p.pilier)} légèrement surpondéré (+${absGap.toFixed(1)} pts)`
          : `${pilierLabel(p.pilier)} légèrement sous-pondéré (-${absGap.toFixed(1)} pts)`,
      });
    }
  }

  // Alerte spécifique Crypto (volatilité haute)
  const crypto = piliers.find((p) => p.pilier === PILIER.CRYPTO);
  if (crypto && crypto.percentage > 30) {
    alerts.push({
      pilier: PILIER.CRYPTO,
      severity: "danger",
      message: `Crypto représente ${crypto.percentage.toFixed(1)} % du portefeuille — exposition très élevée`,
    });
  }

  return { score, level, detail, alerts };
}

function pilierLabel(pilier: Pilier): string {
  const labels: Record<Pilier, string> = {
    PEA: "PEA",
    CRYPTO: "Crypto",
    IMMO: "Immobilier",
    AUTRE: "Autre",
    LIQUIDITE: "Compte courant",
  };
  return labels[pilier];
}

/** Piliers réels inclus dans le calcul de risque (LIQUIDITE exclu) */
const RISK_PILIERS: Pilier[] = ["PEA", "CRYPTO", "IMMO", "AUTRE"];

function buildEmptyScore(): RiskScore {
  return {
    score: 0,
    level: "faible",
    detail: RISK_PILIERS.map((pilier) => ({
      pilier,
      weight: 0,
      volatility: PILIER_VOLATILITY[pilier],
      contribution: 0,
      allocationGap: 0,
    })),
    alerts: [],
  };
}
