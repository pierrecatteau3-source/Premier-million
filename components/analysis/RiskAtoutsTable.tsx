"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

export interface RiskRow {
  pilier: string;
  label: string;
  /** Classe Tailwind de la pastille de couleur, ex. "bg-sky-500" */
  colorClass: string;
  /** Volatilité ajustée en pourcentage (ex. 18.0) */
  volAjusteePct: number;
  /** Valeur déjà formatée en euros (ex. "12 345 €") */
  valueLabel: string;
  /** Poids du pilier en pourcentage (ex. 54.2) */
  percentage: number;
  /** Contribution au score (ex. 8.10) */
  points: number;
}

interface Props {
  rows: RiskRow[];
  /** Score de risque total sur 10 */
  scoreTotal: number;
}

/** Volatilités de référence par classe d'actif (annuelles, modèle de risque). */
const VOL_REFERENCE = [
  { label: "PEA (Équités)", vol: "15 %", color: "#3b82f6", note: "Modérée" },
  { label: "Crypto", vol: "65 %", color: "#f97316", note: "Très haute" },
  { label: "Immobilier", vol: "8 %", color: "#22c55e", note: "Faible" },
  { label: "Autre (Épargne)", vol: "5 %", color: "#9ca3af", note: "Très faible" },
] as const;

export function RiskAtoutsTable({ rows, scoreTotal }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="py-2 text-left text-xs font-medium text-muted-foreground">Actif</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-foreground"
                title="Voir les volatilités de référence"
              >
                Vol. ajustée
                <Info className="h-3 w-3" />
              </button>
            </th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Valeur</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Poids</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.pilier}
              className="border-b border-border/30 transition-colors hover:bg-muted/20"
            >
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${r.colorClass}`} />
                  <span>{r.label}</span>
                </div>
              </td>
              <td className="py-2.5 text-right tabular-nums hidden sm:table-cell">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                  title="Voir les volatilités de référence"
                >
                  {r.volAjusteePct.toFixed(1)} %
                </button>
              </td>
              <td className="py-2.5 text-right tabular-nums">{r.valueLabel}</td>
              <td className="py-2.5 text-right tabular-nums font-medium">
                {r.percentage.toFixed(1)} %
              </td>
              <td className="py-2.5 text-right tabular-nums text-primary">
                {r.points.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border/50">
            <td colSpan={4} className="py-2 text-xs text-muted-foreground">
              Score total
            </td>
            <td className="py-2 text-right font-bold text-primary">{scoreTotal.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            {/* Panneau */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Volatilités de référence"
              className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border shadow-2xl"
              style={{ backgroundColor: "hsl(var(--popover))" }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-primary">
                    Volatilités de référence
                  </h2>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    Estimations annuelles utilisées par le modèle de risque. La « vol. ajustée »
                    du tableau pondère ces références selon votre allocation détaillée.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 px-5 py-4">
                {VOL_REFERENCE.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                    style={{ backgroundColor: "hsl(var(--card))" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{item.note}</span>
                      <span className="text-base font-bold tabular-nums">{item.vol}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
