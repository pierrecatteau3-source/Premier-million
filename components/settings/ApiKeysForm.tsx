"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, DownloadCloud, KeyRound, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type KeyState = { configured: boolean; hint: string | null };

interface Props {
  initial: { bitpanda: KeyState };
}

export function ApiKeysForm({ initial }: Props) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [bitpanda, setBitpanda] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

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
    if (!bitpanda.trim()) {
      setMsg({ kind: "err", text: "Saisis une clé à enregistrer." });
      return;
    }
    if (await patch({ bitpandaApiKey: bitpanda.trim() })) {
      setBitpanda("");
      setMsg({ kind: "ok", text: "Clé enregistrée." });
    }
  }

  async function handleClear() {
    if (await patch({ bitpandaApiKey: "" })) {
      setMsg({ kind: "ok", text: "Clé supprimée." });
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/settings/bitpanda/import", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        setImportMsg({ kind: "err", text: json?.error ?? "Échec de l'import." });
        return;
      }
      const r = json.data as {
        imported: number;
        skipped: number;
        assetsCreated: number;
        ignored: number;
      };
      const parts: string[] = [
        `${r.imported} opération${r.imported > 1 ? "s" : ""} importée${r.imported > 1 ? "s" : ""}`,
      ];
      if (r.assetsCreated > 0) {
        parts.push(`${r.assetsCreated} actif${r.assetsCreated > 1 ? "s" : ""} créé${r.assetsCreated > 1 ? "s" : ""}`);
      }
      if (r.skipped > 0) parts.push(`${r.skipped} déjà importée${r.skipped > 1 ? "s" : ""}`);
      setImportMsg({ kind: "ok", text: parts.join(" · ") });
      router.refresh();
    } catch {
      setImportMsg({ kind: "err", text: "Connexion impossible." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
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
        <ComingSoonField
          label="XTB"
          note="XTB n'expose pas encore d'API publique. L'import automatique sera ajouté dès qu'elle sera disponible."
        />
        <ProviderField
          label="BitPanda"
          placeholder="Colle ta clé API BitPanda"
          state={state.bitpanda}
          value={bitpanda}
          onChange={setBitpanda}
          onClear={handleClear}
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
        La clé est stockée telle quelle en base (usage perso). Elle sert à
        l&apos;import de tes opérations BitPanda ci-dessous.
      </p>
    </div>

    {state.bitpanda.configured && (
      <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <DownloadCloud className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Import BitPanda</h2>
            <p className="text-xs text-muted-foreground">
              Récupère tes achats et plans d&apos;épargne (investissements automatiques inclus) et
              les ajoute au portefeuille et à l&apos;historique. Tes saisies manuelles sont
              conservées, et relancer l&apos;import ne crée pas de doublon.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleImport} disabled={importing} variant="outline">
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="mr-2 h-4 w-4" />
            )}
            Importer mes opérations
          </Button>
          {importMsg && (
            <span
              className={
                importMsg.kind === "ok" ? "text-sm text-positive" : "text-sm text-destructive"
              }
            >
              {importMsg.text}
            </span>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function ComingSoonField({ label, note }: { label: string; note: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">
          <Clock className="h-3.5 w-3.5" /> Arrive bientôt
        </span>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-[hsl(var(--muted))]/40 px-3 py-2 text-sm text-muted-foreground">
        {note}
      </div>
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
