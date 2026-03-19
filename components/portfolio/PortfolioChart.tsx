"use client";

import { useState, useCallback } from "react";
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

type Period = "7d" | "1m" | "3m" | "6m" | "1y" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7j" },
  { value: "1m", label: "1m" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
  { value: "all", label: "Tout" },
];

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatXDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "7d" || period === "1m") {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
  }
  if (period === "3m" || period === "6m") {
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(d);
}

interface Props {
  initialData: HistoryPoint[];
  initialPeriod?: Period;
}

export function PortfolioChart({ initialData, initialPeriod = "1m" }: Props) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<HistoryPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/history?period=${p}`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data) && json.data.length > 0) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  function handlePeriod(p: Period) {
    setPeriod(p);
    fetchData(p);
  }

  const rawData = data;
  const displayData =
    rawData.length === 1
      ? [
          {
            date: new Date(new Date(rawData[0].date).getTime() - 86_400_000)
              .toISOString()
              .split("T")[0],
            totalValue: rawData[0].totalValue,
          },
          rawData[0],
        ]
      : rawData;

  const chartData = displayData.map((d) => ({
    date: d.date,
    label: formatXDate(d.date, period),
    value: d.totalValue,
  }));

  return (
    <div className="space-y-4">
      {/* Sélecteur de période */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriod(p.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart ou message vide */}
      {rawData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          {loading
            ? "Chargement…"
            : "Enregistrez des valeurs pour voir l'évolution"}
        </div>
      ) : (
        <div className={loading ? "opacity-50 transition-opacity" : ""}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(280, 90%, 65%)" />
                  <stop offset="100%" stopColor="hsl(320, 75%, 60%)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="transparent" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
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
