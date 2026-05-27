import { prisma } from "@/lib/prisma";
import { getPortfolioSummary } from "./portfolio.service";
import type { PortfolioSummary } from "@/types";

export interface DashboardData {
  portfolio: PortfolioSummary;
  objectif: number;
  epargneMensuelle: number | null;
  progressionPercent: number;
  /** Estimation années restantes (calcul simplifié sans intérêts composés) */
  estimatedYears: number | null;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [portfolio, user] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { objectif: true, epargneMensuelle: true },
    }),
  ]);

  const objectif = user?.objectif ?? 1_000_000;
  const epargneMensuelle = user?.epargneMensuelle ?? null;

  const progressionPercent = objectif > 0
    ? Math.min((portfolio.totalValue / objectif) * 100, 100)
    : 0;

  // Estimation simple : (objectif - patrimoine) / épargne annuelle
  const manquant = objectif - portfolio.totalValue;
  const estimatedYears =
    epargneMensuelle && epargneMensuelle > 0 && manquant > 0
      ? Math.ceil(manquant / (epargneMensuelle * 12))
      : null;

  return {
    portfolio,
    objectif,
    epargneMensuelle,
    progressionPercent: Math.round(progressionPercent * 10) / 10,
    estimatedYears,
  };
}
