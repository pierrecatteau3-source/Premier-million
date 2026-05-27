/**
 * Enveloppes de réponse API standardisées.
 * Tous les endpoints retournent l'une de ces deux formes.
 */

export interface ApiSuccess<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  error: string;
  data?: never;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Codes d'erreur métier ────────────────────────────────────────────────────

export const API_ERRORS = {
  UNAUTHORIZED: "Non authentifié",
  FORBIDDEN: "Accès refusé",
  NOT_FOUND: "Ressource introuvable",
  VALIDATION: "Données invalides",
  INTERNAL: "Erreur serveur",
} as const;
