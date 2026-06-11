"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Trash2, Play, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecurringInvestment } from "@/types";

const FREQ_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

interface Props {
  initialData: RecurringInvestment[];
  assets: { id: string; name: string; pilier: string }[];
}

function formatQty(v: number) {
  // Affiche jusqu'à 6 décimales significatives sans zéros inutiles
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(v);
}

interface EditState {
  id: string;
  amount: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek: string;
  dayOfMonth: string;
}

export function RecurringInvestments({ initialData, assets }: Props) {
  const router = useRouter();
  const [list, setList] = useState<RecurringInvestment[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Form state
  const [formAssetId, setFormAssetId] = useState(assets[0]?.id ?? "");
  const [formAmount, setFormAmount] = useState("");
  const [formFrequency, setFormFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [formDayOfWeek, setFormDayOfWeek] = useState<string>("0");
  const [formDayOfMonth, setFormDayOfMonth] = useState<string>("1");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function openEdit(r: RecurringInvestment) {
    setEditState({
      id: r.id,
      amount: String(r.amount),
      frequency: r.frequency,
      dayOfWeek: r.dayOfWeek != null ? String(r.dayOfWeek) : "0",
      dayOfMonth: r.dayOfMonth != null ? String(r.dayOfMonth) : "1",
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditState(null);
    setEditError("");
  }

  async function handleEdit() {
    if (!editState) return;
    const amount = parseFloat(editState.amount);
    if (isNaN(amount) || amount <= 0) {
      setEditError("Montant invalide.");
      return;
    }
    setEditError("");
    setEditLoading(true);
    try {
      const body: Record<string, unknown> = {
        amount,
        frequency: editState.frequency,
      };
      if (editState.frequency === "weekly") {
        body.dayOfWeek = parseInt(editState.dayOfWeek);
        body.dayOfMonth = null;
      } else if (editState.frequency === "monthly") {
        body.dayOfMonth = parseInt(editState.dayOfMonth);
        body.dayOfWeek = null;
      } else {
        body.dayOfWeek = null;
        body.dayOfMonth = null;
      }

      const res = await fetch(`/api/recurring-investments/${editState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { data?: RecurringInvestment; error?: string };
      if (!res.ok) {
        setEditError(json.error ?? "Erreur lors de la modification");
        return;
      }
      if (json.data) {
        setList((prev) => prev.map((r) => (r.id === editState.id ? json.data! : r)));
      }
      setEditState(null);
      showToast("Investissement automatique mis à jour");
      router.refresh();
    } catch {
      setEditError("Erreur réseau.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleExecute(id: string) {
    setExecutingId(id);
    try {
      const res = await fetch(`/api/recurring-investments/${id}/execute`, {
        method: "POST",
      });
      const json = await res.json() as {
        prixUtilise?: number;
        quantite?: number;
        error?: string;
      };
      if (!res.ok) {
        showToast(json.error ?? "Erreur lors de l'exécution");
        return;
      }
      const qty = json.quantite != null ? formatQty(json.quantite) : "?";
      const price = json.prixUtilise != null
        ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 4 }).format(json.prixUtilise)
        : "?";
      showToast(`Achat de ${qty} unités à ${price} enregistré`);
      router.refresh();
    } catch {
      showToast("Erreur réseau.");
    } finally {
      setExecutingId(null);
    }
  }

  async function handleCreate() {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Montant invalide.");
      return;
    }
    if (!formAssetId) {
      setError("Sélectionne un actif.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        assetId: formAssetId,
        amount,
        frequency: formFrequency,
      };
      if (formFrequency === "weekly") body.dayOfWeek = parseInt(formDayOfWeek);
      if (formFrequency === "monthly") body.dayOfMonth = parseInt(formDayOfMonth);

      const res = await fetch("/api/recurring-investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de la création");
        return;
      }
      setList((prev) => [json.data, ...prev]);
      setShowForm(false);
      setFormAmount("");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    // Optimistic update
    setList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active } : r))
    );
    try {
      const res = await fetch(`/api/recurring-investments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        // Revert
        setList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active: !active } : r))
        );
      }
    } catch {
      setList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: !active } : r))
      );
    }
  }

  async function handleDelete(id: string) {
    // Optimistic update
    const prev = list;
    setList((l) => l.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/recurring-investments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setList(prev);
      }
    } catch {
      setList(prev);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground px-5 py-3 text-sm text-background shadow-lg animate-in fade-in slide-in-from-bottom-2 md:bottom-6">
          {toast}
        </div>
      )}

      {list.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun investissement automatique configuré.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un investissement automatique
          </button>
        </div>
      ) : (
        <>
          {/* Liste */}
          <div className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className="space-y-0">
                <div
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {FREQ_LABELS[r.frequency] ?? r.frequency} · {r.asset.pilier}
                      {r.frequency === "weekly" && r.dayOfWeek != null
                        ? ` · ${DAYS[r.dayOfWeek]}`
                        : ""}
                      {r.frequency === "monthly" && r.dayOfMonth != null
                        ? ` · jour ${r.dayOfMonth}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0">
                    {formatEur(r.amount)}
                  </span>
                  {/* Bouton Modifier */}
                  <button
                    onClick={() => editState?.id === r.id ? cancelEdit() : openEdit(r)}
                    className={cn(
                      "shrink-0 rounded p-1 transition-colors",
                      editState?.id === r.id
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    )}
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {/* Exécuter maintenant */}
                  {r.active && (
                    <button
                      onClick={() => handleExecute(r.id)}
                      disabled={executingId === r.id}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                      title="Exécuter maintenant"
                    >
                      <Play className="h-3 w-3" />
                      {executingId === r.id ? "…" : "Exécuter"}
                    </button>
                  )}
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(r.id, !r.active)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      r.active ? "bg-primary" : "bg-muted"
                    )}
                    title={r.active ? "Désactiver" : "Activer"}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                        r.active ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Formulaire d'édition inline */}
                {editState?.id === r.id && (
                  <div className="rounded-b-xl border border-t-0 border-border bg-muted/20 px-4 py-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Modifier l&apos;investissement
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Montant (€)</label>
                        <input
                          type="number"
                          value={editState.amount}
                          onChange={(e) => setEditState((s) => s ? { ...s, amount: e.target.value } : s)}
                          min={1}
                          step={10}
                          className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Fréquence</label>
                        <select
                          value={editState.frequency}
                          onChange={(e) =>
                            setEditState((s) => s ? { ...s, frequency: e.target.value as "daily" | "weekly" | "monthly" } : s)
                          }
                          className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        >
                          <option value="daily">Quotidien</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuel</option>
                        </select>
                      </div>
                      {editState.frequency === "weekly" && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Jour de la semaine</label>
                          <select
                            value={editState.dayOfWeek}
                            onChange={(e) => setEditState((s) => s ? { ...s, dayOfWeek: e.target.value } : s)}
                            className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          >
                            {DAYS.map((d, i) => (
                              <option key={i} value={i}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {editState.frequency === "monthly" && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Jour du mois (1–28)</label>
                          <input
                            type="number"
                            value={editState.dayOfMonth}
                            onChange={(e) => setEditState((s) => s ? { ...s, dayOfMonth: e.target.value } : s)}
                            min={1}
                            max={28}
                            className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          />
                        </div>
                      )}
                    </div>
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Annuler
                      </button>
                      <button
                        onClick={handleEdit}
                        disabled={editLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {editLoading ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bouton ajout */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un investissement automatique
            </button>
          )}
        </>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Nouvel investissement automatique</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Actif</label>
              <select
                value={formAssetId}
                onChange={(e) => setFormAssetId(e.target.value)}
                className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.pilier})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Montant (€)</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="ex. 200"
                min={1}
                step={10}
                className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fréquence</label>
              <select
                value={formFrequency}
                onChange={(e) =>
                  setFormFrequency(e.target.value as "daily" | "weekly" | "monthly")
                }
                className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>

            {formFrequency === "weekly" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Jour de la semaine</label>
                <select
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(e.target.value)}
                  className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formFrequency === "monthly" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Jour du mois (1–28)</label>
                <input
                  type="number"
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(e.target.value)}
                  min={1}
                  max={28}
                  className="h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : "Créer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
