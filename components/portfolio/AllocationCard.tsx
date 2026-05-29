import type { PilierSummary, Pilier } from "@/types";
import { IconPEA, IconCrypto, IconImmo, IconAutre, type IconProps } from "@/components/icons";

const ICONS: Record<Exclude<Pilier, "LIQUIDITE">, (p: IconProps) => React.ReactNode> = {
  PEA: IconPEA,
  CRYPTO: IconCrypto,
  IMMO: IconImmo,
  AUTRE: IconAutre,
};

const NAMES: Record<Exclude<Pilier, "LIQUIDITE">, string> = {
  PEA: "PEA",
  CRYPTO: "Crypto",
  IMMO: "Immobilier",
  AUTRE: "Trésor",
};

export function AllocationCard({ piliers }: { piliers: PilierSummary[] }) {
  const reels = piliers.filter((p) => p.pilier !== "LIQUIDITE");

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="font-display text-[22px] font-bold tracking-[-0.025em]">
        Allocation vs <em className="italic text-gold">cible</em>
      </h3>
      <p className="mt-2 text-[13px] leading-snug text-ink-muted">
        Le repère vertical = ta cible. La barre = ta position. Pio te dira si t&apos;es trop
        gourmand sur un pilier.
      </p>

      <div className="mt-[18px] flex flex-col gap-4">
        {reels.map((p) => {
          const key = p.pilier as Exclude<Pilier, "LIQUIDITE">;
          const Icon = ICONS[key];
          const over = p.allocationGap > 0;
          const deltaColor = over ? "text-gold" : "text-copper-bright";
          const fillColor = over ? "var(--pm-gold)" : "var(--pm-copper-bright)";

          return (
            <div key={p.pilier} className="grid grid-cols-[22px_72px_1fr_64px] items-center gap-3">
              <span className="grid place-items-center text-ink-soft">
                <Icon size={18} />
              </span>
              <span className="font-display text-[13px] font-semibold text-ink">
                {NAMES[key]}
              </span>
              <div className="relative h-1.5 overflow-hidden rounded-pill bg-surface-deep">
                <div
                  className="h-full rounded-pill transition-[width] duration-500"
                  style={{ width: `${Math.min(p.percentage, 100)}%`, background: fillColor }}
                />
                <div
                  className="absolute -top-[3px] h-3 w-0.5 rounded-[2px] bg-ink-soft"
                  style={{ left: `${Math.min(p.targetPercentage, 100)}%` }}
                />
              </div>
              <span className={`text-right font-mono text-[10px] tracking-[0.04em] ${deltaColor}`}>
                {p.allocationGap >= 0 ? "+ " : "− "}
                {Math.abs(p.allocationGap).toFixed(1).replace(".", ",")} pt
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
