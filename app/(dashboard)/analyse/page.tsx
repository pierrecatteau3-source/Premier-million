import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { computeAdvancedRiskScore } from "@/lib/riskEngine";
import { TYPE_TO_PILIER } from "@/lib/constants/allocation-types";
import { Header } from "@/components/layout/Header";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { RiskGauge } from "@/components/analyse/RiskGauge";
import { ShieldCheck, TrendingUp, BarChart2, Sparkles } from "lucide-react";
import { HORIZON_LABEL } from "@/types";
import type { Horizon } from "@/types";

const CACHE_DAYS = 30;
const TAB_HORIZONS: Horizon[] = ["MONTH_1", "MONTH_3", "MONTH_6", "YEAR_1"];

const PILIER_LABELS: Record<string, string> = {
  PEA: "PEA / Actions", IMMO: "Immobilier", CRYPTO: "Crypto", AUTRE: "Autre",
};

const PILIER_COLORS: Record<string, string> = {
  PEA: "bg-violet-500", IMMO: "bg-emerald-500", CRYPTO: "bg-orange-500", AUTRE: "bg-slate-400",
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function calculateTargetAge(
  currentValue: number,
  epargne: number,
  evolution: number,
  taux: number,
  ageActuel: number,
  objectif = 1_000_000,
  maxYears = 60
): number | null {
  const monthlyRate = taux / 12 / 100;
  let value = currentValue;
  let e = epargne;
  for (let y = 0; y < maxYears; y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + e;
      if (value >= objectif) return ageActuel + y + (m >= 6 ? 1 : 0);
    }
    e *= (1 + evolution / 100);
  }
  return null;
}

async function getLatestAnalysesByType(userId: string) {
  const cacheLimit = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);

  // Récupère les analyses récentes pour les deux types
  const analyses = await prisma.analysis.findMany({
    where: { userId, createdAt: { gte: cacheLimit } },
    orderBy: { createdAt: "desc" },
  });

  // Garde la plus récente par type+horizon
  const portfolioByHorizon = new Map<string, typeof analyses[0]>();
  const marketByHorizon = new Map<string, typeof analyses[0]>();

  for (const a of analyses) {
    const analysisType = a.type ?? "PORTFOLIO";
    if (analysisType === "MARKET") {
      if (!marketByHorizon.has(a.horizon)) marketByHorizon.set(a.horizon, a);
    } else {
      if (!portfolioByHorizon.has(a.horizon)) portfolioByHorizon.set(a.horizon, a);
    }
  }

  return { portfolioByHorizon, marketByHorizon };
}

export default async function AnalysePage({
  searchParams,
}: {
  searchParams: { horizon?: string; tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [portfolio, { portfolioByHorizon, marketByHorizon }, user] = await Promise.all([
    getPortfolioSummary(userId),
    getLatestAnalysesByType(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        objectif: true,
        ageActuel: true,
        ageCible: true,
        epargneMensuelle: true,
        evolutionEpargne: true,
        objectifCroissance: true,
        allocationCible: true,
        allocationDetaillee: true,
        epargnePrecautionMontant: true,
        epargnePrecaution: true,
      },
    }),
  ]);

  if (!user) redirect("/login");

  const matelasEur = user.epargnePrecautionMontant
    ?? ((user.epargnePrecaution ?? 0) * (user.epargneMensuelle ?? 0));

  const piliersAjustes = portfolio.piliers.map((p) => ({
    ...p,
    totalValue: p.pilier === "AUTRE"
      ? Math.max(0, p.totalValue - matelasEur)
      : p.totalValue,
  }));
  const totalInvestissable = piliersAjustes.reduce((sum, p) => sum + p.totalValue, 0);
  const patrimoineNet = totalInvestissable;

  const piliersNet = piliersAjustes.map((p) => ({
    ...p,
    percentage: totalInvestissable > 0
      ? Math.round((p.totalValue / totalInvestissable) * 1000) / 10
      : 0,
    allocationGap: (totalInvestissable > 0
      ? Math.round((p.totalValue / totalInvestissable) * 1000) / 10
      : 0) - p.targetPercentage,
  }));

  const activeHorizon: Horizon =
    TAB_HORIZONS.includes(searchParams.horizon as Horizon)
      ? (searchParams.horizon as Horizon)
      : "MONTH_3";

  // Mapper allocationDetaillee par pilier
  const allocationLines = Array.isArray(user.allocationDetaillee)
    ? (user.allocationDetaillee as { type: string; subtype: string; pct: number }[])
    : [];

  const riskResult = computeAdvancedRiskScore({
    piliers: piliersNet.map((p) => ({
      pilier: p.pilier,
      totalValue: p.totalValue,
      percentage: p.percentage,
      lines: allocationLines.filter(
        (l) => TYPE_TO_PILIER[l.type] === p.pilier
      ),
    })),
    totalDebt: 0,
    totalValue: totalInvestissable,
  });

  const riskScore = riskResult.total;

  const targetAge =
    user.ageActuel != null && user.epargneMensuelle != null
      ? calculateTargetAge(
          patrimoineNet,
          user.epargneMensuelle,
          user.evolutionEpargne ?? 0,
          user.objectifCroissance ?? 8,
          user.ageActuel,
        )
      : null;

  return (
    <>
      <Header title="Analyse patrimoine &amp; stratégie" description="Risque · Analyse IA · Vision Marché" />
      <div className="p-6 space-y-6">

        {/* ── Section 1 : Risque & Atouts ─────────────────────────── */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Risque &amp; Atouts du portefeuille</h2>
              <p className="text-xs text-muted-foreground">Score global · Volatilité par classe · Alertes</p>
            </div>
          </div>

          {/* Jauge + tableau côte à côte sur desktop */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex justify-center sm:justify-start">
              <RiskGauge score={riskScore} />
            </div>
            <div className="flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-2 text-left text-xs text-muted-foreground font-medium">Actif</th>
                    <th className="py-2 text-right text-xs text-muted-foreground font-medium hidden sm:table-cell">Vol. ajustée</th>
                    <th className="py-2 text-right text-xs text-muted-foreground font-medium">Valeur</th>
                    <th className="py-2 text-right text-xs text-muted-foreground font-medium">Poids</th>
                    <th className="py-2 text-right text-xs text-muted-foreground font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {piliersNet.map((p) => {
                    const d = riskResult.detail.find((x) => x.pilier === p.pilier);
                    const volAjustee = d?.volAjustee ?? 0;
                    const points = (p.percentage / 100) * volAjustee * 10;
                    return (
                      <tr key={p.pilier} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${PILIER_COLORS[p.pilier] ?? "bg-slate-400"}`} />
                            <span>{PILIER_LABELS[p.pilier] ?? p.pilier}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right tabular-nums hidden sm:table-cell">{(volAjustee * 100).toFixed(1)} %</td>
                        <td className="py-2.5 text-right tabular-nums">{formatEur(p.totalValue)}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{p.percentage.toFixed(1)} %</td>
                        <td className="py-2.5 text-right tabular-nums text-primary">{points.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/50">
                    <td colSpan={4} className="py-2 text-xs text-muted-foreground">Score total</td>
                    <td className="py-2 text-right font-bold text-primary">{riskScore.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Alertes écarts */}
          {piliersNet.some((p) => Math.abs(p.allocationGap) > 5) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Alertes d&apos;allocation</p>
              {piliersNet.filter((p) => Math.abs(p.allocationGap) > 5).map((p) => (
                <div key={p.pilier} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${p.allocationGap > 0 ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-400"}`}>
                  <span>{p.allocationGap > 0 ? "↑ Sur-exposition" : "↓ Sous-exposition"}</span>
                  <span className="font-medium">{PILIER_LABELS[p.pilier] ?? p.pilier}</span>
                  <span className="ml-auto tabular-nums">{p.allocationGap > 0 ? "+" : ""}{p.allocationGap.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2 : Récapitulatif ───────────────────────────── */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Récapitulatif</h2>
              <p className="text-xs text-muted-foreground">Synthèse de votre situation patrimoniale</p>
            </div>
          </div>

          {/* 3 KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Score de risque</p>
              <p className="text-2xl font-bold tabular-nums">{riskScore.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Patrimoine net</p>
              <p className="text-2xl font-bold tabular-nums">{formatEur(patrimoineNet)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Objectif atteint à</p>
              <p className="text-2xl font-bold tabular-nums">{targetAge ? `${targetAge} ans` : "—"}</p>
            </div>
          </div>
        </div>

        {/* ── Section 3 : Analyse IA (portefeuille personnalisé) ──── */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Analyse IA</h2>
              <p className="text-xs text-muted-foreground">Analyse personnalisée de votre portefeuille par Claude · Cache 30 jours</p>
            </div>
          </div>

          {!process.env.ANTHROPIC_API_KEY && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <strong>ANTHROPIC_API_KEY non configurée.</strong> Ajoutez-la dans{" "}
              <code className="rounded bg-orange-100 px-1">.env</code> pour activer les analyses Claude.
            </div>
          )}

          {process.env.ANTHROPIC_ANALYSES_ENABLED === "false" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Analyses Claude désactivées.</strong> La variable{" "}
              <code className="rounded bg-amber-100 px-1">ANTHROPIC_ANALYSES_ENABLED=false</code>{" "}
              est active. Les analyses en cache restent disponibles.
            </div>
          )}

          {/* Onglets horizons */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
            {TAB_HORIZONS.map((h) => {
              const isActive = h === activeHorizon;
              const hasCached = portfolioByHorizon.has(h);
              return (
                <a
                  key={h}
                  href={`/analyse?horizon=${h}`}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {HORIZON_LABEL[h]}
                  {hasCached && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Analyse en cache" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="rounded-xl border border-border/40 p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Analyse IA — {HORIZON_LABEL[activeHorizon]} · mise en cache 30 jours
            </p>
            {(() => {
              const cached = portfolioByHorizon.get(activeHorizon);
              return (
                <AnalysisCard
                  horizon={activeHorizon}
                  analysisType="PORTFOLIO"
                  initial={
                    cached
                      ? {
                          analysis: {
                            id: cached.id,
                            userId: cached.userId,
                            horizon: cached.horizon,
                            type: cached.type,
                            content: cached.content,
                            createdAt: cached.createdAt.toISOString(),
                          },
                          cached: true,
                        }
                      : null
                  }
                />
              );
            })()}
          </div>
        </div>

        {/* ── Section 4 : Vision Marché (opportunités tech) ────────── */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Vision Marché</h2>
              <p className="text-xs text-muted-foreground">Veille opportunités tech émergentes par Claude · Cache 30 jours</p>
            </div>
          </div>

          {/* Onglets horizons */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
            {TAB_HORIZONS.map((h) => {
              const isActive = h === activeHorizon;
              const hasCached = marketByHorizon.has(h);
              return (
                <a
                  key={h}
                  href={`/analyse?horizon=${h}`}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {HORIZON_LABEL[h]}
                  {hasCached && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Analyse en cache" />
                  )}
                </a>
              );
            })}
          </div>

          <div className="rounded-xl border border-border/40 p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Vision Marché — {HORIZON_LABEL[activeHorizon]} · mise en cache 30 jours
            </p>
            {(() => {
              const cached = marketByHorizon.get(activeHorizon);
              return (
                <AnalysisCard
                  horizon={activeHorizon}
                  analysisType="MARKET"
                  initial={
                    cached
                      ? {
                          analysis: {
                            id: cached.id,
                            userId: cached.userId,
                            horizon: cached.horizon,
                            type: cached.type,
                            content: cached.content,
                            createdAt: cached.createdAt.toISOString(),
                          },
                          cached: true,
                        }
                      : null
                  }
                />
              );
            })()}
          </div>
        </div>

      </div>
    </>
  );
}
