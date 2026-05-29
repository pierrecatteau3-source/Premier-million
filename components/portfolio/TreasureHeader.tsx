interface Props {
  totalValue: number;
  investi: number;
  pnl: number;
  perfPct: number | null;
  monthlyChange: number;
  monthlyChangePercent: number;
  assetCount: number;
}

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

export function TreasureHeader({
  totalValue,
  investi,
  pnl,
  perfPct,
  monthlyChange,
  monthlyChangePercent,
  assetCount,
}: Props) {
  const up = monthlyChange >= 0;
  const pnlUp = pnl >= 0;

  return (
    <section className="mt-4 grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
      <div
        className="rounded-lg border border-border px-7 py-7"
        style={{
          background:
            "radial-gradient(circle at 85% 20%, rgba(224,180,80,0.08), transparent 55%), linear-gradient(135deg, var(--pm-surface) 0%, var(--pm-bg-deep) 100%)",
        }}
      >
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
          Valeur du trésor · {assetCount} actif{assetCount > 1 ? "s" : ""}
        </div>
        <div
          className="mt-3.5 flex items-baseline gap-3 font-display text-[56px] font-bold leading-[0.9] tracking-[-0.045em] tabular-nums text-gold-bright sm:text-[72px] lg:text-[84px]"
          style={{ textShadow: "0 2px 24px rgba(224,180,80,0.18)" }}
        >
          {eur0(totalValue)}
          <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-gold-deep">
            EUR
          </span>
        </div>
        <div className="mt-[18px] flex flex-wrap items-center gap-3.5 font-mono text-[10.5px] tracking-[0.06em] text-ink-muted">
          <span className={up ? "text-positive" : "text-negative"}>
            {up ? "+ " : "− "}
            {eur0(Math.abs(monthlyChange))} € · {up ? "+" : "−"}
            {Math.abs(monthlyChangePercent).toFixed(1).replace(".", ",")} % sur la période
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-0 rounded-lg border border-border bg-surface px-6 py-2">
        <Row label="Investi" value={`${eur0(investi)} €`} />
        <Row
          label="P&L latent"
          value={`${pnlUp ? "+ " : "− "}${eur0(Math.abs(pnl))} €`}
          valueClass={pnlUp ? "text-positive" : "text-negative"}
        />
        <Row
          label="Performance"
          value={
            perfPct != null
              ? `${perfPct >= 0 ? "+ " : "− "}${Math.abs(perfPct).toFixed(1).replace(".", ",")} %`
              : "—"
          }
          valueClass="text-gold-bright"
          last
        />
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  valueClass,
  last,
}: {
  label: string;
  value: string;
  valueClass?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between py-3.5 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
      <span className={`font-display text-[20px] font-bold tabular-nums text-ink ${valueClass ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
