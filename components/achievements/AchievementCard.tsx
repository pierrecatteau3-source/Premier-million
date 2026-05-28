"use client";

import { Lock, Trophy, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP, TIER_GRADIENT, TIER_GLOW, TIER_LABEL } from "./icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { UserAchievementStatus } from "@/types";

interface Props {
  achievement: UserAchievementStatus;
}

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function AchievementCard({ achievement }: Props) {
  const isHiddenLocked = !!achievement.hidden && !achievement.unlocked;

  // Si hidden + locked : on cache le label, l'icône réelle et la description
  const displayLabel = isHiddenLocked ? "???" : achievement.label;
  const DisplayIcon = isHiddenLocked
    ? HelpCircle
    : (ICON_MAP[achievement.icon] ?? Trophy);

  const tooltipTitle = isHiddenLocked ? "Succès secret" : achievement.label;
  const tooltipBody = isHiddenLocked
    ? (achievement.hint ?? "Un succès à découvrir…")
    : achievement.description;

  const gradient = TIER_GRADIENT[achievement.tier] ?? TIER_GRADIENT.bronze;
  const glow = TIER_GLOW[achievement.tier] ?? "";

  const unlockedAtLabel = achievement.unlocked && achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex flex-col items-center gap-2 cursor-help">
            {/* Hexagone */}
            <div className="relative w-[72px] h-[72px]">
              {/* Fond tier (légèrement plus grand, décalé — simule un contour) */}
              <div
                className={cn(
                  "absolute inset-0 scale-[1.07] bg-gradient-to-br opacity-60",
                  gradient,
                  !achievement.unlocked && "grayscale opacity-20"
                )}
                style={{ clipPath: HEX_CLIP }}
              />

              {/* Badge principal */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br flex items-center justify-center transition-all duration-300",
                  gradient,
                  achievement.unlocked ? glow : "grayscale opacity-30"
                )}
                style={{ clipPath: HEX_CLIP }}
              >
                <DisplayIcon className="h-7 w-7 text-white drop-shadow-sm" />
              </div>

              {/* Cadenas si verrouillé */}
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground/70" />
                </div>
              )}
            </div>

            {/* Texte */}
            <div className="text-center w-20">
              <p
                className={cn(
                  "text-[11px] font-semibold leading-tight",
                  achievement.unlocked ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {displayLabel}
              </p>
              {achievement.unlocked && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {TIER_LABEL[achievement.tier]}
                </span>
              )}
            </div>
          </div>
        }
      />

      <TooltipContent
        side="top"
        className="max-w-[260px] flex-col items-start gap-1 bg-card text-card-foreground ring-1 ring-foreground/15 shadow-elev-3 px-3.5 py-2.5"
      >
        {/* Titre + tier */}
        <div className="flex items-center gap-2 w-full">
          <p className="text-sm font-semibold text-foreground">{tooltipTitle}</p>
          {!isHiddenLocked && (
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {TIER_LABEL[achievement.tier]}
            </span>
          )}
        </div>

        {/* Description / hint */}
        <p
          className={cn(
            "text-xs leading-snug",
            isHiddenLocked ? "italic text-muted-foreground" : "text-muted-foreground"
          )}
        >
          {tooltipBody}
        </p>

        {/* Footer : date de déblocage ou statut */}
        {achievement.unlocked ? (
          <p className="mt-1 text-[10px] text-success">
            ✓ Débloqué le {unlockedAtLabel}
          </p>
        ) : (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {isHiddenLocked ? "Secret" : "Verrouillé"}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
