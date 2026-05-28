import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
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

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <Header
        title="Succès"
        description={`${totalUnlocked} / ${achievements.length} succès débloqués`}
      />
      <div className="p-6">
        <AchievementGrid achievements={achievements} />
      </div>
    </>
  );
}
