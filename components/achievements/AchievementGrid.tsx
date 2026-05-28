import { AchievementCard } from "./AchievementCard";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    key: "comportement",
    label: "Comportement",
    description: "Allocation et style d'investissement",
  },
  {
    key: "regularite",
    label: "Régularité",
    description: "Constance des versements, fidélité au temps",
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
  {
    key: "secret",
    label: "Secrets",
    description: "Anti-trophies et petits clins d'œil",
  },
];

interface Props {
  achievements: UserAchievementStatus[];
}

export function AchievementGrid({ achievements }: Props) {
  return (
    <TooltipProvider delay={150}>
      <div className="space-y-10">
        {CATEGORIES.map(({ key, label, description }) => {
          const items = achievements.filter((a) => a.category === key);
          if (items.length === 0) return null;
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
                      ? "text-xs font-semibold tabular-nums text-success"
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
    </TooltipProvider>
  );
}
