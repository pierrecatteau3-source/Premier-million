"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type {
  DashboardDeltas,
  DashboardPeriodKey,
} from "@/lib/services/portfolio.service";

interface Props {
  totalValue: number;
  capRestant: number;
  targetAge: number | null;
  assetCount: number;
  pilierCount: number;
  deltas: DashboardDeltas;
  periodKey: DashboardPeriodKey;
  onPeriodChange: (k: DashboardPeriodKey) => void;
}

const PERIOD_OPTIONS: { key: DashboardPeriodKey; label: string; eyebrow: string }[] = [
  { key: "day", label: "1 jour", eyebrow: "ce matin" },
  { key: "week", label: "1 semaine", eyebrow: "cette semaine" },
  { key: "month", label: "1 mois", eyebrow: "ce mois ci" },
  { key: "year", label: "1 an", eyebrow: "cette année" },
];

const PERIOD_PHRASE: Record<DashboardPeriodKey, string> = {
  day: "ce matin",
  week: "cette semaine",
  month: "ce mois ci",
  year: "cette année",
};

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

export function PioHero({
  totalValue,
  capRestant,
  targetAge,
  deltas,
  periodKey,
  onPeriodChange,
}: Props) {
  const delta = deltas[periodKey];
  const phrase = PERIOD_PHRASE[periodKey];
  const up = delta.eur >= 0;
  const sign = up ? "+ " : "− ";

  return (
    <section className="grid gap-6 lg:grid-cols-[200px_1fr_auto] lg:gap-9">
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
        <span className="absolute right-3 top-3 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          Niv. 4
        </span>
        <Image
          src="/character/pio-avatar.png"
          alt="Pio"
          width={180}
          height={180}
          priority
          className="object-contain"
        />
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
        <span className="mb-3 block font-sans text-[9.5px] font-medium uppercase tracking-[0.22em] text-gold">
          Pio · récap depuis ta dernière visite
        </span>
        Salut chef ! Le trésor a fait{" "}
        <strong className="font-semibold text-gold-bright">
          {sign}
          {eur0(Math.abs(delta.eur))} €
        </strong>{" "}
        {phrase}, on est à{" "}
        <strong className="font-semibold text-gold-bright">{eur0(totalValue)} €</strong>. On
        construit, pièce par pièce.
        <span className="mt-2.5 block text-[14px] italic text-ink-muted">
          {targetAge != null
            ? `« À ce rythme, millionnaire à ${targetAge} ans. Soit demain si tu gagnes au Loto. Je dis ça, je dis rien. »`
            : "« Renseigne ton âge et ton épargne, et je te dis quand on touche le million. »"}
        </span>
        <div className="mt-[18px] flex flex-wrap items-center gap-4 border-t border-dashed border-border pt-3.5 font-sans text-[10px] tracking-[0.06em] text-ink-muted">
          <span className={up ? "text-positive" : "text-negative"}>
            {sign}
            {delta.pct.toFixed(1).replace(".", ",")} % {phrase}
          </span>
          <span>·</span>
          <span>
            Cap restant : <span className="text-gold-bright">{eur0(capRestant)} €</span>
          </span>
        </div>
      </div>

      {/* Toggle période */}
      <div
        className="flex h-fit flex-col gap-1 rounded-lg border p-2 lg:self-start"
        style={{ background: "var(--pm-surface)", borderColor: "var(--pm-rule-strong)" }}
        role="radiogroup"
        aria-label="Période d'analyse"
      >
        <span className="px-2 pb-1 pt-0.5 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Période
        </span>
        {PERIOD_OPTIONS.map((opt) => {
          const active = opt.key === periodKey;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPeriodChange(opt.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left font-sans text-[11px] uppercase tracking-[0.12em] transition-colors",
                active
                  ? "bg-gold/15 text-gold-bright"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
