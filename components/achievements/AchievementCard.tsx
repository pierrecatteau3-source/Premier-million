"use client";

import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP, TIER_GRADIENT, TIER_GLOW, TIER_LABEL } from "./icons";
import type { UserAchievementStatus } from "@/types";

interface Props {
  achievement: UserAchievementStatus;
}

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function AchievementCard({ achievement }: Props) {
  const Icon = ICON_MAP[achievement.icon] ?? Trophy;
  const gradient = TIER_GRADIENT[achievement.tier] ?? TIER_GRADIENT.bronze;
  const glow = TIER_GLOW[achievement.tier] ?? "";

  return (
    <div
      className="flex flex-col items-center gap-2"
      title={`${achievement.label} — ${achievement.description}${achievement.unlockedAt ? `\nDébloqué le ${new Date(achievement.unlockedAt).toLocaleDateString("fr-FR")}` : ""}`}
    >
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
          <Icon className="h-7 w-7 text-white drop-shadow-sm" />
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
          {achievement.label}
        </p>
        {achievement.unlocked && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {TIER_LABEL[achievement.tier]}
          </span>
        )}
      </div>
    </div>
  );
}
