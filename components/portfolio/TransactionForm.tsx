"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Transaction, CreateTransactionInput } from "@/types/transactions";
import type { PriceData } from "@/types/prices";

interface Props {
  assetId: string;
  assetName: string;
  priceData?: PriceData | null;
  onClose?: () => void;
  /** Appelé après la création d'une transaction pour rafraîchir les métriques PnL */
  onSaved?: () => void;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(v);
}

export function TransactionForm({ assetId, assetName, priceData, onClose, onSaved }: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Omit<CreateTransactionInput, "assetId">>({
    date: new Date().toISOString().slice(0, 10),
    quantite: 0,
    prixEntreeEur: 0,
    source: "manuel",
  });

  const montantInvesti = form.quantite * form.prixEntreeEur;

  useEffect(() => {
    fetch(`/api/transactions?assetId=${assetId}`)
      .then((r) => r.json())
      .then((j: { data: Transaction[] }) => setTransactions(j.data ?? []))
      .finally(() => setLoading(false));
  }, [assetId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, ...form }),
      });
      if (res.ok) {
        const json = await res.json() as { data: Transaction };
        setTransactions((prev) => [json.data, ...prev]);
        setForm({ date: new Date().toISOString().slice(0, 10), quantite: 0, prixEntreeEur: 0, source: "manuel" });
        // Rafraîchit les métriques PnL côté serveur
        onSaved?.();
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    // Rafraîchit les métriques PnL côté serveur
    router.refresh();
  }

  const quantiteTotal = transactions.reduce((s, t) => s + t.quantite, 0);
  const investiTotal = transactions.reduce((s, t) => s + t.montantInvesti, 0);

  return (
    <div className="space-y-6 p-1">
      <div>
        <h3 className="font-semibold text-sm mb-1">{assetName}</h3>
        {quantiteTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            Quantité totale : {quantiteTotal.toLocaleString("fr-FR")} · Investi : {formatEur(investiTotal)}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as "manuel" | "virement_auto" }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="manuel">Manuel</option>
              <option value="virement_auto">Virement auto</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Quantité</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.quantite || ""}
              onChange={(e) => setForm((f) => ({ ...f, quantite: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Prix d&apos;entrée (€/unité)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.prixEntreeEur || ""}
              onChange={(e) => setForm((f) => ({ ...f, prixEntreeEur: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
        {montantInvesti > 0 && (
          <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
            Montant investi : <span className="font-semibold text-foreground">{formatEur(montantInvesti)}</span>
          </p>
        )}
        <input
          type="text"
          placeholder="Note (optionnel)"
          value={form.note ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting || form.quantite <= 0 || form.prixEntreeEur <= 0}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Enregistrement…" : "Ajouter l'achat"}
        </button>
      </form>

      {/* Transaction list */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : transactions.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Historique</p>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="py-2 px-3 text-left text-muted-foreground font-medium">Date</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">Qté</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">Prix</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">Montant</th>
                  {priceData?.price != null && (
                    <th className="py-2 px-3 text-right text-muted-foreground font-medium">PnL</th>
                  )}
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const valAct = priceData?.price != null ? t.quantite * priceData.price : null;
                  const pnl = valAct != null ? valAct - t.montantInvesti : null;
                  return (
                    <tr key={t.id} className="border-t border-border/30">
                      <td className="py-2 px-3">{new Date(t.date).toLocaleDateString("fr-FR")}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{t.quantite.toLocaleString("fr-FR")}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatEur(t.prixEntreeEur)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatEur(t.montantInvesti)}</td>
                      {priceData?.price != null && (
                        <td className={`py-2 px-3 text-right tabular-nums font-medium ${pnl != null && pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {pnl != null ? (pnl >= 0 ? "+" : "") + formatEur(pnl) : "—"}
                        </td>
                      )}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Supprimer cette transaction"
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {onClose && (
        <button onClick={onClose} className="w-full rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40">
          Fermer
        </button>
      )}
    </div>
  );
}
