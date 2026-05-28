"use client";

import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getMedalIcon } from "./medal-icon-map";
import type { UserAchievementStatus } from "@/types";

type DiscStyle = { disc: CSSProperties; icon: string };

const TIER_STYLE: Record<string, DiscStyle> = {
  bronze: {
    disc: {
      background:
        "radial-gradient(circle at 32% 26%, rgba(255,220,180,0.55), transparent 40%), radial-gradient(circle at 65% 75%, rgba(0,0,0,0.30), transparent 50%), radial-gradient(circle at center, #d6864a 0%, #b8643e 50%, #7a3e26 100%)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.30), 0 4px 14px rgba(184,100,62,0.15), 0 0 0 2px rgba(122,62,38,0.6), 0 0 0 3px rgba(184,100,62,0.3)",
    },
    icon: "#3a1a0d",
  },
  silver: {
    disc: {
      background:
        "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.50), transparent 40%), radial-gradient(circle at 65% 75%, rgba(0,0,0,0.25), transparent 50%), radial-gradient(circle at center, #e0dcd0 0%, #c5c0b0 50%, #7e7866 100%)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 14px rgba(197,192,176,0.12), 0 0 0 2px rgba(126,120,102,0.55), 0 0 0 3px rgba(197,192,176,0.3)",
    },
    icon: "#2a2620",
  },
  gold: {
    disc: {
      background:
        "radial-gradient(circle at 32% 26%, rgba(255,240,200,0.65), transparent 40%), radial-gradient(circle at 65% 75%, rgba(0,0,0,0.30), transparent 50%), radial-gradient(circle at center, #f5d57a 0%, #e0b450 50%, #a07a30 100%)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.25), 0 6px 18px rgba(224,180,80,0.25), 0 0 0 2px rgba(160,122,48,0.6), 0 0 0 3px rgba(224,180,80,0.35)",
    },
    icon: "#3a2a08",
  },
  diamond: {
    disc: {
      background:
        "radial-gradient(circle at 32% 26%, rgba(220,245,255,0.6), transparent 40%), radial-gradient(circle at 65% 75%, rgba(0,0,0,0.28), transparent 50%), radial-gradient(circle at center, #bfe9ff 0%, #6cc5e6 50%, #2f6f8a 100%)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.25), 0 6px 18px rgba(108,197,230,0.22), 0 0 0 2px rgba(47,111,138,0.6), 0 0 0 3px rgba(108,197,230,0.35)",
    },
    icon: "#0a2733",
  },
  locked: {
    disc: {
      background: "radial-gradient(circle at 32% 28%, #1f1416, #0d0606 80%)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 2px rgba(0,0,0,0.6), 0 0 0 2px var(--pm-ink-faint)",
    },
    icon: "var(--pm-ink-dim)",
  },
};

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  diamond: "Diamant",
};

const RIBBON_CLASS: Record<string, string> = {
  bronze: "text-bronze border-bronze/40",
  silver: "text-silver border-silver/40",
  gold: "text-gold-bright border-gold/40",
  diamond: "border-[rgba(108,197,230,0.4)] text-[#9fdcf0]",
  locked: "text-ink-dim border-border",
};

interface Props {
  achievement: UserAchievementStatus;
}

export function Medal({ achievement }: Props) {
  const { unlocked, tier, hidden, label, description, hint, icon, unlockedAt } =
    achievement;
  const hiddenLocked = !!hidden && !unlocked;

  const style = unlocked ? TIER_STYLE[tier] ?? TIER_STYLE.bronze : TIER_STYLE.locked;
  const ribbon = unlocked ? TIER_LABEL[tier] ?? "Bronze" : "???";
  const ribbonClass = unlocked ? RIBBON_CLASS[tier] ?? RIBBON_CLASS.bronze : RIBBON_CLASS.locked;
  const displayName = hiddenLocked ? "???" : label;
  const CartoonIcon = getMedalIcon(icon);

  const tooltipTitle = hiddenLocked ? "Succès secret" : label;
  const tooltipBody = hiddenLocked ? hint ?? "Un succès à découvrir…" : description;
  const unlockedAtLabel =
    unlocked && unlockedAt
      ? new Date(unlockedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn(
              "group relative flex cursor-help flex-col items-center gap-2.5 rounded-lg border border-border bg-surface px-3 pb-3.5 pt-[18px] text-center transition-all duration-200 hover:-translate-y-[3px] hover:border-gold/30 hover:bg-surface-2",
              !unlocked && "opacity-55 hover:opacity-90"
            )}
          >
            <div
              className="relative grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full"
              style={style.disc}
            >
              <span
                className="relative z-[1] grid place-items-center"
                style={{ color: style.icon, opacity: unlocked ? 1 : 0.6 }}
              >
                {unlocked ? (
                  <CartoonIcon size={38} />
                ) : (
                  <Lock size={30} strokeWidth={1.6} />
                )}
              </span>
              <span
                className={cn(
                  "absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-pill border bg-surface-deep px-2 py-0.5 font-mono text-[7.5px] uppercase tracking-[0.18em]",
                  ribbonClass
                )}
              >
                {ribbon}
              </span>
            </div>
            <div
              className={cn(
                "pt-1 font-display text-[12px] font-semibold leading-tight tracking-[-0.005em]",
                unlocked
                  ? "text-ink group-hover:text-gold-bright"
                  : "text-ink-dim group-hover:text-ink-soft"
              )}
            >
              {displayName}
            </div>
          </div>
        }
      />
      <TooltipContent side="top" className="max-w-[280px] flex-col items-start gap-1.5 px-4 py-3">
        <div className="flex w-full items-center gap-3">
          <p className="font-display text-sm font-bold text-ink">{tooltipTitle}</p>
          {!hiddenLocked && (
            <span className={cn("ml-auto font-mono text-[9px] font-bold uppercase tracking-wider", unlocked ? "text-gold-bright" : "text-ink-muted")}>
              {TIER_LABEL[tier]}
            </span>
          )}
        </div>
        <p className={cn("text-xs leading-snug", hiddenLocked ? "italic text-ink-muted" : "text-ink-soft")}>
          {tooltipBody}
        </p>
        {unlocked ? (
          <p className="mt-1 text-[10px] text-positive">✓ Débloqué le {unlockedAtLabel}</p>
        ) : (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            {hiddenLocked ? "Secret" : "Verrouillé"}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
