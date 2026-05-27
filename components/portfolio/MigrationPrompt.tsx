"use client";
import { useState, useEffect } from "react";

interface AssetToMigrate {
  id: string;
  name: string;
  ticker: string | null;
  oldestSnapshotDate: string | null;
}

const MIGRATION_KEY = "pm_migration_done_v1";

export function MigrationPrompt() {
  const [assets, setAssets] = useState<AssetToMigrate[]>([]);
  const [values, setValues] = useState<Record<string, { quantite: string; prixEntree: string }>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(MIGRATION_KEY)) {
      setDone(true);
      return;
    }
    // Fetch assets needing migration from a dedicated endpoint
    fetch("/api/assets?needsMigration=true")
      .then((r) => r.json())
      .then((j: { data?: AssetToMigrate[] }) => {
        const list = j.data ?? [];
        setAssets(list);
        const init: Record<string, { quantite: string; prixEntree: string }> = {};
        for (const a of list) init[a.id] = { quantite: "", prixEntree: "" };
        setValues(init);
      })
      .catch(() => setDone(true));
  }, []);

  if (done || assets.length === 0) return null;

  async function handleSave(asset: AssetToMigrate) {
    const v = values[asset.id];
    if (!v?.quantite || !v?.prixEntree) return;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.id,
        date: asset.oldestSnapshotDate ?? new Date().toISOString(),
        quantite: parseFloat(v.quantite),
        prixEntreeEur: parseFloat(v.prixEntree),
        source: "manuel",
        note: "Migration depuis valeur manuelle",
      }),
    });
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (assets.length <= 1) {
      localStorage.setItem(MIGRATION_KEY, "true");
      setDone(true);
    }
  }

  async function handleIgnore(asset: AssetToMigrate) {
    await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricingMode: "manual" }),
    });
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (assets.length <= 1) {
      localStorage.setItem(MIGRATION_KEY, "true");
      setDone(true);
    }
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-4 mb-6">
      <p className="text-sm font-semibold text-orange-500">
        Migration requise — Certains actifs en mode prix live n&apos;ont pas d&apos;historique d&apos;achat.
      </p>
      {assets.map((asset) => (
        <div key={asset.id} className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <p className="text-sm font-medium">{asset.name}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Quantité totale</label>
              <input
                type="number" min="0" step="any"
                value={values[asset.id]?.quantite ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [asset.id]: { ...v[asset.id], quantite: e.target.value } }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Prix moyen d&apos;entrée (€)</label>
              <input
                type="number" min="0" step="any"
                value={values[asset.id]?.prixEntree ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [asset.id]: { ...v[asset.id], prixEntree: e.target.value } }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(asset)}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Enregistrer
            </button>
            <button
              onClick={() => handleIgnore(asset)}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/40"
            >
              Ignorer (garder en manuel)
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
