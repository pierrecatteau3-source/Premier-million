import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PilierCards } from "@/components/dashboard/PilierCards";
import { Card, CardContent } from "@/components/ui/card";

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

  const [portfolio, user] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        objectif: true,
        epargneMensuelle: true,
        epargnePrecaution: true,
        epargnePrecautionMontant: true,
        evolutionEpargne: true,
        ageCible: true,
        ageActuel: true,
        objectifCroissance: true,
      },
    }),
  ]);

  const objectif = user?.objectif ?? 1_000_000;

  const epargneMensuelle = user?.epargneMensuelle ?? null;
  const epargnePrecaution = user?.epargnePrecaution ?? null;
  const evolutionEpargne = user?.evolutionEpargne ?? null;
  const ageCible = user?.ageCible ?? null;
  const ageActuel = user?.ageActuel ?? null;

  // Formule canonique — identique à portefeuille/page.tsx et risque/page.tsx
  // epargnePrecautionMontant (saisie directe) est prioritaire ;
  // sinon fallback calculé : nb mois × dépense mensuelle.
  // Toujours un nombre (0 si non renseigné) pour les calculs patrimoniaux.
  const matelasEur: number =
    user?.epargnePrecautionMontant != null
      ? user.epargnePrecautionMontant
      : (epargnePrecaution ?? 0) * (epargneMensuelle ?? 0);

  // Version nullable pour l'affichage KPI (null = non configuré → affiche "—")
  const matelasEurDisplay: number | null =
    user?.epargnePrecautionMontant != null
      ? user.epargnePrecautionMontant
      : epargnePrecaution != null && epargneMensuelle != null
      ? epargnePrecaution * epargneMensuelle
      : null;

  // portfolio.totalValue = somme des actifs (snapshots serveur) + liquidités (Compte courant).
  // Le Cash externe (epargnePrecautionMontant) est hors actifs → on l'additionne.
  // Valeur basée sur derniers snapshots — prix live disponibles uniquement dans Portefeuille.
  const patrimoineBrut = portfolio.totalValue + matelasEur;
  const progressionPercent =
    objectif > 0
      ? Math.min(Math.round((patrimoineBrut / objectif) * 1000) / 10, 100)
      : 0;

  const years =
    ageCible != null && ageActuel != null ? ageCible - ageActuel : null;

  const epargneProjectee =
    years != null && years > 0 && epargneMensuelle != null
      ? epargneMensuelle *
        Math.pow(1 + (evolutionEpargne ?? 0) / 100, years)
      : null;

  // Projection : partir du patrimoine brut (investissable + Cash) comme base
  const targetAge =
    ageActuel != null && epargneMensuelle != null
      ? calculateTargetAge(
          patrimoineBrut,
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
        {/* Zone 1 : Hero */}
        <HeroCard
          totalValue={patrimoineBrut}
          monthlyChange={portfolio.monthlyChange}
          monthlyChangePercent={portfolio.monthlyChangePercent}
          progressionPercent={progressionPercent}
          objectif={objectif}
          matelasEur={matelasEur}
        />

        {/* Zone 2 : KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="Précaution"
            value={matelasEurDisplay}
            icon="Shield"
            suffix="€"
            formatAsCurrency={matelasEurDisplay !== null}
          />
          <KpiCard
            label="Épargne / mois"
            value={epargneMensuelle}
            icon="PiggyBank"
            suffix="€/mois"
            formatAsCurrency={epargneMensuelle !== null}
          />
          <KpiCard
            label={ageCible ? `À ${ageCible} ans` : "Projection"}
            value={epargneProjectee}
            icon="TrendingUp"
            suffix="€/mois"
            formatAsCurrency={epargneProjectee !== null}
          />
          <KpiCard
            label="Objectif atteint à"
            value={targetAge}
            icon="Target"
            suffix="ans"
            subLabel={targetAge === null ? "Renseigne ton profil" : undefined}
          />
        </div>

        {targetAge !== null && (
          <p className="text-xs text-muted-foreground -mt-2">
            Projection basée sur {user?.objectifCroissance ?? 8} %/an
            {user?.evolutionEpargne ? ` · épargne +${user.evolutionEpargne} %/an` : ""}
          </p>
        )}

        {/* Zone 3 : Saisie rapide */}
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Saisie rapide — patrimoine par pilier
            </h2>
            <PilierCards piliers={portfolio.piliers} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
