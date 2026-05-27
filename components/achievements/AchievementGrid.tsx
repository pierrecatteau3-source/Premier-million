import { AchievementCard } from "./AchievementCard";
import type { UserAchievementStatus } from "@/types";

const CATEGORIES: Array<{
  key: UserAchievementStatus["category"];
  label: string;
  description: string;
}> = [
  {
    key: "patrimoine",
    label: "Patrimoine",
    description: "Jalons de progression vers le million",
  },
  {
    key: "portefeuille",
    label: "Portefeuille",
    description: "Construire et diversifier ses actifs",
  },
  {
    key: "profil",
    label: "Profil",
    description: "Compléter sa stratégie d'investissement",
  },
  {
    key: "engagement",
    label: "Engagement",
    description: "Utiliser les outils d'analyse et de suivi",
  },
];

interface Props {
  achievements: UserAchievementStatus[];
}

export function AchievementGrid({ achievements }: Props) {
  return (
    <div className="space-y-10">
      {CATEGORIES.map(({ key, label, description }) => {
        const items = achievements.filter((a) => a.category === key);
        const unlockedCount = items.filter((a) => a.unlocked).length;

        return (
          <section key={key}>
            {/* En-tête de catégorie */}
            <div className="mb-5 flex items-start justify-between border-b border-border pb-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{label}</h2>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <span
                className={
                  unlockedCount === items.length
                    ? "text-xs font-semibold tabular-nums text-emerald-500"
                    : "text-xs font-medium tabular-nums text-muted-foreground"
                }
              >
                {unlockedCount} / {items.length}
              </span>
            </div>

            {/* Grille de badges */}
            <div className="flex flex-wrap gap-4">
              {items.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
