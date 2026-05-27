"use client";
import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PieChart as PieChartIcon, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  piliers: {
    pilier: string;
    totalValue: number;
    percentage: number;
    targetPercentage: number;
  }[];
}

const PILIER_COLORS: Record<string, string> = {
  PEA:    "hsl(280 90% 65%)",
  CRYPTO: "hsl(38 92% 55%)",
  IMMO:   "hsl(142 76% 45%)",
  AUTRE:  "hsl(220 14% 50%)",
};

const PILIER_LABELS: Record<string, string> = {
  PEA:    "PEA / Actions",
  CRYPTO: "Crypto",
  IMMO:   "Immobilier",
  AUTRE:  "Autre",
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatEurShort(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M€`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k€`;
  return `${v} €`;
}

type ChartMode = "pie" | "bar";

export function PilierChart({ piliers }: Props) {
  const [mode, setMode] = useState<ChartMode>("pie");

  const data = piliers
    .filter(p => p.totalValue > 0)
    .map(p => ({
      name: PILIER_LABELS[p.pilier] ?? p.pilier,
      value: p.percentage,
      totalValue: p.totalValue,
      pilier: p.pilier,
    }));

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Aucun actif enregistré.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle pie / bar */}
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setMode("pie")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            mode === "pie"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Camembert"
        >
          <PieChartIcon className="h-3.5 w-3.5" />
          Camembert
        </button>
        <button
          onClick={() => setMode("bar")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            mode === "bar"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Histogramme"
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Histogramme
        </button>
      </div>

      {/* Camembert */}
      <div
        className={cn(
          "transition-opacity duration-300",
          mode === "pie" ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none"
        )}
        aria-hidden={mode !== "pie"}
      >
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map(entry => (
                <Cell
                  key={entry.pilier}
                  fill={PILIER_COLORS[entry.pilier] ?? "hsl(var(--primary))"}
                />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => [
                `${Number(value).toFixed(1)} % — ${formatEur(props.payload?.totalValue ?? 0)}`,
                props.payload?.name ?? "",
              ]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Histogramme */}
      <div
        className={cn(
          "transition-opacity duration-300",
          mode === "bar" ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none"
        )}
        aria-hidden={mode !== "bar"}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatEurShort}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => {
                const payload = props.payload as { totalValue?: number; value?: number; name?: string };
                return [
                  `${formatEur(payload?.totalValue ?? 0)} — ${Number(payload?.value ?? 0).toFixed(1)} %`,
                  payload?.name ?? "",
                ];
              }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
            />
            <Bar dataKey="totalValue" radius={[6, 6, 0, 0]}>
              {data.map(entry => (
                <Cell
                  key={entry.pilier}
                  fill={PILIER_COLORS[entry.pilier] ?? "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
