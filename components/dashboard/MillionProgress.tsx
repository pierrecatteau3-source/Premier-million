interface Props {
  /** Pourcentage parcouru (0–100). */
  percent: number;
}

export function MillionProgress({ percent }: Props) {
  const clamped = Math.max(0, Math.min(percent, 100));

  return (
    <div className="mt-6 grid grid-cols-[64px_1fr_80px] items-center gap-4 rounded-lg border border-border bg-surface px-6 py-5 md:grid-cols-[80px_1fr_90px] md:gap-5">
      <div className="font-sans text-[10px] uppercase leading-tight tracking-[0.16em] text-ink-muted">
        Vers le
        <br />
        million
      </div>

      <div>
        <div className="relative h-2.5 overflow-hidden rounded-pill border border-border bg-surface-deep">
          <div
            className="relative h-full rounded-pill"
            style={{
              width: `${Math.max(clamped, 0.5)}%`,
              background:
                "linear-gradient(90deg, var(--pm-gold-deep), var(--pm-gold) 50%, var(--pm-gold-bright))",
              boxShadow: "0 0 12px rgba(224,180,80,0.4)",
            }}
          >
            <span className="absolute inset-0 rounded-pill bg-gradient-to-b from-white/25 to-transparent to-50%" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex justify-between px-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="h-full w-px bg-[rgba(245,230,200,0.08)]" />
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex justify-between font-sans text-[9.5px] tracking-[0.1em] text-ink-dim">
          <span>0 €</span>
          <span>250 K</span>
          <span>500 K</span>
          <span>750 K</span>
          <span>1 000 000 €</span>
        </div>
      </div>

      <div className="text-right">
        <div className="font-display text-[22px] font-bold tracking-tight text-gold-bright">
          {clamped.toFixed(2).replace(".", ",")} %
        </div>
        <div className="mt-1 font-sans text-[9.5px] uppercase tracking-[0.12em] text-ink-muted">
          Parcouru
        </div>
      </div>
    </div>
  );
}
