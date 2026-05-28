import { AvatarPio } from "@/components/icons";

interface Props {
  totalValue: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  capRestant: number;
  targetAge: number | null;
  assetCount: number;
  pilierCount: number;
}

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

export function PioHero({
  totalValue,
  monthlyChange,
  monthlyChangePercent,
  capRestant,
  targetAge,
}: Props) {
  const up = monthlyChange >= 0;
  const sign = up ? "+ " : "− ";

  return (
    <section className="mt-7 grid gap-9 lg:grid-cols-[200px_1fr]">
      {/* Avatar Pio */}
      <div
        className="relative grid h-[200px] place-items-center overflow-hidden rounded-lg border"
        style={{
          background: "radial-gradient(circle at 30% 25%, var(--pm-surface-3), var(--pm-surface))",
          borderColor: "var(--pm-rule-strong)",
        }}
      >
        <span className="absolute left-3 top-3 font-display text-[13px] font-bold tracking-tight text-gold-bright">
          Pio
        </span>
        <span className="absolute right-3 top-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          Niv. 4
        </span>
        <AvatarPio size={150} />
      </div>

      {/* Bulle BD */}
      <div
        className="relative rounded-lg border px-7 py-6 font-display text-[17px] leading-[1.45] tracking-[-0.012em] text-ink"
        style={{ background: "var(--pm-surface)", borderColor: "var(--pm-rule-strong)" }}
      >
        <span
          className="absolute left-[-9px] top-7 h-[18px] w-[18px] rotate-45 border-b border-l"
          style={{ background: "var(--pm-surface)", borderColor: "var(--pm-rule-strong)" }}
        />
        <span className="mb-3 block font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-gold">
          Pio · récap depuis ta dernière visite
        </span>
        Salut chef ! Le trésor a fait{" "}
        <strong className="font-semibold text-gold-bright">
          {sign}
          {eur0(Math.abs(monthlyChange))} €
        </strong>{" "}
        sur la période, on est à{" "}
        <strong className="font-semibold text-gold-bright">{eur0(totalValue)} €</strong>. On
        construit, pièce par pièce.
        <span className="mt-2.5 block text-[14px] italic text-ink-muted">
          {targetAge != null
            ? `« À ce rythme, millionnaire à ${targetAge} ans. Soit demain si tu gagnes au Loto. Je dis ça, je dis rien. »`
            : "« Renseigne ton âge et ton épargne, et je te dis quand on touche le million. »"}
        </span>
        <div className="mt-[18px] flex flex-wrap items-center gap-4 border-t border-dashed border-border pt-3.5 font-mono text-[10px] tracking-[0.06em] text-ink-muted">
          <span className={up ? "text-positive" : "text-negative"}>
            {sign}
            {monthlyChangePercent.toFixed(1).replace(".", ",")} % période
          </span>
          <span>·</span>
          <span>
            Cap restant : <span className="text-gold-bright">{eur0(capRestant)} €</span>
          </span>
        </div>
      </div>
    </section>
  );
}
