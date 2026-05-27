import type { RiskAlert } from "@/types";
import { PILIER_COLOR } from "@/types";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  alerts: RiskAlert[];
}

const SEVERITY_CONFIG = {
  danger: {
    Icon: AlertCircle,
    bg: "bg-red-50 border-red-200",
    icon: "text-red-500",
    text: "text-red-800",
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-orange-50 border-orange-200",
    icon: "text-orange-500",
    text: "text-orange-800",
  },
} as const;

export function AlertBanner({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        <p className="text-sm text-green-800 font-medium">
          Allocation équilibrée — aucune alerte active.
        </p>
      </div>
    );
  }

  // Trie : danger en premier
  const sorted = [...alerts].sort((a, b) =>
    a.severity === "danger" && b.severity !== "danger" ? -1 : 1
  );

  return (
    <div className="space-y-2">
      {sorted.map((alert, i) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              cfg.bg
            )}
          >
            <span
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PILIER_COLOR[alert.pilier].hex }}
            />
            <cfg.Icon className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.icon)} />
            <p className={cn("text-sm", cfg.text)}>{alert.message}</p>
          </div>
        );
      })}
    </div>
  );
}
