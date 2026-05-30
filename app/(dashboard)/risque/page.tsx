import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { computeRiskScore } from "@/lib/risk";
import { Header } from "@/components/layout/Header";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { AlertBanner } from "@/components/risk/AlertBanner";
import { RiskDetail } from "@/components/risk/RiskDetail";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function RisquePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // L'épargne de précaution (matelasEur) est exclue du module Risque & Atouts :
  // c'est une réserve hors portefeuille, pas un actif investi.
  // Les actifs "Compte courant" (pilier LIQUIDITE) sont également exclus du risque :
  // ils ne figurent pas dans portfolio.piliers (uniquement dans portfolio.liquiditeSummary).
  // Base de référence = actifs investis (PEA/Crypto/Immo/Autre) uniquement.
  const portfolio = await getPortfolioSummary(session.user.id);

  // portfolio.piliers contient uniquement PEA/CRYPTO/IMMO/AUTRE — LIQUIDITE est exclu.
  // Les pourcentages sont calculés sur le total investissable (hors LIQUIDITE).
  const risk = computeRiskScore(portfolio.piliers);

  const levelDesc = {
    faible: "Portefeuille bien diversifié, exposition modérée aux actifs volatils.",
    modéré: "Diversification correcte mais quelques déséquilibres d'allocation.",
    élevé: "Exposition importante à des actifs volatils — rééquilibrage recommandé.",
  }[risk.level];

  return (
    <>
      <Header
        title="Risque & Atouts"
        description="Score de risque global et alertes d'allocation"
      />

      <div className="space-y-6 p-6">
        {/* ── Score global ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted">
                Diagnostic
              </span>
              <CardTitle className="font-display text-[22px] tracking-[-0.025em]">
                Score de <em className="italic text-gold">risque</em>
              </CardTitle>
              <CardDescription className="text-[13px] leading-snug text-ink-muted">
                {levelDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center pt-4 pb-2">
              <RiskGauge score={risk.score} level={risk.level} />
            </CardContent>
          </Card>

          {/* ── Alertes ───────────────────────────────────────────────── */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-muted">
                    Vigilance
                  </span>
                  <CardTitle className="font-display text-[22px] tracking-[-0.025em]">
                    Alertes d&apos;<em className="italic text-gold">allocation</em>
                  </CardTitle>
                  <CardDescription className="mt-1 text-[13px] leading-snug text-ink-muted">
                    Basé sur l&apos;écart entre la répartition actuelle et votre allocation cible.
                  </CardDescription>
                </div>
                {risk.alerts.length > 0 && (
                  <span
                    className="shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      color: "var(--pm-negative)",
                      borderColor: "var(--pm-negative)",
                      background:
                        "linear-gradient(135deg, rgba(217,116,100,0.18), transparent 80%)",
                    }}
                  >
                    {risk.alerts.length}{" "}
                    {risk.alerts.length > 1 ? "alertes" : "alerte"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AlertBanner alerts={risk.alerts} />
            </CardContent>
          </Card>
        </div>

        {/* ── Détail par pilier ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contribution au risque par pilier</CardTitle>
            <CardDescription>
              Score = Σ (poids réel × volatilité estimée). Poids calculés sur le total des
              actifs investis. L&apos;épargne de précaution est exclue (réserve hors portefeuille).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskDetail detail={risk.detail} />
          </CardContent>
        </Card>

        {/* ── Légende volatilités ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volatilités de référence</CardTitle>
            <CardDescription>
              Estimations utilisées dans le modèle de calcul du risque.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "PEA (Équités)",   vol: "15 %", color: "#3b82f6", note: "Modérée" },
                { label: "Crypto",          vol: "65 %", color: "#f97316", note: "Très haute" },
                { label: "Immobilier",      vol: "8 %",  color: "#22c55e", note: "Faible" },
                { label: "Autre (Épargne)", vol: "5 %",  color: "#9ca3af", note: "Très faible" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{item.vol}</p>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
