import type { Pilier } from "./enums";

/** Score de risque détaillé pour un pilier */
export interface PilierRisk {
  pilier: Pilier;
  /** Poids réel dans le portefeuille (0-1) */
  weight: number;
  /** Volatilité estimée du pilier (0-1) */
  volatility: number;
  /** Contribution de ce pilier au score global */
  contribution: number;
  /** Écart vs allocation cible en points (peut être négatif) */
  allocationGap: number;
}

/** Seuils d'alerte par pilier */
export interface RiskAlert {
  pilier: Pilier;
  message: string;
  /** "warning" = écart notable, "danger" = écart critique */
  severity: "warning" | "danger";
}

/**
 * Réponse de computeRiskScore
 *
 * Score global = Σ (poids_pilier × volatilité_pilier) × facteur_écart_allocation
 * Les poids sont calculés sur portfolio.totalValue (actifs investis uniquement).
 * L'épargne de précaution (matelasEur) est exclue — hors portefeuille investi.
 * Plage : 0 (risque minimal) → 1 (risque maximal théorique)
 */
export interface RiskScore {
  /** Score global normalisé entre 0 et 1 */
  score: number;
  /** Interprétation : "faible" | "modéré" | "élevé" */
  level: "faible" | "modéré" | "élevé";
  detail: PilierRisk[];
  alerts: RiskAlert[];
}
