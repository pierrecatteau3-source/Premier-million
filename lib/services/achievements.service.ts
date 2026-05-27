import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { getPortfolioSummary } from "./portfolio.service";
import type { AchievementDef } from "@/types";

export async function checkAndUnlockAchievements(userId: string): Promise<AchievementDef[]> {
  const [
    user,
    assetCount,
    transactionCount,
    recurringCount,
    analysisCount,
    decisionCount,
    assetsByPilier,
    portfolio,
    existing,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        epargneMensuelle: true,
        epargnePrecautionMontant: true,
        ageCible: true,
        ageActuel: true,
        allocationDetaillee: true,
      },
    }),
    prisma.asset.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.recurringInvestment.count({ where: { userId, active: true } }),
    prisma.analysis.count({ where: { userId } }),
    prisma.decision.count({ where: { userId } }),
    prisma.asset.groupBy({ by: ["pilier"], where: { userId } }),
    getPortfolioSummary(userId),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedIds = new Set(existing.map((a) => a.achievementId));

  const ctx = {
    assetCount,
    transactionCount,
    recurringCount,
    analysisCount,
    decisionCount,
    piliers: new Set(assetsByPilier.map((a) => String(a.pilier))),
    totalValue: portfolio.totalValue, // snapshots validés uniquement — exclut l'épargne de précaution saisie manuellement
    epargneMensuelle: user?.epargneMensuelle,
    epargnePrecautionMontant: user?.epargnePrecautionMontant,
    ageCible: user?.ageCible,
    ageActuel: user?.ageActuel,
    allocationDetaillee: user?.allocationDetaillee as unknown[] | null,
  };

  // Révoquer les succès dont le critère n'est plus rempli
  const toRevoke = Array.from(unlockedIds).filter((id) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    return def && !def.criteria(ctx);
  });

  if (toRevoke.length > 0) {
    await prisma.userAchievement.deleteMany({
      where: { userId, achievementId: { in: toRevoke } },
    });
    toRevoke.forEach((id) => unlockedIds.delete(id));
  }

  // Débloquer les succès dont le critère est maintenant rempli
  const newlyUnlocked: AchievementDef[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;
    if (!achievement.criteria(ctx)) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    newlyUnlocked.push({
      id: achievement.id,
      label: achievement.label,
      description: achievement.description,
      category: achievement.category,
      tier: achievement.tier,
      icon: achievement.icon,
    });
  }

  return newlyUnlocked;
}
