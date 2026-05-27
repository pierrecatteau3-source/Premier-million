"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  assetId: string;
  assetName: string;
  currentValue: number | undefined;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function InlineEdit({ assetId, assetName, currentValue }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue?.toString() ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue(currentValue?.toString() ?? "");
    setError("");
    setEditing(true);
    // Focus après le rendu
    setTimeout(() => inputRef.current?.select(), 10);
  }

  function cancel() {
    setEditing(false);
    setError("");
  }

  async function save() {
    const num = parseFloat(value.replace(",", "."));
    if (isNaN(num) || num < 0) {
      setError("Valeur invalide");
      return;
    }

    setError("");

    try {
      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          value: num,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        setError("Erreur lors de la sauvegarde");
        return;
      }

      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Erreur réseau");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        className="group flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-muted"
        title={`Modifier la valeur de ${assetName}`}
      >
        <span className="tabular-nums font-medium">
          {currentValue !== undefined ? formatEur(currentValue) : "—"}
        </span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min={0}
          step={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-28 rounded border bg-background px-2 py-0.5 text-sm tabular-nums outline-none",
            "focus:ring-2 focus:ring-ring focus:ring-offset-1",
            error ? "border-destructive" : "border-input"
          )}
          autoFocus
        />
        <button
          onClick={save}
          disabled={isPending}
          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
          title="Confirmer"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={cancel}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          title="Annuler"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
