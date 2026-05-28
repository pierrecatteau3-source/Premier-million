import { CoinStackDeco } from "@/components/icons";

interface Props {
  totalValue: number;
  monthlyChange: number;
  epargneMensuelle: number | null;
  targetAge: number | null;
  assetCount: number;
  pilierCount: number;
}

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
    {children}
  </div>
);

export function TreasureStrip({
  totalValue,
  monthlyChange,
  epargneMensuelle,
  targetAge,
  assetCount,
  pilierCount,
}: Props) {
  const up = monthlyChange >= 0;

  return (
    <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-[2fr_1fr_1fr]">
      {/* Patrimoine total */}
      <div
        className="relative px-6 py-6"
        style={{ background: "linear-gradient(135deg, var(--pm-surface) 0%, var(--pm-bg-deep) 100%)" }}
      >
        <Eyebrow>Mon trésor · patrimoine total</Eyebrow>
        <div
          className="mt-3.5 flex items-baseline gap-3.5 font-display text-[64px] font-bold leading-[0.9] tracking-[-0.045em] tabular-nums text-gold-bright sm:text-[80px] lg:text-[96px]"
          style={{ textShadow: "0 2px 24px rgba(224,180,80,0.18)" }}
        >
          {eur0(totalValue)}
          <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-gold-deep">
            EUR
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-3.5 font-mono text-[10.5px] tracking-[0.06em] text-ink-muted">
          <span className={up ? "text-positive" : "text-negative"}>
            {up ? "↑" : "↓"} {eur0(Math.abs(monthlyChange))} € période
          </span>
          <span>·</span>
          <span>
            {assetCount} actif{assetCount > 1 ? "s" : ""} · {pilierCount} pilier
            {pilierCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 opacity-85">
          <CoinStackDeco size={80} />
        </div>
      </div>

      {/* Épargne mensuelle */}
      <div className="bg-surface px-6 py-6">
        <Eyebrow>Épargne mensuelle</Eyebrow>
        <div className="mt-3.5 flex items-baseline gap-2.5 font-display text-[40px] font-bold leading-[0.95] tracking-[-0.035em] tabular-nums text-ink">
          {epargneMensuelle != null ? eur0(epargneMensuelle) : "—"}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            €/mois
          </span>
        </div>
        <div className="mt-3.5 font-mono text-[10.5px] tracking-[0.06em] text-ink-muted">
          Versement régulier
        </div>
      </div>

      {/* Objectif atteint à */}
      <div className="bg-surface px-6 py-6">
        <Eyebrow>Objectif atteint à</Eyebrow>
        <div className="mt-3.5 flex items-baseline gap-2.5 font-display text-[40px] font-bold leading-[0.95] tracking-[-0.035em] tabular-nums text-gold-bright">
          {targetAge != null ? targetAge : "—"}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            ans
          </span>
        </div>
        <div className="mt-3.5 font-mono text-[10.5px] tracking-[0.06em] text-ink-muted">
          Projection intérêts composés
        </div>
      </div>
    </div>
  );
}
