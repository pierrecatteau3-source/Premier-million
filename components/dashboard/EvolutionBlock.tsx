"use client";

import { useState } from "react";
import { PortfolioChart } from "@/components/portfolio/PortfolioChart";

/**
 * Plages disponibles pour le graphique d'évolution.
 * Pour ajouter une vue (90j, 1 an, tout…), il suffit d'ajouter une entrée ici :
 * le sélecteur et le fetch suivent automatiquement.
 */
const RANGE_OPTIONS = [
  { label: "Vue sur 7j", days: 7 },
  { label: "Vue sur 30j", days: 30 },
] as const;

const DEFAULT_RANGE_DAYS = 30;

export function EvolutionBlock() {
  const [rangeDays, setRangeDays] = useState<number>(DEFAULT_RANGE_DAYS);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface px-5 pb-6 pt-7 md:px-7">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.025em]">
          Évolution du <em className="italic text-gold">trésor</em>
        </h3>
        <select
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
          aria-label="Choisir la plage du graphique"
          className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.days} value={o.days}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <PortfolioChart compact defaultRangeDays={rangeDays} showSkater />
    </div>
  );
}
