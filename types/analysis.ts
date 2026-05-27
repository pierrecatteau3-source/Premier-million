import type { Horizon } from "./enums";

/** Analyse macro telle que retournée par l'API */
export interface Analysis {
  id: string;
  userId: string;
  horizon: Horizon;
  /** Contenu Markdown généré par Claude */
  content: string;
  createdAt: string;
}

/**
 * Réponse de GET /api/analysis/[horizon] et POST /api/analysis
 * Indique si la réponse vient du cache DB ou d'un appel Claude frais.
 */
export interface AnalysisResponse {
  analysis: Analysis;
  /** true si l'analyse vient du cache (< 7 jours) */
  cached: boolean;
}

/** Payload pour déclencher une analyse — POST /api/analysis */
export interface TriggerAnalysisInput {
  horizon: Horizon;
}
