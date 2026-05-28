import type { PilierSummary } from "@/types";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  piliers: PilierSummary[];
}

export function AllocationGap({ piliers }: Props) {
  return (
    <div className="flex h-full min-h-[220px] items-stretch gap-2 sm:gap-4">
      {piliers.map((p) => {
        const gap = p.allocationGap;
        const isOver = gap > 0;
        const isUnder = gap < 0;
        const color = PILIER_COLOR[p.pilier].hex;

        return (
          <div
            key={p.pilier}
            className="flex flex-1 flex-col items-center gap-2 min-w-0"
          >
            {/* Valeur réelle */}
            <span className="text-sm font-semibold tabular-nums">
              {p.percentage.toFixed(1)} %
            </span>

            {/* Barre verticale — remplit la hauteur disponible */}
            <div className="relative w-7 flex-1 overflow-hidden rounded-full bg-muted sm:w-9">
              {/* Remplissage cible (fond) */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-full opacity-20"
                style={{ height: `${Math.min(p.targetPercentage, 100)}%`, backgroundColor: color }}
              />
              {/* Remplissage réel */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-full transition-all duration-500"
                style={{ height: `${Math.min(p.percentage, 100)}%`, backgroundColor: color }}
              />
              {/* Marqueur cible (ligne horizontale) */}
              <div
                className="absolute inset-x-0 h-0.5 bg-foreground/40"
                style={{ bottom: `${Math.min(p.targetPercentage, 100)}%` }}
              />
            </div>

            {/* Écart */}
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                isOver && "text-orange-500",
                isUnder && "text-blue-500",
                gap === 0 && "text-green-500"
              )}
            >
              {isOver ? "+" : ""}
              {gap.toFixed(1)} pt
            </span>

            {/* Pilier + cible */}
            <div className="flex flex-col items-center gap-0.5 text-center">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-xs font-medium">
                  {PILIER_LABEL[p.pilier]}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                cible {p.targetPercentage} %
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
