"use client";

import { CoinStackDeco } from "@/components/icons";
import type { PeriodDelta } from "@/lib/services/portfolio.service";

interface Props {
  totalValue: number;
  epargneMensuelle: number | null;
  targetAge: number | null;
  /** Âge actuel utilisé par la projection (dérivé de la date de naissance). */
  ageActuel: number | null;
  /** Taux de croissance annuel (%) utilisé par la projection. */
  tauxProjection: number;
  assetCount: number;
  pilierCount: number;
  delta: PeriodDelta;
  periodLabel: string;
}

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
    {children}
  </div>
);

export function TreasureStrip({
  totalValue,
  epargneMensuelle,
  targetAge,
  ageActuel,
  tauxProjection,
  assetCount,
  pilierCount,
  delta,
  periodLabel,
}: Props) {
  // Sous-texte de la tuile « Objectif atteint à » : affiche les paramètres
  // réellement utilisés par la projection — une donnée de profil manquante ou
  // périmée devient visible immédiatement au lieu de produire un chiffre opaque.
  const projectionFoot =
    targetAge != null && ageActuel != null
      ? `${String(tauxProjection).replace(".", ",")} %/an · de ${ageActuel} à ${targetAge} ans`
      : ageActuel == null
      ? "Renseigne ta date de naissance dans le Profil"
      : epargneMensuelle == null
      ? "Renseigne ton épargne mensuelle dans le Profil"
      : "Non atteint sous 60 ans à ce rythme";
  // Performance pure = variation de valeur hors apports (comme les phrases de Pio).
  // On ne compte PAS l'argent injecté comme de la performance.
  const up = delta.performance >= 0;

  return (
    <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-[2fr_1fr_1fr]">
      {/* Patrimoine total */}
      <div
        className="relative px-6 py-6"
        style={{ background: "linear-gradient(135deg, var(--pm-surface) 0%, var(--pm-bg-deep) 100%)" }}
      >
        <Eyebrow>Mon trésor · patrimoine total</Eyebrow>
        <div
          className="mt-3.5 flex flex-wrap items-baseline gap-3.5 font-display text-[clamp(40px,13vw,64px)] font-bold leading-[0.9] tracking-[-0.045em] tabular-nums text-gold-bright sm:text-[80px] lg:text-[96px]"
          style={{ textShadow: "0 2px 24px rgba(224,180,80,0.18)" }}
        >
          {eur0(totalValue)}
          <span className="font-sans text-[13px] uppercase tracking-[0.2em] text-gold-deep">
            EUR
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-3.5 font-sans text-[10.5px] tracking-[0.06em] text-ink-muted">
          <span className={up ? "text-positive" : "text-negative"}>
            {up ? "↑" : "↓"} {eur0(Math.abs(delta.performance))} € {periodLabel}
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
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            €/mois
          </span>
        </div>
        <div className="mt-3.5 font-sans text-[10.5px] tracking-[0.06em] text-ink-muted">
          Versement régulier
        </div>
      </div>

      {/* Objectif atteint à */}
      <div className="bg-surface px-6 py-6">
        <Eyebrow>Objectif atteint à</Eyebrow>
        <div className="mt-3.5 flex items-baseline gap-2.5 font-display text-[40px] font-bold leading-[0.95] tracking-[-0.035em] tabular-nums text-gold-bright">
          {targetAge != null ? targetAge : "—"}
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            ans
          </span>
        </div>
        <div className="mt-3.5 font-sans text-[10.5px] tracking-[0.06em] text-ink-muted">
          {projectionFoot}
        </div>
      </div>
    </div>
  );
}
