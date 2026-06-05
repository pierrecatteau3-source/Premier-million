"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type KeyState = { configured: boolean; hint: string | null };

interface Props {
  initial: { xtb: KeyState; bitpanda: KeyState };
}

export function ApiKeysForm({ initial }: Props) {
  const [state, setState] = useState(initial);
  const [xtb, setXtb] = useState("");
  const [bitpanda, setBitpanda] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function patch(body: Record<string, string>): Promise<boolean> {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        setMsg({ kind: "err", text: json?.error ?? "Échec de l'enregistrement." });
        return false;
      }
      setState(json.data);
      return true;
    } catch {
      setMsg({ kind: "err", text: "Connexion impossible." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const body: Record<string, string> = {};
    if (xtb.trim()) body.xtbApiKey = xtb.trim();
    if (bitpanda.trim()) body.bitpandaApiKey = bitpanda.trim();
    if (Object.keys(body).length === 0) {
      setMsg({ kind: "err", text: "Saisis au moins une clé à enregistrer." });
      return;
    }
    if (await patch(body)) {
      setXtb("");
      setBitpanda("");
      setMsg({ kind: "ok", text: "Clés enregistrées." });
    }
  }

  async function handleClear(field: "xtbApiKey" | "bitpandaApiKey") {
    if (await patch({ [field]: "" })) {
      setMsg({ kind: "ok", text: "Clé supprimée." });
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Clés API courtiers</h2>
          <p className="text-xs text-muted-foreground">
            Enregistrées sur ton compte pour éviter une double saisie. Jamais réaffichées en clair.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <ProviderField
          label="XTB"
          placeholder="Colle ta clé API XTB"
          state={state.xtb}
          value={xtb}
          onChange={setXtb}
          onClear={() => handleClear("xtbApiKey")}
          disabled={saving}
        />
        <ProviderField
          label="BitPanda"
          placeholder="Colle ta clé API BitPanda"
          state={state.bitpanda}
          value={bitpanda}
          onChange={setBitpanda}
          onClear={() => handleClear("bitpandaApiKey")}
          disabled={saving}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        {msg && (
          <span
            className={
              msg.kind === "ok" ? "text-sm text-positive" : "text-sm text-destructive"
            }
          >
            {msg.text}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Ces clés sont stockées telles quelles en base (usage perso). Elles serviront à
        l&apos;import automatique de tes positions XTB / BitPanda.
      </p>
    </div>
  );
}

function ProviderField({
  label,
  placeholder,
  state,
  value,
  onChange,
  onClear,
  disabled,
}: {
  label: string;
  placeholder: string;
  state: KeyState;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        {state.configured ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-positive">
            <Check className="h-3.5 w-3.5" /> Enregistrée&nbsp;{state.hint}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Non renseignée</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            state.configured ? "Saisis une nouvelle clé pour la remplacer" : placeholder
          }
          autoComplete="off"
          disabled={disabled}
          className="flex-1 rounded-lg border border-border bg-[hsl(var(--muted))] px-3 py-2 text-sm outline-none transition-colors focus:border-gold/50 disabled:opacity-50"
        />
        {state.configured && (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label={`Supprimer la clé ${label}`}
            className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
