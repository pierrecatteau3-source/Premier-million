"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { IconHistory } from "@/components/icons";
import type { Decision } from "@/types";

interface Props {
  initial: Decision[];
}

// Boîte d'icône dorée — cohérente avec ProfileForm et les PillarCards.
const goldIconBox: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(224,180,80,0.18), rgba(224,180,80,0.04))",
  borderColor: "var(--pm-rule-gold)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function DecisionList({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState("");

  function handleAdd() {
    setError("");
    if (!description.trim()) {
      setError("La description est requise.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date(date).toISOString(),
            description: description.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Erreur lors de l'ajout");
          return;
        }

        setDescription("");
        setDate(new Date().toISOString().substring(0, 10));
        setShowForm(false);
        router.refresh();
      } catch {
        setError("Erreur réseau — vérifie ta connexion.");
      }
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/decisions/${id}`, { method: "DELETE" });
        if (!res.ok) {
          setError("Erreur lors de la suppression");
        } else {
          router.refresh();
        }
      } catch {
        setError("Erreur réseau — vérifie ta connexion.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <section
      className="animate-fade-in rounded-lg border border-border bg-surface p-5 sm:p-6"
      style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border"
            style={goldIconBox}
          >
            <IconHistory size={24} className="text-gold" />
          </div>
          <div>
            <h3 className="font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
              Journal de bord
            </h3>
            <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Décisions stratégiques
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowForm((v) => !v);
            setError("");
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mb-5 animate-fade-in space-y-3 rounded-md border border-dashed border-border bg-surface-2/30 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-soft">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-ink-soft">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex. Arbitrage PEA vers ETF World"
                maxLength={500}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          {error && <p className="text-xs text-negative">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {/* Liste — timeline */}
      {initial.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-border bg-surface-2">
            <IconHistory size={28} className="text-ink-dim" />
          </div>
          <p className="text-sm text-ink-muted">
            Aucune décision enregistrée — documente ta première stratégie.
          </p>
        </div>
      ) : (
        <ol className="space-y-0">
          {initial.map((d, i) => {
            const isLast = i === initial.length - 1;
            const isDeleting = isPending && deletingId === d.id;
            return (
              <li key={d.id} className="group flex gap-4">
                {/* Rail */}
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold ring-4 ring-surface" />
                  {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-5">
                  <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                    {formatDate(d.date)}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink">
                    {d.description}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={isDeleting}
                  className="h-fit shrink-0 rounded p-1 text-ink-muted opacity-0 transition-all hover:text-negative group-hover:opacity-100 disabled:opacity-50"
                  title="Supprimer"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
