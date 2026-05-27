import {
  Shield,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Target,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Target,
};

interface Props {
  label: string;
  value: number | null;
  icon: string;
  suffix?: string;
  formatAsCurrency?: boolean;
  subLabel?: string;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatNumber(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

export function KpiCard({
  label,
  value,
  icon,
  suffix = "",
  formatAsCurrency = false,
  subLabel,
}: Props) {
  const Icon = ICON_MAP[icon] ?? Briefcase;

  const displayValue =
    value === null
      ? "—"
      : formatAsCurrency
      ? formatEur(value)
      : `${formatNumber(value)}${suffix ? " " + suffix : ""}`;

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-violet-400 dark:text-violet-400 shrink-0" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
      {value === null && subLabel && (
        <p className="mt-1 text-xs text-muted-foreground">{subLabel}</p>
      )}
    </div>
  );
}
