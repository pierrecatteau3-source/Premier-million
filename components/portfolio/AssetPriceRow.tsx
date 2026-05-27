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

  const change = priceData.change24hPct;
  const isPos = change != null && change >= 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {priceData.price != null && (
        <span className="text-sm font-medium tabular-nums">{formatEur(priceData.price)}</span>
      )}
      {change != null && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isPos ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          }`}
          title={[
            priceData.change7dPct != null ? `7j : ${priceData.change7dPct.toFixed(1)} %` : null,
            priceData.change30dPct != null ? `30j : ${priceData.change30dPct.toFixed(1)} %` : null,
          ].filter(Boolean).join(" · ") || undefined}
        >
          {isPos ? "+" : ""}{change.toFixed(1)} %
        </span>
      )}
      <span className="text-[10px] text-muted-foreground/60">
        {timeSince(priceData.updatedAt)}
      </span>
    </div>
  );
}
