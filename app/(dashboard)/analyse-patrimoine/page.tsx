import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import {
  computeAdvancedRiskScore,
  buildRiskScoreInput,
  volForSubtype,
  VOL_FALLBACK,
} from "@/lib/riskEngine";
import { TYPE_TO_PILIER } from "@/lib/constants/allocation-types";
import { calculateTargetAge } from "@/lib/utils/projection";
import { resolveAge } from "@/lib/utils/age";
import { Header } from "@/components/layout/Header";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { RiskAtoutsTable, type RiskRow } from "@/components/analysis/RiskAtoutsTable";
import { ShieldCheck, TrendingUp, BarChart2, Sparkles } from "lucide-react";
import { HORIZON_LABEL } from "@/types";
import type { Horizon } from "@/types";

const TAB_HORIZONS: Horizon[] = ["YEAR_1", "YEAR_3", "YEAR_5", "YEAR_10"];

const PILIER_LABELS: Record<string, string> = {
  PEA: "PEA / Actions", IMMO: "Immobilier", CRYPTO: "Crypto", AUTRE: "Autre",
};

const PILIER_COLORS: Record<string, string> = {
  PEA: "bg-sky-500", IMMO: "bg-emerald-500", CRYPTO: "bg-amber-500", AUTRE: "bg-slate-400",
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

async function getLatestAnalysesByType(userId: string) {
  // Aucune expiration : les analyses sont conservées en base indéfiniment.
  // On charge toujours la plus récente par type+horizon, quel que soit son âge.
  const analyses = await prisma.analysis.findMany({
    where: { userId },
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

export default async function AnalysePatrimoinePage({
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
        dateNaissance: true,
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

  // Assemblage matelas + % investissables + lignes d'allocation (helper partagé
  // avec le mode conseil de Pio — voir lib/riskEngine.ts).
  const { input: riskInput, piliersNet, patrimoineNet, allocationLines } =
    buildRiskScoreInput(portfolio, {
      epargnePrecautionMontant: user.epargnePrecautionMontant,
      epargnePrecaution: user.epargnePrecaution,
      epargneMensuelle: user.epargneMensuelle,
      allocationDetaillee: user.allocationDetaillee,
    });

  const activeHorizon: Horizon =
    TAB_HORIZONS.includes(searchParams.horizon as Horizon)
      ? (searchParams.horizon as Horizon)
      : "YEAR_3";

  const riskResult = computeAdvancedRiskScore(riskInput);

  const riskScore = riskResult.total;
  const riskLevel: "faible" | "modéré" | "élevé" =
    riskScore < 3.5 ? "faible" : riskScore < 5.5 ? "modéré" : "élevé";

  // Lignes sérialisables pour le tableau Risque & Atouts (composant client).
  // breakdown = composition de la vol. ajustée (sous-types + vol. de référence + poids),
  // reconstruite à l'identique de computePilierVol (poids relatif au pilier).
  const riskRows: RiskRow[] = piliersNet.map((p) => {
    const d = riskResult.detail.find((x) => x.pilier === p.pilier);
    const volAjustee = d?.volAjustee ?? 0;

    const lines = allocationLines.filter((l) => TYPE_TO_PILIER[l.type] === p.pilier);
    const totalPct = lines.reduce((s, l) => s + l.pct, 0);
    const breakdown =
      totalPct > 0
        ? lines.map((l) => ({
            subtype: l.subtype,
            weightPct: (l.pct / totalPct) * 100,
            volPct: volForSubtype(l.subtype) * 100,
          }))
        : [];

    return {
      pilier: p.pilier,
      label: PILIER_LABELS[p.pilier] ?? p.pilier,
      colorClass: PILIER_COLORS[p.pilier] ?? "bg-slate-400",
      volAjusteePct: volAjustee * 100,
      valueLabel: formatEur(p.totalValue),
      percentage: p.percentage,
      points: (p.percentage / 100) * volAjustee * 10,
      breakdown,
      fallbackVolPct: totalPct > 0 ? null : (VOL_FALLBACK[p.pilier] ?? 0.15) * 100,
      concentrationPenalty:
        p.pilier === "PEA" && totalPct > 0 && lines.some((l) => l.pct / totalPct > 0.5),
    };
  });

  const ageActuel = resolveAge(user);
  const targetAge =
    ageActuel != null && user.epargneMensuelle != null
      ? calculateTargetAge(
          patrimoineNet,
          user.epargneMensuelle,
          user.evolutionEpargne ?? 0,
          user.objectifCroissance ?? 8,
          ageActuel,
        )
      : null;

  return (
    <>
      <Header
        title="Analyse de patrimoine &amp; stratégie"
        description="Risque · Analyse de Pio · Vision Marché"
      />
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
              <RiskGauge score={riskScore / 10} level={riskLevel} />
            </div>
            <RiskAtoutsTable rows={riskRows} scoreTotal={riskScore} />
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

        {/* ── Section 3 : Analyse de Pio (portefeuille personnalisé) ──── */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Analyse de Pio</h2>
              <p className="text-xs text-muted-foreground">Analyse personnalisée de votre portefeuille par Pio · conservée en base</p>
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
          <div className="flex w-full max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1 sm:w-fit">
            {TAB_HORIZONS.map((h) => {
              const isActive = h === activeHorizon;
              const hasCached = portfolioByHorizon.has(h);
              return (
                <a
                  key={h}
                  href={`/analyse-patrimoine?horizon=${h}`}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
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
              Analyse de Pio — {HORIZON_LABEL[activeHorizon]} · conservée, actualisable à tout moment
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
              <p className="text-xs text-muted-foreground">Veille opportunités tech émergentes par Claude · conservée en base</p>
            </div>
          </div>

          {/* Onglets horizons */}
          <div className="flex w-full max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1 sm:w-fit">
            {TAB_HORIZONS.map((h) => {
              const isActive = h === activeHorizon;
              const hasCached = marketByHorizon.has(h);
              return (
                <a
                  key={h}
                  href={`/analyse-patrimoine?horizon=${h}`}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
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
              Vision Marché — {HORIZON_LABEL[activeHorizon]} · conservée, actualisable à tout moment
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
