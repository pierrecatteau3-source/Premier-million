import type { PilierRisk } from "@/types";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  detail: PilierRisk[];
}

export function RiskDetail({ detail }: Props) {
  const maxContribution = Math.max(...detail.map((d) => d.contribution), 0.01);

  return (
    <div className="space-y-4">
      {detail.map((d) => {
        const pct = (d.contribution / maxContribution) * 100;
        const isOver = d.allocationGap > 0;

        return (
          <div key={d.pilier} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PILIER_COLOR[d.pilier].hex }}
                />
                <span className="font-medium">{PILIER_LABEL[d.pilier]}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                <span>Poids réel {(d.weight * 100).toFixed(1)} %</span>
                <span>Volatilité {(d.volatility * 100).toFixed(0)} %</span>
                <span
                  className={cn(
                    "font-semibold",
                    isOver ? "text-orange-500" : d.allocationGap < 0 ? "text-blue-500" : "text-green-500"
                  )}
                >
                  Écart {isOver ? "+" : ""}{d.allocationGap.toFixed(1)} pt
                </span>
              </div>
            </div>

            {/* Barre de contribution au risque */}
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: PILIER_COLOR[d.pilier].hex,
                  opacity: d.weight === 0 ? 0.3 : 1,
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Contribution au score :{" "}
              <span className="font-medium tabular-nums">
                {(d.contribution * 100).toFixed(1)}
              </span>{" "}
              pts
            </p>
          </div>
        );
      })}
    </div>
  );
}
