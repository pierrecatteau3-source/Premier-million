import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { PilierCards } from "@/components/dashboard/PilierCards";
import { PortfolioChart } from "@/components/portfolio/PortfolioChart";
import { Card, CardContent } from "@/components/ui/card";
import { PiggyBank, TrendingUp, Target } from "lucide-react";

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

function formatEur(v: number | null) {
  if (v === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Mini KPI : version compacte avec icône or à droite. */
function CompactKpi({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: string;
  icon: typeof PiggyBank;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-card px-4 py-7 ring-1 ring-foreground/10 shadow-elev-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums leading-tight">
            {value}
            {suffix && (
              <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span>
            )}
          </p>
        </div>
        <Icon className="h-10 w-10 text-primary shrink-0 opacity-90" strokeWidth={1.75} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [portfolio, user] = await Promise.all([
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
  ]);

  const objectif = user?.objectif ?? 1_000_000;
  const epargneMensuelle = user?.epargneMensuelle ?? null;
  const evolutionEpargne = user?.evolutionEpargne ?? null;
  const ageCible = user?.ageCible ?? null;
  const ageActuel = user?.ageActuel ?? null;

  // Patrimoine total = somme actifs (snapshots) + liquidités. PAS de matelas
  // d'épargne de précaution (= réserve hors patrimoine investi, utilisée
  // seulement comme indicateur de sécurité dans le Profil).
  const patrimoineTotal = portfolio.totalValue;
  const progressionPercent =
    objectif > 0
      ? Math.min(Math.round((patrimoineTotal / objectif) * 1000) / 10, 100)
      : 0;

  const years =
    ageCible != null && ageActuel != null ? ageCible - ageActuel : null;

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
          ageActuel,
        )
      : null;

  return (
    <>
      <Header
        title="Dashboard"
        description="Progression vers le premier million"
      />

      <div className="p-6 space-y-6">
        {/* Patrimoine — pleine largeur */}
        <HeroCard
          totalValue={patrimoineTotal}
          monthlyChange={portfolio.monthlyChange}
          monthlyChangePercent={portfolio.monthlyChangePercent}
          progressionPercent={progressionPercent}
          objectif={objectif}
        />

        {/* Grille principale : 2 colonnes desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE : Piliers 2x2 */}
          <Card className="shadow-elev-1">
            <CardContent className="pt-4">
              <h2 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Patrimoine par pilier
              </h2>
              <PilierCards piliers={portfolio.piliers} />
            </CardContent>
          </Card>

          {/* COLONNE DROITE : 3 KPIs + Chart d'évolution */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CompactKpi
                label="Épargne / mois"
                value={formatEur(epargneMensuelle)}
                icon={PiggyBank}
              />
              <CompactKpi
                label={ageCible ? `À ${ageCible} ans` : "Projection"}
                value={formatEur(epargneProjectee)}
                icon={TrendingUp}
                suffix={epargneProjectee !== null ? "/mois" : undefined}
              />
              <CompactKpi
                label="Objectif atteint à"
                value={targetAge !== null ? String(targetAge) : "—"}
                icon={Target}
                suffix={targetAge !== null ? "ans" : undefined}
              />
            </div>

            <Card className="shadow-elev-1">
              <CardContent className="pt-4">
                <h2 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Évolution du patrimoine
                </h2>
                <PortfolioChart compact defaultRangeDays={30} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
