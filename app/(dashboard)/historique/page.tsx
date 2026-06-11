import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { EvolutionBlock } from "@/components/dashboard/EvolutionBlock";
import { DecisionList } from "@/components/profile/DecisionList";
import { TransactionHistoryTable } from "@/components/history/TransactionHistoryTable";
import type { TransactionWithAsset } from "@/types/transactions";

// Types d'actifs Cash et Épargne exclus de l'historique des achats
const EXCLUDED_ASSET_TYPES = [
  "Compte courant",
  "Compte joint",
  "Compte pro",
  "Cash disponible",
  "Livret A",
  "LDD / LDDS",
  "LEP",
  "Comptes à Terme",
  "Monétaire",
] as const;

export default async function HistoriquePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [decisions, transactionsRaw] = await Promise.all([
    prisma.decision.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.transaction.findMany({
      where: {
        userId,
        asset: {
          pilier: { not: "LIQUIDITE" },
          type: { notIn: EXCLUDED_ASSET_TYPES as unknown as string[] },
        },
      },
      include: { asset: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const decisionsTyped = decisions.map((d) => ({
    id: d.id,
    userId: d.userId,
    date: d.date.toISOString(),
    description: d.description,
    createdAt: d.createdAt.toISOString(),
  }));

  const transactions: TransactionWithAsset[] = transactionsRaw.map((t) => ({
    id: t.id,
    assetId: t.assetId,
    userId: t.userId,
    date: t.date.toISOString(),
    quantite: t.quantite,
    prixEntreeEur: t.prixEntreeEur,
    montantInvesti: t.montantInvesti,
    source: t.source,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
    asset: {
      id: t.asset.id,
      name: t.asset.name,
      pilier: t.asset.pilier,
      type: t.asset.type,
    },
  }));

  return (
    <>
      <Header title="Historique" description="Évolution · Décisions · Achats" />
      {/* Mobile : pas de padding horizontal — le layout fournit déjà px-5 */}
      <div className="space-y-6 py-6 sm:p-6">
        {/* Graphique évolution — même bloc que le Dashboard */}
        <EvolutionBlock />

        {/* Journal décisions — card premium auto-portante */}
        <DecisionList initial={decisionsTyped} />

        {/* Historique des achats — source : transactions du Portefeuille */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Historique des achats
          </p>
          <TransactionHistoryTable transactions={transactions} />
        </div>
      </div>
    </>
  );
}
