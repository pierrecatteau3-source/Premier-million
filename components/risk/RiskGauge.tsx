"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number; // 0–1
  level: "faible" | "modéré" | "élevé";
}

const LEVEL = {
  faible: {
    label: "Risque faible",
    color: "var(--pm-positive)",
    deep: "var(--pm-positive-deep)",
    glow: "rgba(148, 200, 112, 0.22)",
  },
  modéré: {
    label: "Risque modéré",
    color: "var(--pm-gold)",
    deep: "var(--pm-gold-deep)",
    glow: "rgba(224, 180, 80, 0.22)",
  },
  élevé: {
    label: "Risque élevé",
    color: "var(--pm-negative)",
    deep: "var(--pm-negative-deep)",
    glow: "rgba(217, 116, 100, 0.22)",
  },
} as const;

export function RiskGauge({ score, level }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 180);
    return () => clearTimeout(t);
  }, [score]);

  const cfg = LEVEL[level];

  // Geometry — demi-cercle 180° → 0°
  const R = 96;
  const cx = 130;
  const cy = 130;
  const startAngle = Math.PI;
  const endAngle = 0;
  const progressAngle = Math.PI - animated * Math.PI;

  const arcPath = (a1: number, a2: number) => {
    const x1 = cx + R * Math.cos(a1);
    const y1 = cy - R * Math.sin(a1);
    const x2 = cx + R * Math.cos(a2);
    const y2 = cy - R * Math.sin(a2);
    const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Aiguille
  const needleAngle = Math.PI - animated * Math.PI;
  const needleR = R - 14;
  const needleX = cx + needleR * Math.cos(needleAngle);
  const needleY = cy - needleR * Math.sin(needleAngle);

  const gradId = `gauge-grad-${level}`;
  const glowId = `gauge-glow-${level}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div>
        <svg
          width="260"
          height="160"
          viewBox="0 0 260 160"
          className="overflow-visible"
          aria-label={`Score de risque ${Math.round(score * 100)} sur 100`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={cfg.deep} />
              <stop offset="55%" stopColor={cfg.color} />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0.85" />
            </linearGradient>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="var(--pm-surface-3)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Track inner shadow */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="var(--pm-bg-deep)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Progress arc */}
          <path
            d={arcPath(startAngle, progressAngle)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="14"
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            style={{ transition: "d 0.9s cubic-bezier(0.4,0,0.2,1)" }}
          />

          {/* Jalons 1/3 et 2/3 */}
          {[1 / 3, 2 / 3].map((frac) => {
            const a = Math.PI - frac * Math.PI;
            const x1 = cx + (R - 16) * Math.cos(a);
            const y1 = cy - (R - 16) * Math.sin(a);
            const x2 = cx + (R + 6) * Math.cos(a);
            const y2 = cy - (R + 6) * Math.sin(a);
            return (
              <line
                key={frac}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--pm-rule-strong)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            );
          })}

          {/* Aiguille */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="var(--pm-ink-soft)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transition:
                "x2 0.9s cubic-bezier(0.4,0,0.2,1), y2 0.9s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
          {/* Hub */}
          <circle
            cx={cx}
            cy={cy}
            r="9"
            fill="var(--pm-surface-2)"
            stroke="var(--pm-rule-gold)"
            strokeWidth="1"
          />
          <circle cx={cx} cy={cy} r="4.5" fill="var(--pm-gold)" />
          <circle cx={cx} cy={cy} r="1.8" fill="var(--pm-bg-deep)" />

          {/* Tick labels — mono uppercase */}
          <text
            x={cx + (R + 14) * Math.cos(Math.PI)}
            y={cy + 16}
            fontSize="9"
            fontFamily="var(--font-mono), JetBrains Mono, monospace"
            letterSpacing="1.6"
            fill="var(--pm-ink-muted)"
            textAnchor="start"
          >
            FAIBLE
          </text>
          <text
            x={cx}
            y={cy - R - 14}
            fontSize="9"
            fontFamily="var(--font-mono), JetBrains Mono, monospace"
            letterSpacing="1.6"
            fill="var(--pm-ink-muted)"
            textAnchor="middle"
          >
            MODÉRÉ
          </text>
          <text
            x={cx + (R + 14) * Math.cos(0)}
            y={cy + 16}
            fontSize="9"
            fontFamily="var(--font-mono), JetBrains Mono, monospace"
            letterSpacing="1.6"
            fill="var(--pm-ink-muted)"
            textAnchor="end"
          >
            ÉLEVÉ
          </text>
        </svg>
      </div>

      {/* Score — cadre dédié, plus de superposition sur la jauge */}
      <div
        className="flex flex-col items-center gap-1 rounded-md border px-7 py-2.5"
        style={{
          borderColor: "var(--pm-rule-strong)",
          background: "var(--pm-surface-2)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-baseline gap-1.5 font-display font-bold tabular-nums leading-none tracking-[-0.04em] text-ink">
          <span className="text-[44px]">{Math.round(score * 100)}</span>
          <span className="font-mono text-[12px] tracking-[0.12em] text-ink-muted">
            /100
          </span>
        </div>
        <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ink-dim">
          indice global
        </div>
      </div>

      {/* Level chip */}
      <div
        className="inline-flex items-center gap-2.5 rounded-sm border px-3.5 py-1.5"
        style={{
          background: `linear-gradient(135deg, ${cfg.glow}, transparent 70%)`,
          borderColor: cfg.color,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px -4px ${cfg.glow}`,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-pill"
          style={{
            backgroundColor: cfg.color,
            boxShadow: `0 0 8px ${cfg.color}`,
          }}
        />
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
