import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { PioHero } from "@/components/dashboard/PioHero";
import { TreasureStrip } from "@/components/dashboard/TreasureStrip";
import { MillionProgress } from "@/components/dashboard/MillionProgress";
import { PillarsGrid } from "@/components/dashboard/PillarCard";
import { EvolutionBlock } from "@/components/dashboard/EvolutionBlock";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { SectionHeading } from "@/components/dashboard/SectionHeading";

/** Projection de l'âge auquel l'objectif sera atteint avec intérêts composés. */
function calculateTargetAge(
  currentValue: number,
  epargneMensuelle: number,
  evolutionEpargne: number,
  objectifCroissance: number,
  ageActuel: number,
  objectif: number = 1_000_000,
  maxYears: number = 60
): number | null {
  const monthlyRate = objectifCroissance / 12 / 100;
  let value = currentValue;
  let epargne = epargneMensuelle;
  for (let year = 0; year < maxYears; year++) {
    for (let month = 0; month < 12; month++) {
      value = value * (1 + monthlyRate) + epargne;
      if (value >= objectif) return ageActuel + year + (month >= 6 ? 1 : 0);
    }
    epargne *= 1 + evolutionEpargne / 100;
  }
  return null;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [portfolio, user, unlocked] = await Promise.all([
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

  // Prochain succès (premier non débloqué et non secret, dans l'ordre du catalogue)
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const nextAchievement =
    ACHIEVEMENTS.find((a) => !unlockedIds.has(a.id) && !a.hidden)?.label ?? null;

  return (
    <>
      <SectionHeading eyebrow="Vue d'ensemble" className="mt-1">
        Dashboard
      </SectionHeading>

      <PioHero
        totalValue={patrimoineTotal}
        monthlyChange={portfolio.monthlyChange}
        monthlyChangePercent={portfolio.monthlyChangePercent}
        capRestant={Math.max(objectif - patrimoineTotal, 0)}
        targetAge={targetAge}
        assetCount={assetCount}
        pilierCount={pilierCount}
      />

      <TreasureStrip
        totalValue={patrimoineTotal}
        monthlyChange={portfolio.monthlyChange}
        epargneMensuelle={epargneMensuelle}
        targetAge={targetAge}
        assetCount={assetCount}
        pilierCount={pilierCount}
      />

      <MillionProgress percent={progressionPercent} />

      <SectionHeading eyebrow="Cible vs réel">
        Les <em className="italic text-gold">4 piliers</em> du trésor
      </SectionHeading>
      <PillarsGrid piliers={portfolio.piliers} />

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
