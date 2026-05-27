"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react";
import type { Decision } from "@/types";

interface Props {
  initial: Decision[];
}

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
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Historique des stratégies</CardTitle>
            <CardDescription>
              Tes décisions stratégiques d&apos;investissement, dans l&apos;ordre chronologique.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowForm((v) => !v);
              setError("");
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex. Arbitrage PEA vers ETF World"
                  maxLength={500}
                  className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <div className="flex gap-2 justify-end">
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

        {/* Liste */}
        {initial.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucune décision enregistrée — commence à documenter ta stratégie.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {initial.map((d) => (
              <div
                key={d.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.date)}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {d.description}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={isPending && deletingId === d.id}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  {isPending && deletingId === d.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
