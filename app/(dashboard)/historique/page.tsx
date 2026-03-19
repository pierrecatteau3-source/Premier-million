import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { getPortfolioHistory } from "@/lib/services/portfolio.service";
import { PortfolioChart } from "@/components/portfolio/PortfolioChart";
import { DecisionList } from "@/components/profile/DecisionList";
import type { TransactionWithAsset } from "@/types/transactions";

// Types d'actifs Cash et Épargne exclus de l'historique des achats
const EXCLUDED_ASSET_TYPES = [
  "Compte courant",
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

  const [historyData, decisions, transactionsRaw] = await Promise.all([
    getPortfolioHistory(userId, "all"),
    prisma.decision.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.transaction.findMany({
      where: {
        userId,
        asset: {
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

  function formatEur(value: number) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <>
      <Header title="Historique" description="Évolution · Décisions · Achats" />
      <div className="p-6 space-y-6">
        {/* Graphique évolution */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Évolution du patrimoine
          </p>
          <PortfolioChart initialData={historyData} initialPeriod="all" />
        </div>

        {/* Journal décisions */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Historique des stratégies
          </p>
          <DecisionList initial={decisionsTyped} />
        </div>

        {/* Historique des achats — source : transactions du Portefeuille */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Historique des achats
          </p>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun achat enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="py-2 text-left text-xs font-medium text-muted-foreground">Actif</th>
                    <th className="py-2 text-left text-xs font-medium text-muted-foreground">Pilier</th>
                    <th className="py-2 text-right text-xs font-medium text-muted-foreground">Quantité</th>
                    <th className="py-2 text-right text-xs font-medium text-muted-foreground">Prix unitaire</th>
                    <th className="py-2 text-right text-xs font-medium text-muted-foreground">Montant investi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-2 tabular-nums text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-2 font-medium">{t.asset.name}</td>
                      <td className="py-2 text-muted-foreground">{t.asset.pilier}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">
                        {t.quantite.toLocaleString("fr-FR", { maximumFractionDigits: 6 })}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">
                        {formatEur(t.prixEntreeEur)}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {formatEur(t.montantInvesti)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
