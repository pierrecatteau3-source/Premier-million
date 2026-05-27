import type { AllocationCible, AllocationDetaillee } from "./portfolio";

/** Profil utilisateur tel que retourné par GET /api/profile */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  /** Objectif patrimonial en euros */
  objectif: number;
  /** Âge cible pour atteindre l'objectif */
  ageCible: number | null;
  /** Âge actuel de l'utilisateur */
  ageActuel: number | null;
  /** Épargne mensuelle en euros */
  epargneMensuelle: number | null;
  /** Épargne de précaution en nombre de mois de dépenses */
  epargnePrecaution: number | null;
  /** Montant € de l'épargne de précaution (saisie directe) */
  epargnePrecautionMontant?: number | null;
  /** Taux d'évolution annuel de l'épargne en % */
  evolutionEpargne: number | null;
  /** Perte maximale acceptable en % */
  risqueMaxPerte: number | null;
  /** Niveau de connaissance en investissement */
  niveauConnaissance: string | null;
  /** Rendement annuel moyen visé en % */
  objectifCroissance: number | null;
  allocationCible: AllocationCible;
  allocationDetaillee: AllocationDetaillee | null;
  createdAt: string;
  /** Progression calculée côté serveur (0-100) */
  progressionPercent: number;
}

/** Payload pour mettre à jour le profil — PUT /api/profile */
export interface UpdateProfileInput {
  name?: string;
  ageCible?: number | null;
  ageActuel?: number | null;
  epargneMensuelle?: number | null;
  epargnePrecaution?: number | null;
  epargnePrecautionMontant?: number | null;
  evolutionEpargne?: number | null;
  risqueMaxPerte?: number | null;
  niveauConnaissance?: string | null;
  objectifCroissance?: number | null;
  allocationCible?: AllocationCible;
  allocationDetaillee?: AllocationDetaillee | null;
}

/** Décision stratégique enregistrée */
export interface Decision {
  id: string;
  userId: string;
  date: string;
  description: string;
  createdAt: string;
}

/** Payload pour créer une décision — POST /api/decisions */
export interface CreateDecisionInput {
  date: string;
  description: string;
}
