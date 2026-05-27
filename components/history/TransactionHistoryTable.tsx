"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionWithAsset } from "@/types/transactions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  transactions: TransactionWithAsset[];
}

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function isEditable(dateStr: string): boolean {
  const limiteDate = new Date();
  limiteDate.setMonth(limiteDate.getMonth() - 3);
  return new Date(dateStr) >= limiteDate;
}

interface EditState {
  id: string;
  quantite: string;
  prixEntreeEur: string;
}

export function TransactionHistoryTable({ transactions }: Props) {
  const router = useRouter();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string>("");

  function startEdit(t: TransactionWithAsset) {
    setEditState({
      id: t.id,
      quantite: t.quantite.toString(),
      prixEntreeEur: t.prixEntreeEur.toString(),
    });
    setError("");
  }

  function cancelEdit() {
    setEditState(null);
    setError("");
  }

  function getPreviewMontant(): number | null {
    if (!editState) return null;
    const q = parseFloat(editState.quantite.replace(",", "."));
    const p = parseFloat(editState.prixEntreeEur.replace(",", "."));
    if (isNaN(q) || isNaN(p) || q <= 0 || p <= 0) return null;
    return q * p;
  }

  async function saveEdit() {
    if (!editState) return;
    const quantite = parseFloat(editState.quantite.replace(",", "."));
    const prixEntreeEur = parseFloat(editState.prixEntreeEur.replace(",", "."));

    if (isNaN(quantite) || quantite <= 0 || isNaN(prixEntreeEur) || prixEntreeEur <= 0) {
      setError("Les valeurs doivent être des nombres positifs.");
      return;
    }

    setError("");

    try {
      const res = await fetch(`/api/transactions/${editState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantite, prixEntreeEur }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Erreur lors de la sauvegarde");
        return;
      }

      setEditState(null);
      setToast("Transaction mise à jour");
      setTimeout(() => setToast(""), 3000);
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun achat enregistré.</p>;
  }

  return (
    <TooltipProvider>
      {/* Toast */}
      {toast && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
          {toast}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
              <th className="py-2 text-left text-xs font-medium text-muted-foreground">Actif</th>
              <th className="py-2 text-left text-xs font-medium text-muted-foreground">Pilier</th>
              <th className="py-2 text-right text-xs font-medium text-muted-foreground">Quantité</th>
              <th className="py-2 text-right text-xs font-medium text-muted-foreground">Prix unitaire</th>
              <th className="py-2 text-right text-xs font-medium text-muted-foreground">Montant investi</th>
              <th className="py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const editable = isEditable(t.date);
              const isEditing = editState?.id === t.id;
              const previewMontant = isEditing ? getPreviewMontant() : null;

              return (
                <tr
                  key={t.id}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  {/* Date */}
                  <td className="py-2 tabular-nums text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("fr-FR")}
                  </td>

                  {/* Actif */}
                  <td className="py-2 font-medium">{t.asset.name}</td>

                  {/* Pilier */}
                  <td className="py-2 text-muted-foreground">{t.asset.pilier}</td>

                  {/* Quantité */}
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={editState.quantite}
                        onChange={(e) =>
                          setEditState((prev) =>
                            prev ? { ...prev, quantite: e.target.value } : prev
                          )
                        }
                        onKeyDown={handleKeyDown}
                        className={cn(
                          "w-28 rounded border bg-background px-2 py-0.5 text-sm tabular-nums text-right outline-none",
                          "focus:ring-2 focus:ring-ring focus:ring-offset-1",
                          error ? "border-destructive" : "border-input"
                        )}
                        autoFocus
                      />
                    ) : (
                      t.quantite.toLocaleString("fr-FR", { maximumFractionDigits: 6 })
                    )}
                  </td>

                  {/* Prix unitaire */}
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={editState.prixEntreeEur}
                        onChange={(e) =>
                          setEditState((prev) =>
                            prev ? { ...prev, prixEntreeEur: e.target.value } : prev
                          )
                        }
                        onKeyDown={handleKeyDown}
                        className={cn(
                          "w-28 rounded border bg-background px-2 py-0.5 text-sm tabular-nums text-right outline-none",
                          "focus:ring-2 focus:ring-ring focus:ring-offset-1",
                          error ? "border-destructive" : "border-input"
                        )}
                      />
                    ) : (
                      formatEur(t.prixEntreeEur)
                    )}
                  </td>

                  {/* Montant investi — recalculé en temps réel pendant l'édition */}
                  <td className="py-2 text-right tabular-nums font-medium">
                    {isEditing ? (
                      <span
                        className={cn(
                          "tabular-nums",
                          previewMontant !== null
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {previewMontant !== null ? formatEur(previewMontant) : "—"}
                      </span>
                    ) : (
                      formatEur(t.montantInvesti)
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 pl-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={saveEdit}
                          disabled={isPending}
                          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/20"
                          title="Valider"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                          title="Annuler"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {error && (
                          <span className="text-xs text-destructive">{error}</span>
                        )}
                      </div>
                    ) : editable ? (
                      <button
                        onClick={() => startEdit(t)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Modifier la transaction"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger className="inline-flex rounded p-1 text-muted-foreground/30 cursor-not-allowed">
                          <Pencil className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Modification impossible au-delà de 3 mois
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
