import { Medal } from "./Medal";
import { AchievementChapter } from "./AchievementChapter";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { UserAchievementStatus } from "@/types";

const CHAPTERS: Array<{
  key: UserAchievementStatus["category"];
  num: string;
  title: string;
  sub: string;
}> = [
  { key: "patrimoine", num: "I", title: "Patrimoine", sub: "Jalons vers le million" },
  { key: "portefeuille", num: "II", title: "Portefeuille", sub: "Construire & diversifier" },
  { key: "comportement", num: "III", title: "Comportement", sub: "Style & allocation" },
  { key: "regularite", num: "IV", title: "Régularité", sub: "Constance des versements" },
  { key: "profil", num: "V", title: "Profil", sub: "Compléter sa stratégie" },
  { key: "secret", num: "VI", title: "Casseroles", sub: "Les ratés assumés · l'humour de Pio" },
  { key: "engagement", num: "VII", title: "Engagement", sub: "Outils d'analyse & suivi" },
];

interface Props {
  achievements: UserAchievementStatus[];
}

export function AchievementGrid({ achievements }: Props) {
  return (
    <TooltipProvider delay={150}>
      {CHAPTERS.map(({ key, num, title, sub }) => {
        const items = achievements.filter((a) => a.category === key);
        if (items.length === 0) return null;
        const unlockedCount = items.filter((a) => a.unlocked).length;

        return (
          <AchievementChapter
            key={key}
            num={num}
            title={title}
            sub={sub}
            unlocked={unlockedCount}
            total={items.length}
          >
            {items.map((a) => (
              <Medal key={a.id} achievement={a} />
            ))}
          </AchievementChapter>
        );
      })}
    </TooltipProvider>
  );
}
