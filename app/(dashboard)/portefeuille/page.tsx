import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";
import { TreasureHeader } from "@/components/portfolio/TreasureHeader";
import { AllocationCard } from "@/components/portfolio/AllocationCard";
import { DecisionJournal } from "@/components/portfolio/DecisionJournal";
import { RecurringInvestments } from "@/components/portfolio/RecurringInvestments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function PortefeuillePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [summary, recurringRaw, decisionsRaw] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.recurringInvestment.findMany({
      where: { userId },
      include: { asset: { select: { name: true, pilier: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.decision.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 6,
      select: { id: true, date: true, description: true },
    }),
  ]);

  const { piliers, liquiditeSummary } = summary;

  const recurringData = recurringRaw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    frequency: r.frequency as "daily" | "weekly" | "monthly",
    asset: { name: r.asset.name, pilier: r.asset.pilier as string },
  }));

  const assetsList = piliers.flatMap((p) =>
    p.assets.map((a) => ({ id: a.id, name: a.name, pilier: p.pilier as string }))
  );

  const piliersForManager: typeof piliers = liquiditeSummary
    ? [...piliers, liquiditeSummary]
    : piliers;

  // Stats trésor
  const allAssets = [
    ...piliers.flatMap((p) => p.assets),
    ...(liquiditeSummary?.assets ?? []),
  ];
  const investi = allAssets.reduce((s, a) => s + (a.coutRevient ?? 0), 0);
  const pnl = allAssets.reduce((s, a) => s + (a.pvLatente ?? 0), 0);
  const perfPct = investi > 0 ? (pnl / investi) * 100 : null;
  const assetCount = allAssets.length;

  const decisions = decisionsRaw.map((d) => ({
    id: d.id,
    date: d.date.toISOString(),
    description: d.description,
  }));

  return (
    <>
      <TreasureHeader
        totalValue={summary.totalValue}
        investi={investi}
        pnl={pnl}
        perfPct={perfPct}
        monthlyChange={summary.monthlyChange}
        monthlyChangePercent={summary.monthlyChangePercent}
        assetCount={assetCount}
      />

      <div className="mt-3.5">
        <PortfolioClient piliers={piliersForManager} />
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <AllocationCard piliers={piliers} />
        <DecisionJournal decisions={decisions} />
      </div>

      <Card className="mt-3.5">
        <CardHeader>
          <CardTitle className="text-[22px]">
            Investissements <em className="italic text-gold">automatiques</em>
          </CardTitle>
          <CardDescription>
            Programmes d&apos;investissement récurrents sur vos actifs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecurringInvestments initialData={recurringData} assets={assetsList} />
        </CardContent>
      </Card>
    </>
  );
}
