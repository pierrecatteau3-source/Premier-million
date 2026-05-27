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

interface Evolution {
  deltaEur: number;
  deltaPct: number;
}

interface Props {
  onEvolutionChange?: (evo: Evolution) => void;
  /** Mode compact : pas de DateRangePicker, hauteur réduite. Pour le dashboard. */
  compact?: boolean;
  /** Plage par défaut (en jours) avant aujourd'hui. Défaut : 1 (yesterday). */
  defaultRangeDays?: number;
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

export function PortfolioChart({ onEvolutionChange, compact = false, defaultRangeDays = 1 }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const defaultFrom = new Date(Date.now() - defaultRangeDays * 86_400_000).toISOString().split("T")[0];

  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>(today);
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);

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

  const chartHeight = compact ? 200 : 220;
  const emptyHeight = compact ? "h-52" : "h-48";

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
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                interval="preserveStartEnd"
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => formatEur(v)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={90}
                className="fill-muted-foreground"
                domain={[
                  (dataMin: number) => Math.floor(dataMin * 0.97),
                  (dataMax: number) => Math.ceil(dataMax * 1.03),
                ]}
              />
              <Tooltip
                formatter={(value) => [formatEur(Number(value)), "Patrimoine"]}
                labelFormatter={(label) => label}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
