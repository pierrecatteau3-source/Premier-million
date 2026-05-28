import type { PilierSummary } from "@/types";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  piliers: PilierSummary[];
}

export function AllocationGap({ piliers }: Props) {
  return (
    <div className="flex h-full min-h-[220px] items-stretch gap-3 sm:gap-6">
      {piliers.map((p) => {
        const gap = p.allocationGap;
        const isOver = gap > 0;
        const isUnder = gap < 0;
        const color = PILIER_COLOR[p.pilier].hex;

        return (
          <div
            key={p.pilier}
            className="flex flex-1 flex-col items-center gap-3 min-w-0"
          >
            {/* Valeur réelle */}
            <span className="text-xl font-bold tabular-nums">
              {p.percentage.toFixed(1)} %
            </span>

            {/* Barre verticale — remplit la hauteur disponible */}
            <div className="relative w-16 flex-1 overflow-hidden rounded-2xl bg-muted sm:w-24">
              {/* Remplissage cible (fond) */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-2xl opacity-20"
                style={{ height: `${Math.min(p.targetPercentage, 100)}%`, backgroundColor: color }}
              />
              {/* Remplissage réel */}
              <div
                className="absolute inset-x-0 bottom-0 rounded-2xl transition-all duration-500"
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
                "text-base font-bold tabular-nums",
                isOver && "text-orange-500",
                isUnder && "text-blue-500",
                gap === 0 && "text-green-500"
              )}
            >
              {isOver ? "+" : ""}
              {gap.toFixed(1)} pt
            </span>

            {/* Pilier + cible */}
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-base font-semibold">
                  {PILIER_LABEL[p.pilier]}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                cible {p.targetPercentage} %
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
