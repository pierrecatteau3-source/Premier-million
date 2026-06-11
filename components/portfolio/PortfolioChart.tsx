"use client";

import { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { HistoryPoint } from "@/lib/services/portfolio.service";
import { DateRangePicker } from "@/components/portfolio/DateRangePicker";
import { SkaterOnPoint } from "@/components/portfolio/SkaterOnPoint";

interface Evolution {
  deltaEur: number;
  deltaPct: number;
}

/**
 * Active dot avec ligne horizontale pointillée vers l'axe Y.
 * Le `cy` est la position SVG du point sur la courbe → la ligne y est alignée.
 */
function ActiveDotWithLine(props: {
  cx?: number;
  cy?: number;
  plotBottom?: number;
  /** margin.left (8) + largeur de l'axe Y (responsive) */
  leftOffset?: number;
}) {
  const { cx = 0, cy = 0, plotBottom = 0, leftOffset = 98 } = props;
  return (
    <g pointerEvents="none">
      {/* Pointillé horizontal vers l'axe Y (au niveau du point) */}
      <line
        x1={leftOffset}
        y1={cy}
        x2={cx}
        y2={cy}
        stroke="hsl(var(--foreground))"
        strokeOpacity={0.35}
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      {/* Pointillé vertical vers l'axe X (en-dessous du point uniquement) */}
      {plotBottom > cy && (
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={plotBottom}
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.35}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="hsl(38 92% 55%)"
        stroke="hsl(var(--card))"
        strokeWidth={2}
      />
    </g>
  );
}

interface Props {
  onEvolutionChange?: (evo: Evolution) => void;
  /** Mode compact : pas de DateRangePicker, hauteur réduite. Pour le dashboard. */
  compact?: boolean;
  /** Plage par défaut (en jours) avant aujourd'hui. Défaut : 1 (yesterday). */
  defaultRangeDays?: number;
  /** Affiche le chibi skateur sur le dernier point de la courbe. */
  showSkater?: boolean;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function diffDays(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
}

function formatXDate(dateStr: string, from: string, to: string): string {
  const d = new Date(dateStr);
  if (diffDays(from, to) <= 31) {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
  }
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
}

export function PortfolioChart({
  onEvolutionChange,
  compact = false,
  defaultRangeDays = 1,
  showSkater = false,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const defaultFrom = new Date(Date.now() - defaultRangeDays * 86_400_000).toISOString().split("T")[0];

  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>(today);
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Mobile (< sm) : graphique moins haut + axe Y compact (k€/M€)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pour éviter le double fetch au montage
  const isFirstRender = useRef(true);
  // Pour annuler les requêtes en vol lors d'un changement de dates
  const abortCtrlRef = useRef<AbortController | null>(null);

  async function fetchByRange(f: string, t: string) {
    // Annuler toute requête précédente
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/portfolio/history?startDate=${f}&endDate=${t}`,
        { signal: ctrl.signal }
      );
      const json = await res.json() as {
        data?: HistoryPoint[];
        evolution?: {
          deltaEur: number;
          deltaPct: number;
        };
      };
      if (res.ok && Array.isArray(json.data)) {
        setData(json.data);
        const hasEnoughData = json.data.length >= 2;
        if (hasEnoughData && json.evolution) {
          onEvolutionChange?.({
            deltaEur: json.evolution.deltaEur,
            deltaPct: json.evolution.deltaPct,
          });
        }
      }
    } catch (e) {
      // Ignorer les erreurs d'annulation (AbortError) — comportement normal
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("Erreur fetch portfolio history:", e);
      }
    } finally {
      // Ne pas désactiver le loading si la requête a été annulée
      if (!ctrl.signal.aborted) {
        setLoading(false);
      }
    }
  }

  // Montage : sync + fetch initial (1 seul)
  useEffect(() => {
    fetch("/api/snapshots/sync", { method: "POST" }).catch(() => null);
    fetchByRange(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changements de dates : skip le premier cycle (le montage s'en charge)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchByRange(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Plage pilotée par le parent (mode compact + sélecteur de vue) :
  // recalculer la fenêtre quand defaultRangeDays change → l'effet [from, to] refetch.
  // Au montage les valeurs sont identiques à l'état initial → no-op (pas de double fetch).
  useEffect(() => {
    const t = new Date().toISOString().split("T")[0];
    const f = new Date(Date.now() - defaultRangeDays * 86_400_000)
      .toISOString()
      .split("T")[0];
    setFrom(f);
    setTo(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRangeDays]);

  const rawData = data;
  const displayData =
    rawData.length === 1
      ? (() => {
          const d = new Date(rawData[0].date);
          d.setDate(d.getDate() - 1);
          const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return [{ date: prev, totalValue: rawData[0].totalValue }, rawData[0]];
        })()
      : rawData;

  const chartData = displayData.map((d) => ({
    date: d.date,
    label: formatXDate(d.date, from, to),
    value: d.totalValue,
  }));

  const chartHeight = compact ? (isMobile ? 230 : 400) : 220;
  const emptyHeight = compact ? (isMobile ? "h-[230px]" : "h-[400px]") : "h-48";
  // Axe Y plus étroit sur mobile (labels compacts k€/M€) — leftOffset suit pour les pointillés
  const yAxisWidth = isMobile ? 52 : 90;
  const chartLeftOffset = 8 + yAxisWidth; // margin.left (8) + largeur YAxis
  // Approximation du bas de la zone de plot (sous laquelle se trouvent les ticks X) :
  // chartHeight − margin.bottom (8) − xAxis room (~22 = fontSize 11 + tickMargin 12).
  const plotBottom = chartHeight - 30;

  // Format compact pour l'axe Y mobile : "12 k€", "1,2 M€"
  function formatEurCompact(v: number): string {
    if (Math.abs(v) >= 1_000_000) {
      return `${(v / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M€`;
    }
    if (Math.abs(v) >= 1_000) {
      return `${Math.round(v / 1_000)} k€`;
    }
    return `${Math.round(v)} €`;
  }

  return (
    <div className="space-y-4">
      {/* Sélecteur de plage de dates — caché en mode compact */}
      {!compact && (
        <DateRangePicker
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
          }}
        />
      )}

      {/* Chart ou message vide */}
      {rawData.length === 0 ? (
        <div className={`flex ${emptyHeight} items-center justify-center text-sm text-muted-foreground`}>
          {loading
            ? "Chargement…"
            : "Enregistrez des valeurs pour voir l'évolution"}
        </div>
      ) : (
        <div className={loading ? "opacity-50 transition-opacity" : ""}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={{ top: 16, right: 32, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(45 95% 60%)" />
                  <stop offset="100%" stopColor="hsl(28 90% 50%)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="transparent" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                // Mobile : seulement la première et la dernière date
                ticks={
                  isMobile && chartData.length > 1
                    ? [chartData[0].label, chartData[chartData.length - 1].label]
                    : undefined
                }
                interval={isMobile ? 0 : "preserveStartEnd"}
                minTickGap={isMobile ? 0 : 72}
                tickMargin={12}
                padding={{ left: 8, right: 8 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => (isMobile ? formatEurCompact(v) : formatEur(v))}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={yAxisWidth}
                tickCount={isMobile ? 3 : 6}
                tickMargin={8}
                className="fill-muted-foreground"
                domain={[
                  (dataMin: number) => Math.floor((dataMin * 0.97) / 100) * 100,
                  (dataMax: number) => Math.ceil((dataMax * 1.03) / 100) * 100,
                ]}
              />
              <Tooltip
                cursor={false}
                formatter={(value) => [formatEur(Number(value)), "Patrimoine"]}
                labelFormatter={(label) => label}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 8px 24px -8px hsl(0 0% 0% / 0.6)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={2.5}
                isAnimationActive={!showSkater}
                dot={
                  showSkater
                    ? (dotProps) => {
                        const { cx, cy, index, key } = dotProps as {
                          cx?: number;
                          cy?: number;
                          index?: number;
                          key?: React.Key | null;
                        };
                        const isLast = index === chartData.length - 1;
                        const k = key ?? index ?? 0;
                        if (!isLast || cx == null || cy == null) {
                          return <g key={k} />;
                        }
                        return <SkaterOnPoint key={k} cx={cx} cy={cy} />;
                      }
                    : false
                }
                activeDot={(props) => (
                  <ActiveDotWithLine
                    cx={props.cx}
                    cy={props.cy}
                    plotBottom={plotBottom}
                    leftOffset={chartLeftOffset}
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
