"use client";

import { useState } from "react";
import { PioHero } from "@/components/dashboard/PioHero";
import { TreasureStrip } from "@/components/dashboard/TreasureStrip";
import type {
  DashboardDeltas,
  DashboardPeriodKey,
} from "@/lib/services/portfolio.service";

interface Props {
  totalValue: number;
  capRestant: number;
  targetAge: number | null;
  /** Âge actuel utilisé par la projection (dérivé de la date de naissance). */
  ageActuel: number | null;
  /** Taux de croissance annuel (%) utilisé par la projection. */
  tauxProjection: number;
  assetCount: number;
  pilierCount: number;
  epargneMensuelle: number | null;
  deltas: DashboardDeltas;
}

const PERIOD_LABEL: Record<DashboardPeriodKey, string> = {
  day: "ce matin",
  week: "cette semaine",
  month: "ce mois ci",
  year: "cette année",
};

export function DashboardSummary({
  totalValue,
  capRestant,
  targetAge,
  ageActuel,
  tauxProjection,
  assetCount,
  pilierCount,
  epargneMensuelle,
  deltas,
}: Props) {
  const [periodKey, setPeriodKey] = useState<DashboardPeriodKey>("month");

  return (
    <>
      <PioHero
        totalValue={totalValue}
        capRestant={capRestant}
        targetAge={targetAge}
        assetCount={assetCount}
        pilierCount={pilierCount}
        deltas={deltas}
        periodKey={periodKey}
        onPeriodChange={setPeriodKey}
      />
      <TreasureStrip
        totalValue={totalValue}
        epargneMensuelle={epargneMensuelle}
        targetAge={targetAge}
        ageActuel={ageActuel}
        tauxProjection={tauxProjection}
        assetCount={assetCount}
        pilierCount={pilierCount}
        delta={deltas[periodKey]}
        periodLabel={PERIOD_LABEL[periodKey]}
      />
    </>
  );
}
