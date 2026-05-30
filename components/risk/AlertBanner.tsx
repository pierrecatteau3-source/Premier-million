import type { RiskAlert, Pilier } from "@/types";
import {
  IconPEA,
  IconCrypto,
  IconImmo,
  IconAutre,
  IconShield,
  type IconProps,
} from "@/components/icons";

interface Props {
  alerts: RiskAlert[];
}

const PILIER_ICON: Record<Exclude<Pilier, "LIQUIDITE">, (p: IconProps) => React.ReactNode> = {
  PEA: IconPEA,
  CRYPTO: IconCrypto,
  IMMO: IconImmo,
  AUTRE: IconAutre,
};

const PILIER_NAME: Record<Pilier, string> = {
  PEA: "PEA",
  CRYPTO: "Crypto",
  IMMO: "Immobilier",
  AUTRE: "Trésor",
  LIQUIDITE: "Liquidités",
};

const SEVERITY = {
  danger: {
    color: "var(--pm-negative)",
    glow: "rgba(217, 116, 100, 0.20)",
    label: "Urgent",
  },
  warning: {
    color: "var(--pm-copper-bright)",
    glow: "rgba(219, 165, 102, 0.18)",
    label: "Attention",
  },
} as const;

export function AlertBanner({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-md border border-border bg-surface-2 px-5 py-5">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md border text-positive"
          style={{
            background:
              "linear-gradient(135deg, rgba(148,200,112,0.18), rgba(148,200,112,0.04))",
            borderColor: "rgba(148,200,112,0.32)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <IconShield size={24} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">
            Allocation équilibrée
          </p>
          <p className="mt-1 text-[12px] leading-snug text-ink-muted">
            Aucune alerte active — Pio approuve le rangement du trésor.
          </p>
        </div>
      </div>
    );
  }

  // Danger en premier
  const sorted = [...alerts].sort((a, b) =>
    a.severity === "danger" && b.severity !== "danger" ? -1 : 1,
  );

  return (
    <ul className="space-y-2.5">
      {sorted.map((alert, i) => {
        const sev = SEVERITY[alert.severity];
        const Icon =
          PILIER_ICON[alert.pilier as Exclude<Pilier, "LIQUIDITE">] ?? IconAutre;

        return (
          <li
            key={i}
            className="relative flex items-center gap-3.5 overflow-hidden rounded-md border border-border bg-surface-2 py-3 pl-5 pr-3"
          >
            {/* Accent vertical gauche */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{
                backgroundColor: sev.color,
                boxShadow: `0 0 10px ${sev.glow}`,
              }}
            />

            {/* Picto pilier */}
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-deep">
              <Icon size={24} />
            </span>

            {/* Texte */}
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-ink-muted">
                {PILIER_NAME[alert.pilier]}
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-ink">
                {alert.message}
              </p>
            </div>

            {/* Chip sévérité */}
            <span
              className="shrink-0 rounded-sm border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: sev.color,
                borderColor: sev.color,
                background: `linear-gradient(135deg, ${sev.glow}, transparent 80%)`,
              }}
            >
              {sev.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
