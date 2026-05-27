import type { PilierSummary } from "@/types";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { InlineEdit } from "./InlineEdit";
import { cn } from "@/lib/utils";

interface Props {
  piliers: PilierSummary[];
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function PilierCards({ piliers }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {piliers.map((p) => {
        const isOver = p.allocationGap > 0;
        const isUnder = p.allocationGap < 0;

        return (
          <div
            key={p.pilier}
            className="rounded-xl bg-card p-4 space-y-3 ring-1 ring-foreground/10 shadow-elev-1"
          >
            {/* En-tête pilier */}
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PILIER_COLOR[p.pilier].hex }}
              />
              <span className="text-sm font-semibold">{PILIER_LABEL[p.pilier]}</span>
              <div className="ml-auto flex gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    isOver && "bg-orange-500/10 text-orange-600",
                    isUnder && "bg-muted text-muted-foreground",
                    !isOver && !isUnder && "bg-emerald-500/10 text-emerald-600"
                  )}
                >
                  {p.percentage.toFixed(1)} %
                </span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  cible {p.targetPercentage} %
                </span>
              </div>
            </div>

            {/* Valeur totale pilier */}
            <p className="text-3xl font-bold tabular-nums">
              {formatEur(p.totalValue)}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground -mt-2">
              {PILIER_LABEL[p.pilier]}
            </p>

            {/* Barre d'allocation */}
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(p.percentage, 100)}%`,
                  backgroundColor: PILIER_COLOR[p.pilier].hex,
                }}
              />
              <div
                className="absolute inset-y-0 w-px bg-foreground/40"
                style={{ left: `${p.targetPercentage}%` }}
              />
            </div>

            {/* Actifs avec saisie inline */}
            {p.assets.length > 0 ? (
              <div className="space-y-1.5 border-t border-border pt-2">
                {p.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {asset.name}
                    </span>
                    <InlineEdit
                      assetId={asset.id}
                      assetName={asset.name}
                      currentValue={asset.latestValue}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground border-t border-border pt-2">
                Aucun actif
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
