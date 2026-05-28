"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioChart } from "@/components/portfolio/PortfolioChart";
import { PilierChart } from "@/components/portfolio/PilierChart";
import { cn } from "@/lib/utils";
import type { PilierSummary } from "@/types";

interface Evolution {
  deltaEur: number;
  deltaPct: number;
}

interface Props {
  totalValue: number;
  piliers: PilierSummary[];
}

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PortfolioHero({ totalValue, piliers }: Props) {
  const [evolution, setEvolution] = useState<Evolution | null>(null);

  const isPositive = evolution !== null && evolution.deltaEur > 0;
  const isNegative = evolution !== null && evolution.deltaEur < 0;

  return (
    <>
      {/* En-tête hero — pleine largeur */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Patrimoine total
              </p>
              <p className="text-4xl font-bold tabular-nums tracking-tight">
                {formatEur(totalValue)}
              </p>
            </div>
            <div className="flex flex-col gap-0.5 pb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isPositive && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                  isNegative && "bg-red-500/10 text-red-500",
                  !isPositive && !isNegative && "bg-muted text-muted-foreground"
                )}
              >
                {evolution === null ? (
                  "—"
                ) : (
                  <>
                    {isPositive ? "↑" : isNegative ? "↓" : ""}
                    {isPositive ? "+" : ""}
                    {formatEur(evolution.deltaEur)}{" "}
                    ({evolution.deltaPct > 0 ? "+" : ""}
                    {evolution.deltaPct.toFixed(1)} %)
                  </>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille : graphique d'évolution à gauche, répartition par pilier à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Évolution du patrimoine</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioChart onEvolutionChange={setEvolution} />
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Répartition par pilier</CardTitle>
          </CardHeader>
          <CardContent>
            <PilierChart piliers={piliers} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
