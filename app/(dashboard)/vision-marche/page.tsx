import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HORIZON_LABEL } from "@/types";
import type { Horizon } from "@/types";

const CACHE_DAYS = 30;
const TAB_HORIZONS: Horizon[] = ["MONTH_1", "MONTH_3", "MONTH_6", "YEAR_1"];

// Charge les analyses Vision Marché en cache pour tous les horizons (30 jours)
async function getLatestMarketAnalyses(userId: string) {
  const cacheLimit = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);

  const analyses = await prisma.analysis.findMany({
    where: { userId, type: "MARKET", createdAt: { gte: cacheLimit } },
    orderBy: { createdAt: "desc" },
  });

  // Garde la plus récente par horizon
  const byHorizon = new Map<string, typeof analyses[0]>();
  for (const a of analyses) {
    if (!byHorizon.has(a.horizon)) byHorizon.set(a.horizon, a);
  }

  return byHorizon;
}

export default async function VisionMarchePage({
  searchParams,
}: {
  searchParams: { horizon?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const byHorizon = await getLatestMarketAnalyses(session.user.id);

  const activeHorizon: Horizon =
    TAB_HORIZONS.includes(searchParams.horizon as Horizon)
      ? (searchParams.horizon as Horizon)
      : "MONTH_3";

  return (
    <>
      <Header
        title="Vision Marché"
        description="Veille opportunités technologiques émergentes par Claude · Cache 30 jours"
      />

      <div className="space-y-6 p-6">
        {/* ── Avertissement clé API ─────────────────────────────────── */}
        {!process.env.ANTHROPIC_API_KEY && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <strong>ANTHROPIC_API_KEY non configurée.</strong> Ajoutez-la dans{" "}
            <code className="rounded bg-orange-100 px-1">.env</code> pour activer les analyses Claude.
          </div>
        )}

        {/* ── Avertissement kill switch ──────────────────────────────── */}
        {process.env.ANTHROPIC_ANALYSES_ENABLED === "false" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Analyses Claude désactivées.</strong> La variable{" "}
            <code className="rounded bg-amber-100 px-1">ANTHROPIC_ANALYSES_ENABLED=false</code>{" "}
            est active. Les analyses en cache restent disponibles.
          </div>
        )}

        {/* ── Onglets horizons ─────────────────────────────────────── */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
          {TAB_HORIZONS.map((h) => {
            const isActive = h === activeHorizon;
            const hasCached = byHorizon.has(h);
            return (
              <a
                key={h}
                href={`/vision-marche?horizon=${h}`}
                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {HORIZON_LABEL[h]}
                {hasCached && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Analyse en cache (< 30 jours)" />
                )}
              </a>
            );
          })}
        </div>

        {/* ── Carte d'analyse ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Vision Marché — {HORIZON_LABEL[activeHorizon]}
            </CardTitle>
            <CardDescription>
              Veille sur les opportunités technologiques émergentes (quantique, photonique, IA,
              biotech, spatial…). Analyse générée par Claude et adaptée à votre profil d&apos;investisseur.
              Mise en cache 30 jours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const cached = byHorizon.get(activeHorizon);
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
          </CardContent>
        </Card>

        {/* ── Infos sur la génération ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comment fonctionne la Vision Marché ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium text-foreground mb-1">1. Secteurs couverts</p>
                <p>Quantique, photonique, IA infrastructure, biotech, spatial/défense et autres secteurs émergents selon l&apos;actualité.</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium text-foreground mb-1">2. Appel Claude Haiku</p>
                <p>Veille structurée en 3 sections : opportunités par secteur, comment investir (ETF/actions, PEA/CTO), avis personnalisé.</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium text-foreground mb-1">3. Cache 30 jours</p>
                <p>L&apos;analyse est sauvegardée en DB. Pas d&apos;appel API si une version récente existe.</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium text-foreground mb-1">4. Sécurités actives</p>
                <p>Token budget (1200 tokens), timeout 30s, rate limit 10 appels/jour, kill switch d&apos;urgence.</p>
              </div>
            </div>
            <p className="text-xs">
              Les analyses sont basées sur les données d&apos;entraînement de Claude et ne constituent pas un conseil en investissement au sens réglementaire. Vérifiez les informations auprès de sources financières actualisées.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
