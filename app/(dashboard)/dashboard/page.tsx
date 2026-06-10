import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getPortfolioSummary,
  getDashboardDeltas,
} from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { MillionProgress } from "@/components/dashboard/MillionProgress";
import { PillarsGrid } from "@/components/dashboard/PillarCard";
import { EvolutionBlock } from "@/components/dashboard/EvolutionBlock";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { SectionHeading } from "@/components/dashboard/SectionHeading";
import { calculateTargetAge } from "@/lib/utils/projection";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [portfolio, user, unlocked, deltas] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        objectif: true,
        epargneMensuelle: true,
        evolutionEpargne: true,
        ageCible: true,
        ageActuel: true,
        objectifCroissance: true,
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    getDashboardDeltas(userId),
  ]);

  const objectif = user?.objectif ?? 1_000_000;
  const epargneMensuelle = user?.epargneMensuelle ?? null;
  const evolutionEpargne = user?.evolutionEpargne ?? null;
  const ageCible = user?.ageCible ?? null;
  const ageActuel = user?.ageActuel ?? null;

  const patrimoineTotal = portfolio.totalValue;
  const progressionPercent =
    objectif > 0 ? Math.min((patrimoineTotal / objectif) * 100, 100) : 0;

  const years = ageCible != null && ageActuel != null ? ageCible - ageActuel : null;

  const epargneProjectee =
    years != null && years > 0 && epargneMensuelle != null
      ? epargneMensuelle * Math.pow(1 + (evolutionEpargne ?? 0) / 100, years)
      : null;

  const targetAge =
    ageActuel != null && epargneMensuelle != null
      ? calculateTargetAge(
          patrimoineTotal,
          epargneMensuelle,
          evolutionEpargne ?? 0,
          user?.objectifCroissance ?? 8,
          ageActuel
        )
      : null;

  // Performance latente globale (somme P&L sur tous les piliers)
  const allAssets = portfolio.piliers.flatMap((p) => p.assets);
  const coutRevient = allAssets.reduce((s, a) => s + (a.coutRevient ?? 0), 0);
  const perfEur = allAssets.reduce((s, a) => s + (a.pvLatente ?? 0), 0);
  const perfPct = coutRevient > 0 ? (perfEur / coutRevient) * 100 : null;

  // Décompte actifs / piliers actifs
  const assetCount =
    allAssets.length + (portfolio.liquiditeSummary?.assets.length ?? 0);
  const pilierCount = portfolio.piliers.filter((p) => p.totalValue > 0).length;

  // Piliers complets (4 piliers + LIQUIDITE) pour le modal d'actifs
  const piliersForManager = portfolio.liquiditeSummary
    ? [...portfolio.piliers, portfolio.liquiditeSummary]
    : portfolio.piliers;

  // Prochain succès (premier non débloqué et non secret, dans l'ordre du catalogue)
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const nextAchievement =
    ACHIEVEMENTS.find((a) => !unlockedIds.has(a.id) && !a.hidden)?.label ?? null;

  return (
    <>
      <SectionHeading eyebrow="Vue d'ensemble" className="mt-1">
        Dashboard
      </SectionHeading>

      <DashboardSummary
        totalValue={patrimoineTotal}
        capRestant={Math.max(objectif - patrimoineTotal, 0)}
        targetAge={targetAge}
        assetCount={assetCount}
        pilierCount={pilierCount}
        epargneMensuelle={epargneMensuelle}
        deltas={deltas}
      />

      <MillionProgress percent={progressionPercent} />

      <SectionHeading eyebrow="Cible vs réel">
        Les <em className="italic text-gold">4 piliers</em> du trésor
      </SectionHeading>
      <PillarsGrid piliers={portfolio.piliers} piliersForManager={piliersForManager} />

      <SectionHeading eyebrow="Évolution">Graphique</SectionHeading>
      <EvolutionBlock />

      <SectionHeading eyebrow="Indicateurs clés">KPI</SectionHeading>
      <DashboardKpis
        perfPct={perfPct}
        perfEur={perfEur}
        epargneProjectee={epargneProjectee}
        ageCible={ageCible}
        nextAchievement={nextAchievement}
      />
    </>
  );
}
