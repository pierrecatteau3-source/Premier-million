export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  category: "patrimoine" | "portefeuille" | "profil" | "engagement";
  tier: "bronze" | "silver" | "gold" | "diamond";
  /** Nom du composant Lucide */
  icon: string;
}

export interface UserAchievementStatus extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
}
