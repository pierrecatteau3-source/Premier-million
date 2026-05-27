"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP, TIER_GRADIENT } from "./icons";
import type { AchievementDef } from "@/types";

interface Props {
  achievements: AchievementDef[];
  onDismiss: () => void;
}

export function AchievementToast({ achievements, onDismiss }: Props) {
  const [queue, setQueue] = useState<AchievementDef[]>([...achievements]);
  const [animKey, setAnimKey] = useState(0);

  const advance = useCallback(() => {
    setQueue((prev) => {
      const next = prev.slice(1);
      if (next.length > 0) setAnimKey((k) => k + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (queue.length === 0) {
      onDismiss();
      return;
    }
    const timer = setTimeout(advance, 5000);
    return () => clearTimeout(timer);
  }, [queue.length, animKey, advance, onDismiss]);

  const current = queue[0];
  if (!current) return null;

  const Icon = ICON_MAP[current.icon] ?? Trophy;
  const gradient = TIER_GRADIENT[current.tier] ?? TIER_GRADIENT.bronze;

  return (
    <div key={animKey} className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xl min-w-[260px] max-w-[320px] cursor-pointer"
        onClick={advance}
        role="button"
        aria-label="Fermer la notification"
      >
        {/* Icône tier */}
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br flex items-center justify-center",
            gradient
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Texte */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Succès débloqué !
          </p>
          <p className="text-sm font-bold text-foreground leading-tight truncate">
            {current.label}
          </p>
          <p className="text-xs text-muted-foreground truncate">{current.description}</p>
        </div>

        {/* Compteur si plusieurs */}
        {queue.length > 1 && (
          <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
            +{queue.length - 1}
          </span>
        )}
      </div>

      {/* Barre de progression */}
      <div className="mx-3 h-0.5 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-primary animate-progress-shrink" />
      </div>
    </div>
  );
}
