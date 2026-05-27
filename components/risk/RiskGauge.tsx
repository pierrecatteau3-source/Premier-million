"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  score: number; // 0–1
  level: "faible" | "modéré" | "élevé";
}

const LEVEL_CONFIG = {
  faible:  { label: "Risque faible",  color: "#22c55e", bg: "bg-green-50",  text: "text-green-700"  },
  modéré:  { label: "Risque modéré",  color: "#f97316", bg: "bg-orange-50", text: "text-orange-700" },
  élevé:   { label: "Risque élevé",   color: "#ef4444", bg: "bg-red-50",    text: "text-red-700"    },
} as const;

export function RiskGauge({ score, level }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const cfg = LEVEL_CONFIG[level];

  // Arc SVG : demi-cercle 180° (gauche → droite)
  const R = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = Math.PI;          // 180°
  const endAngle = 0;                  // 0°
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
  const needleX = cx + (R - 10) * Math.cos(needleAngle);
  const needleY = cy - (R - 10) * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG jauge */}
      <div className="relative">
        <svg width="200" height="110" viewBox="0 0 200 110">
          {/* Piste grise */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Arc de progression */}
          <path
            d={arcPath(startAngle, progressAngle)}
            fill="none"
            stroke={cfg.color}
            strokeWidth="16"
            strokeLinecap="round"
            style={{ transition: "d 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* Jalons 33% / 66% */}
          {[1/3, 2/3].map((frac) => {
            const a = Math.PI - frac * Math.PI;
            const x1 = cx + (R - 10) * Math.cos(a);
            const y1 = cy - (R - 10) * Math.sin(a);
            const x2 = cx + (R + 10) * Math.cos(a);
            const y2 = cy - (R + 10) * Math.sin(a);
            return (
              <line
                key={frac}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#d1d5db"
                strokeWidth="2"
              />
            );
          })}
          {/* Aiguille */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke="#374151"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: "x2 0.7s cubic-bezier(0.4,0,0.2,1), y2 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
          <circle cx={cx} cy={cy} r="4" fill="#374151" />
          {/* Labels */}
          <text x="18" y="108" fontSize="10" fill="#9ca3af">Faible</text>
          <text x="84" y="22" fontSize="10" fill="#9ca3af" textAnchor="middle">Modéré</text>
          <text x="168" y="108" fontSize="10" fill="#9ca3af" textAnchor="end">Élevé</text>
        </svg>

        {/* Score central */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-bold tabular-nums">
            {Math.round(score * 100)}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Badge de niveau */}
      <span className={cn("rounded-full px-4 py-1 text-sm font-semibold", cfg.bg, cfg.text)}>
        {cfg.label}
      </span>
    </div>
  );
}
