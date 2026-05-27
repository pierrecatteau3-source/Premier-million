import type { PilierSummary } from "@/types";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  piliers: PilierSummary[];
}

export function AllocationGap({ piliers }: Props) {
  return (
    <div className="space-y-4">
      {piliers.map((p) => {
        const gap = p.allocationGap;
        const isOver = gap > 0;
        const isUnder = gap < 0;
        const absGap = Math.abs(gap);

        return (
          <div key={p.pilier} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PILIER_COLOR[p.pilier].hex }}
                />
                <span className="font-medium">{PILIER_LABEL[p.pilier]}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums text-xs text-muted-foreground">
                <span>{p.percentage.toFixed(1)} %</span>
                <span className="text-border">vs</span>
                <span>{p.targetPercentage} % cible</span>
                <span
                  className={cn(
                    "ml-1 font-semibold",
                    isOver && "text-orange-500",
                    isUnder && "text-blue-500",
                    gap === 0 && "text-green-500"
                  )}
                >
                  {isOver ? "+" : ""}{gap.toFixed(1)} pt
                </span>
              </div>
            </div>

            {/* Barre double : réel vs cible */}
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              {/* Barre cible (fond) */}
              <div
                className="absolute inset-y-0 left-0 rounded-full opacity-20"
                style={{
                  width: `${p.targetPercentage}%`,
                  backgroundColor: PILIER_COLOR[p.pilier].hex,
                }}
              />
              {/* Barre réelle */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(p.percentage, 100)}%`,
                  backgroundColor: PILIER_COLOR[p.pilier].hex,
                }}
              />
              {/* Marqueur cible */}
              <div
                className="absolute inset-y-0 w-0.5 bg-foreground/30"
                style={{ left: `${p.targetPercentage}%` }}
              />
            </div>

            {absGap > 5 && (
              <p className="text-xs text-muted-foreground">
                {isOver
                  ? `Surpondéré de ${absGap.toFixed(1)} pt — envisager un rééquilibrage`
                  : `Sous-pondéré de ${absGap.toFixed(1)} pt vs objectif`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
