export type AchievementCategory =
  | "patrimoine"      // Caps de patrimoine (1k, 10k, 100k, 1M…)
  | "portefeuille"    // Création d'actifs, transactions
  | "profil"          // Config compte (épargne, allocation cible…)
  | "engagement"      // Analyses Claude, décisions
  | "regularite"      // Versements réguliers, ancienneté
  | "comportement"    // Choix d'allocation (yolo, prudent…)
  | "secret";         // Anti-trophies & easter eggs (Alzheimer, etc.)

export type AchievementTier = "bronze" | "silver" | "gold" | "diamond";

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  /** Nom du composant Lucide */
  icon: string;
  /** Si true, l'achievement n'apparaît que quand débloqué (effet surprise) */
  hidden?: boolean;
}

export interface UserAchievementStatus extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
}
