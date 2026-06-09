"use client";
import type { PriceData } from "@/types/prices";

interface Props {
  ticker: string | null;
  pricingMode: string;
  priceData: PriceData | null;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(v);
}

function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  return `il y a ${Math.floor(diff / 60)} h`;
}

export function AssetPriceRow({ ticker, pricingMode, priceData }: Props) {
  if (pricingMode === "manual" || pricingMode === "savings") {
    return <span className="text-xs text-muted-foreground">Estimation manuelle</span>;
  }

  if (!ticker) {
    return <span className="text-xs text-muted-foreground">Ticker non défini</span>;
  }

  if (!priceData || priceData.error) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        Prix indisponible
      </span>
    );
  }

  // La variation (% de performance) vit désormais dans la colonne « Performance »
  // dédiée du tableau (mini-courbe). Ici on ne garde que le prix + la fraîcheur.
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {priceData.price != null && (
        <span className="text-sm font-medium tabular-nums">{formatEur(priceData.price)}</span>
      )}
      <span className="text-[10px] text-muted-foreground/60">
        {timeSince(priceData.updatedAt)}
      </span>
    </div>
  );
}
