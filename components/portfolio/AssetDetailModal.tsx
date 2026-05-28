"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { X } from "lucide-react";
import { PILIER_LABEL, PILIER_COLOR, type Pilier } from "@/types";
import type { HistoryPoint } from "@/lib/services/portfolio.service";
import { cn } from "@/lib/utils";

export interface AssetDetailData {
  id: string;
  name: string;
  pilier: Pilier;
  type: string;
  ticker?: string | null;
  pricingMode?: string;
  quantiteTotal?: number | null;
  coutRevient?: number | null;
  pmp?: number | null;
  latestValue?: number;
  latestDate?: string;
  pvLatente?: number | null;
  pvPct?: number | null;
}

interface Props {
  asset: AssetDetailData | null;
  onClose: () => void;
}

const PRICING_LABEL: Record<string, string> = {
  manual: "Estimation manuelle",
  live_crypto: "Prix live Crypto",
  live_equity: "Prix live Action / ETF",
  savings: "Livret / Épargne",
};

type Range = "1j" | "7j" | "1m" | "1a";
const RANGES: Range[] = ["1j", "7j", "1m", "1a"];

function formatEur(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number | null | undefined) {
  if (value == null) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} %`;
}

function formatQty(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeStart(range: Range): Date {
  const d = new Date();
  switch (range) {
    case "1j": d.setDate(d.getDate() - 1); break;
    case "7j": d.setDate(d.getDate() - 7); break;
    case "1m": d.setMonth(d.getMonth() - 1); break;
    case "1a": d.setFullYear(d.getFullYear() - 1); break;
  }
  return d;
}

function formatXDate(dateStr: string, range: Range): string {
  const d = new Date(dateStr);
  if (range === "1a") {
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
}

function AssetChart({ assetId }: { assetId: string }) {
  const [range, setRange] = useState<Range>("1m");
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const start = toDateKey(rangeStart(range));
    const end = toDateKey(new Date());
    setLoading(true);
    fetch(`/api/assets/${assetId}/history?startDate=${start}&endDate=${end}`, {
      signal: ctrl.signal,
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: HistoryPoint[] }) => {
        if (Array.isArray(json.data)) setData(json.data);
      })
      .catch((e) => {
        if (e instanceof Error && e.name !== "AbortError") setData([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [assetId, range]);

  const chartData = data.map((d) => ({
    label: formatXDate(d.date, range),
    value: d.totalValue,
  }));

  const first = data[0]?.totalValue ?? 0;
  const last = data[data.length - 1]?.totalValue ?? 0;
  const deltaEur = last - first;
  const deltaPct = first === 0 ? 0 : (deltaEur / first) * 100;
  const isUp = deltaEur > 0;
  const isDown = deltaEur < 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Évolution
        </p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                range === r
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data.length >= 2 && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            isUp && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
            isDown && "bg-red-500/10 text-red-500",
            !isUp && !isDown && "bg-muted text-muted-foreground"
          )}
        >
          {isUp ? "↑" : isDown ? "↓" : ""}
          {isUp ? "+" : ""}
          {formatEur(deltaEur)} ({deltaPct > 0 ? "+" : ""}
          {deltaPct.toFixed(1)} %)
        </span>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Pas encore de données sur cette période.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="assetLineGradient" x1="0" y1="0" x2="1" y2="0">
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
              tickMargin={8}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(v) => formatEur(v)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
              tickCount={5}
              className="fill-muted-foreground"
              domain={[
                (dataMin: number) => Math.floor((dataMin * 0.97) / 100) * 100,
                (dataMax: number) => Math.ceil((dataMax * 1.03) / 100) * 100,
              ]}
            />
            <Tooltip
              formatter={(value) => [formatEur(Number(value)), "Valeur"]}
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
              stroke="url(#assetLineGradient)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "up" | "down" }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg px-3 py-2"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          accent === "up" && "text-emerald-500",
          accent === "down" && "text-red-500"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function AssetDetailModal({ asset, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!asset) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [asset, onClose]);

  if (!asset || !mounted) return null;

  const pvAccent = asset.pvLatente == null ? undefined : asset.pvLatente >= 0 ? "up" : "down";
  const pvDisplay =
    asset.pvLatente == null
      ? "—"
      : `${asset.pvLatente >= 0 ? "+" : ""}${formatEur(asset.pvLatente)}${
          asset.pvPct != null ? ` (${formatPct(asset.pvPct)})` : ""
        }`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border p-6 shadow-2xl"
        style={{ backgroundColor: "hsl(var(--popover))" }}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-tight text-primary">{asset.name}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PILIER_COLOR[asset.pilier].hex }}
              />
              {PILIER_LABEL[asset.pilier]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grille d'informations */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <InfoRow label="Type" value={asset.type} />
          <InfoRow label="Valeur" value={formatEur(asset.latestValue)} />
          <InfoRow label="+/− latent" value={pvDisplay} accent={pvAccent} />
          <InfoRow label="PMP" value={asset.pmp != null ? formatEur(asset.pmp) : "—"} />
          <InfoRow label="Investi" value={formatEur(asset.coutRevient)} />
          <InfoRow label="Quantité" value={formatQty(asset.quantiteTotal)} />
          <InfoRow
            label="Mode de prix"
            value={PRICING_LABEL[asset.pricingMode ?? "manual"] ?? "Estimation manuelle"}
          />
          {asset.ticker && <InfoRow label="Ticker" value={asset.ticker} />}
          <InfoRow label="Mise à jour" value={formatDate(asset.latestDate)} />
        </div>

        {/* Graphique */}
        <div className="mt-6 border-t border-border/60 pt-4">
          <AssetChart assetId={asset.id} />
        </div>
      </div>
    </div>,
    document.body
  );
}
