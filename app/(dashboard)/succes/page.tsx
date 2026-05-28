import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { SuccesHero } from "@/components/achievements/SuccesHero";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import type { UserAchievementStatus } from "@/types";

export default async function SuccesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });

  const unlockedMap = new Map(unlocked.map((a) => [a.achievementId, a.unlockedAt]));

  const achievements: UserAchievementStatus[] = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    category: a.category,
    tier: a.tier,
    icon: a.icon,
    hidden: a.hidden,
    hint: a.hint,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
  }));

  const total = achievements.length;
  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const pct = total > 0 ? Math.round((totalUnlocked / total) * 100) : 0;

  const tiers = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
  for (const a of achievements) {
    if (a.unlocked && a.tier in tiers) tiers[a.tier] += 1;
  }

  const next = achievements.find((a) => !a.unlocked && !a.hidden)?.label ?? null;

  return (
    <>
      <SuccesHero
        unlocked={totalUnlocked}
        total={total}
        pct={pct}
        tiers={tiers}
        next={next}
      />
      <AchievementGrid achievements={achievements} />
    </>
  );
}
