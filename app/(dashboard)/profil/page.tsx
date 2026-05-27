import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { DecisionList } from "@/components/profile/DecisionList";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import type { AllocationCible, AllocationDetaillee } from "@/types";
import type { Decision } from "@/types";

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, portfolio, decisionsRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        objectif: true,
        ageCible: true,
        ageActuel: true,
        epargneMensuelle: true,
        epargnePrecaution: true,
        epargnePrecautionMontant: true,
        evolutionEpargne: true,
        risqueMaxPerte: true,
        niveauConnaissance: true,
        objectifCroissance: true,
        allocationCible: true,
        allocationDetaillee: true,
        createdAt: true,
      },
    }),
    getPortfolioSummary(userId),
    prisma.decision.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const progressionPercent =
    user.objectif > 0
      ? Math.min(
          Math.round((portfolio.totalValue / user.objectif) * 1000) / 10,
          100
        )
      : 0;

  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    objectif: user.objectif,
    ageCible: user.ageCible,
    ageActuel: user.ageActuel,
    epargneMensuelle: user.epargneMensuelle,
    epargnePrecaution: user.epargnePrecaution,
    epargnePrecautionMontant: user.epargnePrecautionMontant,
    evolutionEpargne: user.evolutionEpargne,
    risqueMaxPerte: user.risqueMaxPerte,
    niveauConnaissance: user.niveauConnaissance,
    objectifCroissance: user.objectifCroissance,
    allocationCible: (user.allocationCible as unknown as AllocationCible) ?? {
      pea: 25,
      crypto: 25,
      immo: 25,
      autre: 25,
    },
    allocationDetaillee: (user.allocationDetaillee as unknown as AllocationDetaillee) ?? null,
    createdAt: user.createdAt.toISOString(),
    progressionPercent,
  };

  const decisions: Decision[] = decisionsRaw.map((d) => ({
    id: d.id,
    userId: d.userId,
    date: d.date.toISOString(),
    description: d.description,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <>
      <Header
        title="Profil investisseur & Stratégie"
        description="Identité · Épargne · Profil de risque · Allocation cible"
      />
      <div className="space-y-6 p-6">
        <ProfileForm profile={profile} />
        <DecisionList initial={decisions} />
      </div>
    </>
  );
}
