import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkAndUnlockAchievements } from "@/lib/services/achievements.service";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import type { AchievementDef, UserAchievementStatus } from "@/types";

// GET /api/achievements — liste tous les succès avec statut débloqué
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });

  const unlockedMap = new Map(unlocked.map((a) => [a.achievementId, a.unlockedAt]));

  const result: UserAchievementStatus[] = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    category: a.category,
    tier: a.tier,
    icon: a.icon,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
  }));

  return NextResponse.json({ data: result });
}

// POST /api/achievements — vérifie et débloque les nouveaux succès, retourne les non notifiés
export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  // Débloque les nouveaux succès
  await checkAndUnlockAchievements(userId);

  // Récupère tous les succès non encore notifiés (y compris ceux d'avant)
  const unnotified = await prisma.userAchievement.findMany({
    where: { userId, notified: false },
    select: { achievementId: true },
  });

  if (unnotified.length > 0) {
    await prisma.userAchievement.updateMany({
      where: { userId, notified: false },
      data: { notified: true },
    });
  }

  const unnotifiedIds = new Set(unnotified.map((a) => a.achievementId));
  const newlyUnlocked: AchievementDef[] = ACHIEVEMENTS.filter((a) =>
    unnotifiedIds.has(a.id)
  ).map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    category: a.category,
    tier: a.tier,
    icon: a.icon,
  }));

  return NextResponse.json({ data: { newlyUnlocked } });
}
