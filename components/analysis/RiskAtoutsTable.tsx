"use client";

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Une ligne de composition (sous-type) derrière la volatilité ajustée d'un pilier. */
export interface VolLine {
  subtype: string;
  /** Poids relatif du sous-type dans le pilier (%) */
  weightPct: number;
  /** Volatilité de référence du sous-type (%) */
  volPct: number;
}

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
  /** Composition de la vol. ajustée (vide si allocation détaillée non renseignée) */
  breakdown: VolLine[];
  /** Volatilité par défaut du pilier (%) — non-null seulement si breakdown vide */
  fallbackVolPct: number | null;
  /** Pénalité de concentration sectorielle PEA (×1.20) appliquée */
  concentrationPenalty: boolean;
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
  const [open, setOpen] = useState(false); // pop-up "Volatilités de référence" (via le « i »)
  const [expanded, setExpanded] = useState<string | null>(null); // ligne dépliée

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggleRow = (pilier: string) =>
    setExpanded((cur) => (cur === pilier ? null : pilier));

  return (
    <div className="flex-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="py-2 text-left text-xs font-medium text-muted-foreground">Actif</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">
              <span className="ml-auto inline-flex items-center justify-end gap-1">
                Vol. ajustée
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  title="Volatilités de référence par classe d'actif"
                  aria-label="Volatilités de référence"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </span>
            </th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Valeur</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Poids</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isOpen = expanded === r.pilier;
            return (
              <Fragment key={r.pilier}>
                <tr
                  onClick={() => toggleRow(r.pilier)}
                  aria-expanded={isOpen}
                  className="cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/20"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                      <span className={`h-2 w-2 rounded-full ${r.colorClass}`} />
                      <span>{r.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums hidden sm:table-cell">
                    {r.volAjusteePct.toFixed(1)} %
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{r.valueLabel}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">
                    {r.percentage.toFixed(1)} %
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-primary">
                    {r.points.toFixed(2)}
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-b border-border/30">
                    <td colSpan={5} className="bg-muted/10 p-0">
                      <div className="space-y-2 px-3 py-3 sm:px-9">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          Composition de la volatilité ajustée
                        </p>

                        {r.breakdown.length > 0 ? (
                          <>
                            <div className="space-y-1">
                              {r.breakdown.map((b) => (
                                <div
                                  key={b.subtype}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <span className="min-w-0 truncate text-foreground/90">
                                    {b.subtype}
                                  </span>
                                  <span className="flex shrink-0 items-center gap-3 tabular-nums text-muted-foreground">
                                    <span>poids {b.weightPct.toFixed(0)} %</span>
                                    <span className="text-foreground">
                                      vol. réf. {b.volPct.toFixed(1)} %
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>

                            {r.concentrationPenalty && (
                              <p className="text-[11px] text-amber-500">
                                + pénalité de concentration sectorielle ×1,20 (une ligne &gt; 50 %
                                du pilier)
                              </p>
                            )}

                            <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-xs font-medium">
                              <span>Vol. ajustée pondérée</span>
                              <span className="tabular-nums text-primary">
                                {r.volAjusteePct.toFixed(1)} %
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Allocation détaillée non renseignée — volatilité par défaut du pilier&nbsp;:{" "}
                            <span className="font-medium text-foreground">
                              {(r.fallbackVolPct ?? 0).toFixed(1)} %
                            </span>
                            .
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
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
                    Estimations annuelles par classe d&apos;actif utilisées par le modèle. La
                    « vol. ajustée » de chaque ligne pondère ces références selon votre allocation
                    détaillée (clique une ligne pour voir le détail).
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
