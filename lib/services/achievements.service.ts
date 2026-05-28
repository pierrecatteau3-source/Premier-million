import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { getPortfolioSummary } from "./portfolio.service";
import type { AchievementDef } from "@/types";

/**
 * Contexte enrichi servant à l'évaluation des critères d'achievements.
 * Recalculé à chaque check via `checkAndUnlockAchievements`.
 */
export interface AchievementContext {
  // Comptes
  assetCount: number;
  transactionCount: number;
  recurringCount: number;
  analysisCount: number;
  decisionCount: number;

  // Profil utilisateur
  epargneMensuelle: number | null | undefined;
  epargnePrecautionMontant: number | null | undefined;
  ageCible: number | null | undefined;
  ageActuel: number | null | undefined;
  allocationDetaillee: unknown[] | null | undefined;

  // Piliers
  piliers: Set<string>;
  /** Nombre d'actifs par pilier (PEA, CRYPTO, IMMO, AUTRE, LIQUIDITE) */
  assetCountByPilier: Record<string, number>;
  /** % du patrimoine par pilier (calculé sur totalValue, hors épargne précaution) */
  piliersPct: Record<string, number>;

  // Patrimoine
  totalValue: number;
  /** Somme des `montantInvesti` de toutes les transactions */
  totalInvested: number;
  /** Plus haut patrimoine observé via les snapshots historiques */
  peakValue: number;
  /** Drawdown actuel depuis le pic (en %, 0-100) */
  currentDrawdownPct: number;

  // Temporel
  accountAgeDays: number;
  daysSinceLastTransaction: number | null;
  /** Mois consécutifs (en se basant sur les transactions) avec au moins 1 tx */
  consecutiveMonthsWithTx: number;

  // Diversité
  /** Nombre de types d'actifs distincts (ex: ETF, Bitcoin, SCPI…) */
  distinctAssetTypes: number;
}

/** Calcule la diff en jours entre deux dates (b - a). */
function diffDays(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

/** Compte les mois consécutifs (à partir du mois courant) avec au moins 1 transaction. */
function computeConsecutiveMonths(txDates: Date[]): number {
  if (txDates.length === 0) return 0;

  const monthsWithTx = new Set<string>();
  for (const d of txDates) {
    monthsWithTx.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  let count = 0;
  const now = new Date();
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!monthsWithTx.has(key)) break;
    count++;
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
    if (count > 240) break; // safety cap : 20 ans max
  }

  return count;
}

export async function checkAndUnlockAchievements(userId: string): Promise<AchievementDef[]> {
  const [
    user,
    assetCount,
    transactionCount,
    recurringCount,
    analysisCount,
    decisionCount,
    assetsByPilier,
    assetsForTypes,
    portfolio,
    lastTransaction,
    txDates,
    txSumAgg,
    snapshotPeak,
    existing,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
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
    prisma.asset.groupBy({
      by: ["pilier"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.asset.findMany({
      where: { userId },
      select: { type: true },
    }),
    getPortfolioSummary(userId),
    prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { date: true },
    }),
    prisma.transaction.aggregate({
      where: { userId },
      _sum: { montantInvesti: true },
    }),
    prisma.snapshot.findFirst({
      where: { asset: { userId } },
      orderBy: { value: "desc" },
      select: { value: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const unlockedIds = new Set(existing.map((a) => a.achievementId));

  // ── Calcul des champs dérivés ─────────────────────────────────────────────
  const now = new Date();
  const accountAgeDays = user?.createdAt ? diffDays(user.createdAt, now) : 0;
  const daysSinceLastTransaction = lastTransaction
    ? diffDays(lastTransaction.date, now)
    : null;
  const consecutiveMonthsWithTx = computeConsecutiveMonths(txDates.map((t) => t.date));

  const assetCountByPilier: Record<string, number> = {};
  for (const row of assetsByPilier) {
    assetCountByPilier[String(row.pilier)] = row._count._all;
  }

  const piliersPct: Record<string, number> = {};
  if (portfolio.totalValue > 0) {
    for (const p of portfolio.piliers) {
      piliersPct[String(p.pilier)] = (p.totalValue / portfolio.totalValue) * 100;
    }
  }

  const peakValue = snapshotPeak?.value ?? portfolio.totalValue;
  const currentDrawdownPct =
    peakValue > 0 ? Math.max(0, ((peakValue - portfolio.totalValue) / peakValue) * 100) : 0;

  const distinctAssetTypes = new Set(assetsForTypes.map((a) => a.type)).size;

  const ctx: AchievementContext = {
    assetCount,
    transactionCount,
    recurringCount,
    analysisCount,
    decisionCount,
    epargneMensuelle: user?.epargneMensuelle,
    epargnePrecautionMontant: user?.epargnePrecautionMontant,
    ageCible: user?.ageCible,
    ageActuel: user?.ageActuel,
    allocationDetaillee: user?.allocationDetaillee as unknown[] | null,
    piliers: new Set(assetsByPilier.map((a) => String(a.pilier))),
    assetCountByPilier,
    piliersPct,
    totalValue: portfolio.totalValue,
    totalInvested: txSumAgg._sum.montantInvesti ?? 0,
    peakValue,
    currentDrawdownPct,
    accountAgeDays,
    daysSinceLastTransaction,
    consecutiveMonthsWithTx,
    distinctAssetTypes,
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
      hidden: achievement.hidden,
    });
  }

  return newlyUnlocked;
}
