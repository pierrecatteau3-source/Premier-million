"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  PenLine,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { PILIER_LABEL, PILIER_COLOR } from "@/types";
import { cn } from "@/lib/utils";
import type { PilierSummary } from "@/types";
import { ALLOCATION_TYPES, TYPE_TO_PILIER } from "@/lib/constants/allocation-types";
import { AssetPriceRow } from "@/components/portfolio/AssetPriceRow";
import { TransactionForm } from "@/components/portfolio/TransactionForm";
import { MigrationPrompt } from "@/components/portfolio/MigrationPrompt";
import type { PriceMap } from "@/types/prices";

interface Props {
  piliers: PilierSummary[];
  priceMap?: PriceMap;
}

const inputCls =
  "w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

function formatEur(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number | null | undefined) {
  if (value == null) return null;
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} %`;
}

function formatDateShort(iso: string | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(iso));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export function AssetManager({ piliers, priceMap = {} }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Ajouter un actif ─────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(ALLOCATION_TYPES[0].type);
  const [newSubtype, setNewSubtype] = useState<string>(ALLOCATION_TYPES[0].subtypes[0]);
  const [addError, setAddError] = useState("");

  function handleAddAsset() {
    if (!newName.trim()) {
      setAddError("Le nom est obligatoire.");
      return;
    }
    setAddError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName.trim(),
            pilier: TYPE_TO_PILIER[newType] ?? "AUTRE",
            type: newSubtype,
          }),
        });
        if (!res.ok) {
          const j = await res.json();
          setAddError(j.error ?? "Erreur lors de la création.");
          return;
        }
        setNewName("");
        setNewType(ALLOCATION_TYPES[0].type);
        setNewSubtype(ALLOCATION_TYPES[0].subtypes[0]);
        setShowAddForm(false);
        router.refresh();
      } catch {
        setAddError("Erreur réseau.");
      }
    });
  }

  // ── Snapshot par actif ───────────────────────────────────────
  const [snapshotOpen, setSnapshotOpen] = useState<string | null>(null);
  const [snapshotValue, setSnapshotValue] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(today());
  const [snapshotError, setSnapshotError] = useState("");

  function openSnapshot(assetId: string, currentValue?: number) {
    setSnapshotOpen(assetId);
    setSnapshotValue(currentValue != null ? String(currentValue) : "");
    setSnapshotDate(today());
    setSnapshotError("");
  }

  function handleSaveSnapshot(assetId: string) {
    const val = parseFloat(snapshotValue);
    if (isNaN(val) || val < 0) {
      setSnapshotError("Valeur invalide.");
      return;
    }
    setSnapshotError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/snapshots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId, value: val, date: snapshotDate }),
        });
        if (!res.ok) {
          const j = await res.json();
          setSnapshotError(j.error ?? "Erreur lors de la saisie.");
          return;
        }
        setSnapshotOpen(null);
        router.refresh();
      } catch {
        setSnapshotError("Erreur réseau.");
      }
    });
  }

  // ── Filtre et tri ─────────────────────────────────────────────
  type SortBy = "value_desc" | "value_asc" | "name_asc" | "name_desc" | "pilier";
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("value_desc");
  const [filterPilier, setFilterPilier] = useState("all");

  // ── Supprimer un actif ───────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Edit mode (ticker / pricingMode) ─────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTicker, setEditTicker] = useState("");
  const [editPricingMode, setEditPricingMode] = useState("manual");

  // ── Transaction form expansion ───────────────────────────────
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  function handleDelete(assetId: string) {
    if (!confirm("Supprimer cet actif et tous ses snapshots ?")) return;
    setDeletingId(assetId);
    startTransition(async () => {
      try {
        await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    });
  }

  function openEdit(assetId: string, ticker: string | null | undefined, pricingMode: string | undefined) {
    setEditingId(assetId);
    setEditTicker(ticker ?? "");
    setEditPricingMode(pricingMode ?? "manual");
    setSnapshotOpen(null);
  }

  function handleSaveEdit(assetId: string) {
    startTransition(async () => {
      try {
        await fetch(`/api/assets/${assetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: editTicker || null, pricingMode: editPricingMode }),
        });
        setEditingId(null);
        router.refresh();
      } catch {
        // silently fail
      }
    });
  }

  const allAssets = piliers.flatMap((p) =>
    p.assets.map((a) => ({
      ...a,
      pilier: p.pilier,
      ticker: a.ticker ?? null,
      pricingMode: a.pricingMode ?? "manual",
    }))
  );
  const total = piliers.reduce((s, p) => s + p.totalValue, 0);

  const displayedAssets = allAssets
    .filter((a) => filterPilier === "all" || a.pilier === filterPilier)
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "value_desc") return (b.latestValue ?? 0) - (a.latestValue ?? 0);
      if (sortBy === "value_asc") return (a.latestValue ?? 0) - (b.latestValue ?? 0);
      if (sortBy === "name_asc") return a.name.localeCompare(b.name, "fr");
      if (sortBy === "name_desc") return b.name.localeCompare(a.name, "fr");
      if (sortBy === "pilier") return a.pilier.localeCompare(b.pilier);
      return 0;
    });

  return (
    <div className="space-y-4">
      <MigrationPrompt />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Détail des actifs</CardTitle>
            <CardDescription>
              Valeurs en temps réel pour les actifs cotés, dernier snapshot pour les autres.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddError("");
            }}
          >
            {showAddForm ? (
              <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Nouvel actif
          </Button>
        </CardHeader>

        <CardContent className="p-0 pb-0">
          {/* ── Tableau des actifs ───────────────────────────────── */}
          {allAssets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun actif enregistré — cliquez sur &quot;Nouvel actif&quot; pour commencer.
            </p>
          ) : (
            <div className="overflow-hidden">
              {/* Barre de filtres */}
              <div className="flex flex-wrap gap-2 mb-4 px-4 pt-4">
                <input
                  type="text"
                  placeholder="Rechercher un actif…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 flex-1 min-w-[140px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none"
                >
                  <option value="value_desc">Valeur ↓</option>
                  <option value="value_asc">Valeur ↑</option>
                  <option value="name_asc">Nom A→Z</option>
                  <option value="name_desc">Nom Z→A</option>
                  <option value="pilier">Pilier</option>
                </select>
                <select
                  value={filterPilier}
                  onChange={e => setFilterPilier(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none"
                >
                  <option value="all">Tous les piliers</option>
                  <option value="PEA">PEA</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="IMMO">Immobilier</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Actif
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Pilier
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                      Type
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                      Mis à jour
                    </th>
                    <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground xl:table-cell">
                      Quantité
                    </th>
                    <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground xl:table-cell">
                      PMP
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Valeur
                    </th>
                    <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      Investi
                    </th>
                    <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      +/− latent
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedAssets.map((asset) => (
                      <React.Fragment key={asset.id}>
                        <tr
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">{asset.name}</div>
                            <div className="mt-0.5">
                              <AssetPriceRow
                                ticker={asset.ticker}
                                pricingMode={asset.pricingMode}
                                priceData={asset.ticker ? (priceMap[asset.ticker] ?? null) : null}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    PILIER_COLOR[asset.pilier].hex,
                                }}
                              />
                              {PILIER_LABEL[asset.pilier]}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {asset.type}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {formatDateShort(asset.latestDate) ?? "—"}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground xl:table-cell">
                            {asset.quantiteTotal != null
                              ? asset.quantiteTotal.toLocaleString("fr-FR", { maximumFractionDigits: 6 })
                              : "—"}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground xl:table-cell">
                            {asset.pmp != null ? formatEur(asset.pmp) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            {formatEur(asset.latestValue)}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground lg:table-cell">
                            {formatEur(asset.coutRevient)}
                          </td>
                          <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell">
                            {asset.pvLatente != null ? (
                              <span className={cn(
                                "inline-flex flex-col items-end",
                                asset.pvLatente >= 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                <span className="font-medium">
                                  {asset.pvLatente >= 0 ? "+" : ""}
                                  {formatEur(asset.pvLatente)}
                                </span>
                                {asset.pvPct != null && (
                                  <span className="text-xs opacity-80">{formatPct(asset.pvPct)}</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="Historique d'achats"
                                onClick={() =>
                                  setExpandedAssetId(expandedAssetId === asset.id ? null : asset.id)
                                }
                                className={cn(
                                  "rounded px-1.5 py-1 text-xs font-medium transition-colors",
                                  expandedAssetId === asset.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                Achats
                              </button>
                              <button
                                title="Modifier la valeur"
                                onClick={() =>
                                  snapshotOpen === asset.id
                                    ? setSnapshotOpen(null)
                                    : openSnapshot(asset.id, asset.latestValue)
                                }
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {snapshotOpen === asset.id ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <PenLine className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                title="Modifier ticker / pricing"
                                onClick={() =>
                                  editingId === asset.id
                                    ? setEditingId(null)
                                    : openEdit(asset.id, asset.ticker, asset.pricingMode)
                                }
                                className={cn(
                                  "rounded p-1.5 transition-colors",
                                  editingId === asset.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <span className="text-xs">⚙</span>
                              </button>
                              <button
                                title="Supprimer l'actif et tout son historique"
                                onClick={() => handleDelete(asset.id)}
                                disabled={deletingId === asset.id || isPending}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                              >
                                {deletingId === asset.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Formulaire snapshot inline ─────────── */}
                        {snapshotOpen === asset.id && (
                          <tr className="bg-muted/20">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">
                                    Valeur (€)
                                  </label>
                                  <input
                                    type="number"
                                    value={snapshotValue}
                                    onChange={(e) =>
                                      setSnapshotValue(e.target.value)
                                    }
                                    placeholder="ex. 12 500"
                                    min={0}
                                    step={100}
                                    className="w-36 rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">
                                    Date
                                  </label>
                                  <input
                                    type="date"
                                    value={snapshotDate}
                                    onChange={(e) =>
                                      setSnapshotDate(e.target.value)
                                    }
                                    className="rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveSnapshot(asset.id)}
                                    disabled={isPending}
                                  >
                                    {isPending ? (
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    Enregistrer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSnapshotOpen(null)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                              {snapshotError && (
                                <p className="mt-1.5 text-xs text-destructive">
                                  {snapshotError}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}

                        {/* ── Formulaire ticker / pricingMode inline ─ */}
                        {editingId === asset.id && (
                          <tr className="bg-muted/20">
                            <td colSpan={10} className="px-4 py-3">
                              <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Ticker (ex: bitcoin, EWLD.PA)</label>
                                  <input
                                    type="text"
                                    placeholder="ex: bitcoin ou EWLD.PA"
                                    value={editTicker}
                                    onChange={(e) => setEditTicker(e.target.value)}
                                    className="w-48 rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Mode de pricing</label>
                                  <select
                                    value={editPricingMode}
                                    onChange={(e) => setEditPricingMode(e.target.value)}
                                    className="rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  >
                                    <option value="manual">Estimation manuelle</option>
                                    <option value="live_crypto">Prix live Crypto</option>
                                    <option value="live_equity">Prix live Action/ETF</option>
                                    <option value="savings">Livret / Épargne</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(asset.id)}
                                    disabled={isPending}
                                  >
                                    Enregistrer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* ── Transaction form inline ─────────────── */}
                        {expandedAssetId === asset.id && (
                          <tr className="bg-muted/10">
                            <td colSpan={10} className="px-4 py-4">
                              <TransactionForm
                                assetId={asset.id}
                                assetName={asset.name}
                                priceData={asset.ticker ? (priceMap[asset.ticker] ?? null) : null}
                                onClose={() => setExpandedAssetId(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={6} className="px-4 py-3 font-semibold">
                      Total portefeuille
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">
                      {formatEur(total)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Formulaire ajout actif ───────────────────────────────── */}
      {showAddForm && (
        <Card className="border-dashed bg-muted/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ajouter un actif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Nom</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex. ETF World"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Type</label>
                <select
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value);
                    const found = ALLOCATION_TYPES.find((t) => t.type === e.target.value);
                    if (found) setNewSubtype(found.subtypes[0]);
                  }}
                  className={inputCls}
                >
                  {ALLOCATION_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Sous-type</label>
                <select
                  value={newSubtype}
                  onChange={(e) => setNewSubtype(e.target.value)}
                  className={inputCls}
                >
                  {(ALLOCATION_TYPES.find((t) => t.type === newType)?.subtypes ?? []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            {addError && (
              <p className="text-xs text-destructive">{addError}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddAsset} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                )}
                Créer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
