import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { AllocationGap } from "@/components/portfolio/AllocationGap";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";
import { PortfolioHero } from "@/components/portfolio/PortfolioHero";
import { RecurringInvestments } from "@/components/portfolio/RecurringInvestments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";


function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function PortefeuillePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [summary, recurringRaw] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.recurringInvestment.findMany({
      where: { userId },
      include: { asset: { select: { name: true, pilier: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const { piliers, lastUpdated, liquiditeSummary } = summary;

  // Les piliers reçus du service sont déjà calculés sur totalInvestissable
  // (hors LIQUIDITE) — pas besoin de recalculer les pourcentages.
  const piliersNet = piliers;

  const recurringData = recurringRaw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    frequency: r.frequency as "daily" | "weekly" | "monthly",
    asset: { name: r.asset.name, pilier: r.asset.pilier as string },
  }));

  // Flat list of assets for the RecurringInvestments form
  // Les actifs Compte courant (LIQUIDITE) sont exclus des investissements récurrents
  const assetsList = piliers.flatMap((p) =>
    p.assets.map((a) => ({ id: a.id, name: a.name, pilier: p.pilier as string }))
  );

  // Piliers pour PortfolioClient : inclure un faux pilier LIQUIDITE si nécessaire
  // pour que les actifs Compte courant apparaissent dans la liste des actifs.
  const piliersForManager: typeof piliers = liquiditeSummary
    ? [...piliers, liquiditeSummary]
    : piliers;

  return (
    <>
      <Header
        title="Portefeuille"
        description={`Mis à jour le ${formatDate(lastUpdated)}`}
      />

      <div className="p-6 space-y-6">
        {/* Hero card + graphique évolution (gauche) + répartition par pilier (droite) */}
        <PortfolioHero totalValue={summary.totalValue} piliers={piliersNet} />

        {/* Écart allocation */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Écart vs allocation cible</CardTitle>
            <CardDescription>
              La barre verticale indique l&apos;objectif d&apos;allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationGap piliers={piliersNet} />
          </CardContent>
        </Card>

        {/* Détail des actifs (gauche) + Investissements automatiques (droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Gestion des actifs */}
          <PortfolioClient piliers={piliersForManager} />

          {/* Investissements automatiques */}
          <Card className="shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Investissements automatiques</CardTitle>
              <CardDescription>
                Programmes d&apos;investissement récurrents sur vos actifs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringInvestments
                initialData={recurringData}
                assets={assetsList}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
