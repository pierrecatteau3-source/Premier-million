"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Lock, ShieldCheck, TrendingUp, Plus, Trash2 } from "lucide-react";
import type { UserProfile } from "@/types";
import type { AllocationDetaillee } from "@/types";
import { calculateProjection, MARKET_RATE_DEFAULT } from "@/lib/utils/projection";
import { ALLOCATION_TYPES } from "@/lib/constants/allocation-types";

const OBJECTIF_FIXE = 1_000_000;

const inputCls =
  "h-9 w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

const inputNarrow =
  "h-9 w-16 rounded border border-input bg-background px-2 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

interface Props {
  profile: UserProfile;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── État du formulaire ────────────────────────────────────────
  const [name, setName] = useState(profile.name ?? "");
  const [ageActuel, setAgeActuel] = useState(
    profile.ageActuel ? String(profile.ageActuel) : ""
  );
  const [ageCible, setAgeCible] = useState(
    profile.ageCible ? String(profile.ageCible) : ""
  );
  const [epargneMensuelle, setEpargneMensuelle] = useState(
    profile.epargneMensuelle ? String(profile.epargneMensuelle) : ""
  );
  const [epargnePrecaution] = useState(
    profile.epargnePrecaution ? String(profile.epargnePrecaution) : ""
  );
  const [epargnePrecautionMontant, setEpargnePrecautionMontant] = useState(
    profile.epargnePrecautionMontant != null ? String(profile.epargnePrecautionMontant) : ""
  );
  const [evolutionEpargne, setEvolutionEpargne] = useState(
    profile.evolutionEpargne != null ? String(profile.evolutionEpargne) : ""
  );
  // Stratégie
  const [risqueMaxPerte, setRisqueMaxPerte] = useState(
    profile.risqueMaxPerte != null ? String(profile.risqueMaxPerte) : ""
  );
  const [niveauConnaissance, setNiveauConnaissance] = useState(
    profile.niveauConnaissance ?? "Intermédiaire"
  );
  const [objectifCroissance, setObjectifCroissance] = useState(
    profile.objectifCroissance != null ? String(profile.objectifCroissance) : ""
  );
  const [allocationDetaillee, setAllocationDetaillee] = useState<AllocationDetaillee>(
    profile.allocationDetaillee ?? []
  );
  // Add-form state
  const [addType, setAddType] = useState(ALLOCATION_TYPES[0].type as string);
  const [addSubtype, setAddSubtype] = useState(ALLOCATION_TYPES[0].subtypes[0] as string);
  const [addPct, setAddPct] = useState("");

  // ── Validation allocation ─────────────────────────────────────
  const allocationSum = Math.round(
    allocationDetaillee.reduce((acc, l) => acc + l.pct, 0)
  );
  const allocationValid = allocationSum === 100;

  const addTypeData = ALLOCATION_TYPES.find((t) => t.type === addType) ?? ALLOCATION_TYPES[0];

  function handleAddLine() {
    const pct = parseFloat(addPct);
    if (isNaN(pct) || pct <= 0) return;
    setAllocationDetaillee((prev) => {
      const idx = prev.findIndex((l) => l.type === addType && l.subtype === addSubtype);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], pct: Math.round((next[idx].pct + pct) * 10) / 10 };
        return next;
      }
      return [...prev, { type: addType, subtype: addSubtype, pct }];
    });
    setAddPct("");
  }

  function handleRemoveLine(idx: number) {
    setAllocationDetaillee((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleUpdatePct(idx: number, raw: string) {
    const v = parseFloat(raw);
    setAllocationDetaillee((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], pct: isNaN(v) ? 0 : v };
      return next;
    });
  }

  // ── Faisabilité (lecture seule) ───────────────────────────────
  const ageActuelNum = parseInt(ageActuel, 10);
  const ageCibleNum = parseInt(ageCible, 10);
  const epargneMensuelleNum = parseFloat(epargneMensuelle);
  const evolutionEpargneNum = parseFloat(evolutionEpargne);
  const epargnePrecautionNum = parseInt(epargnePrecaution, 10);

  const years = ageCibleNum - ageActuelNum;

  const showFaisabilite =
    !isNaN(ageActuelNum) &&
    !isNaN(ageCibleNum) &&
    ageCibleNum > ageActuelNum &&
    !isNaN(epargneMensuelleNum) &&
    epargneMensuelleNum > 0;

  const epargneMoyenne =
    showFaisabilite && !isNaN(evolutionEpargneNum) && evolutionEpargne !== ""
      ? epargneMensuelleNum * Math.pow(1 + evolutionEpargneNum / 100, years / 2)
      : epargneMensuelleNum;

  const epargneFinaleProjete =
    showFaisabilite && !isNaN(evolutionEpargneNum) && evolutionEpargne !== ""
      ? epargneMensuelleNum * Math.pow(1 + evolutionEpargneNum / 100, years)
      : null;

  const projection = showFaisabilite
    ? calculateProjection({
        currentValue: (profile.progressionPercent / 100) * OBJECTIF_FIXE,
        monthlySavings: epargneMoyenne,
        annualRate: MARKET_RATE_DEFAULT,
        years,
        target: OBJECTIF_FIXE,
      })
    : null;

  const matelasEur =
    epargnePrecautionMontant !== "" && !isNaN(parseFloat(epargnePrecautionMontant))
      ? parseFloat(epargnePrecautionMontant)
      : !isNaN(epargnePrecautionNum) && !isNaN(epargneMensuelleNum)
      ? epargnePrecautionNum * epargneMensuelleNum
      : null;

  // ── Sauvegarde ────────────────────────────────────────────────
  function handleSave() {
    setError("");
    setSuccess(false);

    if (allocationDetaillee.length > 0 && !allocationValid) {
      setError(
        `L'allocation cible doit totaliser 100 % (actuellement ${allocationSum} %).`
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            ageCible: ageCible ? parseInt(ageCible, 10) : null,
            ageActuel: ageActuel ? parseInt(ageActuel, 10) : null,
            epargneMensuelle: epargneMensuelle ? parseFloat(epargneMensuelle) : null,
            epargnePrecautionMontant: epargnePrecautionMontant !== "" ? parseFloat(epargnePrecautionMontant) : null,
            evolutionEpargne: evolutionEpargne !== "" ? parseFloat(evolutionEpargne) : null,
            risqueMaxPerte: risqueMaxPerte !== "" ? parseFloat(risqueMaxPerte) : null,
            niveauConnaissance: niveauConnaissance || null,
            objectifCroissance: objectifCroissance !== "" ? parseFloat(objectifCroissance) : null,
            allocationDetaillee: allocationDetaillee.length > 0 ? allocationDetaillee : null,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Erreur lors de la sauvegarde");
          return;
        }

        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch {
        setError("Erreur réseau — vérifie ta connexion.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Informations générales ─────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
          <CardDescription>Compte : {profile.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section A — Identité */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identité
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prénom / Pseudo">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. Cash"
                  className={inputCls}
                />
              </Field>
              <Field label="Âge actuel">
                <input
                  type="number"
                  value={ageActuel}
                  onChange={(e) => setAgeActuel(e.target.value)}
                  placeholder="ex. 32"
                  min={1}
                  max={120}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section B — Objectif & Horizon */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Objectif & Horizon
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Objectif patrimonial">
                <div className="flex items-center gap-2 rounded border border-input bg-muted/50 px-2.5 py-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-semibold tabular-nums">1 000 000 €</span>
                </div>
              </Field>
              <Field label="Âge cible (optionnel)">
                <input
                  type="number"
                  value={ageCible}
                  onChange={(e) => setAgeCible(e.target.value)}
                  placeholder="ex. 45"
                  min={18}
                  max={100}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section C — Épargne */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Épargne
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Épargne mensuelle (€)">
                <input
                  type="number"
                  value={epargneMensuelle}
                  onChange={(e) => setEpargneMensuelle(e.target.value)}
                  placeholder="ex. 2 000"
                  min={0}
                  step={100}
                  className={inputCls}
                />
              </Field>
              <Field
                label="Épargne de précaution (€)"
                helper="Montant total conservé en liquidités (livrets, comptes) pour faire face aux imprévus"
              >
                <input
                  type="number"
                  value={epargnePrecautionMontant}
                  onChange={(e) => setEpargnePrecautionMontant(e.target.value)}
                  placeholder="ex. 10 000"
                  min={0}
                  step={500}
                  className={inputCls}
                />
              </Field>
              <Field
                label="Progression annuelle de l'épargne"
                helper="Hausse prévisionnelle de ta capacité d'épargne chaque année (augmentation de salaire, charges en moins…)"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={evolutionEpargne}
                    onChange={(e) => setEvolutionEpargne(e.target.value)}
                    placeholder="5"
                    min={-50}
                    max={100}
                    step={0.5}
                    maxLength={3}
                    className={inputNarrow}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">% / an</span>
                </div>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Faisabilité ────────────────────────────────────────────── */}
      {showFaisabilite && projection && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Faisabilité de l&apos;objectif</CardTitle>
            <CardDescription>
              Basé sur 8 %/an — moyenne S&P 500 depuis 1957
              {evolutionEpargne !== "" && !isNaN(evolutionEpargneNum) && (
                <> · Épargne croissante de {evolutionEpargneNum > 0 ? "+" : ""}{evolutionEpargneNum} %/an</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Horizon</p>
                <p className="font-semibold">{years} ans</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valeur projetée</p>
                <p className="font-semibold tabular-nums">
                  {formatEur(projection.projectedValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verdict</p>
                {projection.reachable ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700">✅ Atteignable</span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-500/10 text-orange-700">⚠️ Insuffisant</span>
                )}
              </div>
            </div>

            {epargneFinaleProjete !== null && (
              <div className="rounded-md bg-background/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Épargne mensuelle à {ageCibleNum} ans : </span>
                <span className="font-semibold tabular-nums">{formatEur(epargneFinaleProjete)}/mois</span>
              </div>
            )}

            {matelasEur !== null && (
              <div className="rounded-md bg-background/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Épargne de précaution constituée : </span>
                <span className="font-semibold tabular-nums">{formatEur(matelasEur)}</span>
              </div>
            )}

            {!projection.reachable && (
              <p className="text-xs text-muted-foreground">
                Augmente ton épargne mensuelle ou allonge ton horizon pour atteindre 1 000 000 €.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Profil de risque & Stratégie ──────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profil de risque & Stratégie</CardTitle>
          <CardDescription>
            Tolérance aux pertes, expérience et rendement cible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profil de risque */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Profil de risque
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Perte maximale acceptable (%)"
                helper="Ex. 20 = tu acceptes de perdre jusqu'à 20 % de ton capital"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={risqueMaxPerte}
                    onChange={(e) => setRisqueMaxPerte(e.target.value)}
                    placeholder="20"
                    min={0}
                    max={100}
                    step={5}
                    className={inputCls}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">%</span>
                </div>
              </Field>
              <Field label="Niveau de connaissance">
                <select
                  value={niveauConnaissance}
                  onChange={(e) => setNiveauConnaissance(e.target.value)}
                  className={inputCls}
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Objectif de croissance */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Objectif de croissance
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Croissance annuelle cible (%)"
                helper="Taux de rendement annualisé moyen visé"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={objectifCroissance}
                    onChange={(e) => setObjectifCroissance(e.target.value)}
                    placeholder="8"
                    min={0}
                    max={100}
                    step={0.5}
                    className={inputCls}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">% / an</span>
                </div>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Allocation cible ───────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Allocation cible</CardTitle>
          <CardDescription>
            Répartition souhaitée par type et sous-type — doit totaliser 100 %.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lines list */}
          {allocationDetaillee.length > 0 && (
            <div className="space-y-1.5">
              {allocationDetaillee.map((line, idx) => (
                <div key={idx} className="group flex items-center gap-2 rounded-md border border-border px-3 py-1.5 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium">{line.type}</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{line.subtype}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={line.pct}
                      onChange={(e) => handleUpdatePct(idx, e.target.value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-14 rounded border border-input bg-background px-2 py-1 text-right text-xs outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="ml-1 rounded p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  allocationValid ? "bg-green-500" : allocationSum > 100 ? "bg-red-500" : "bg-orange-400"
                }`}
                style={{ width: `${Math.min(allocationSum, 100)}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium tabular-nums ${
                allocationValid ? "text-green-600" : allocationSum > 100 ? "text-red-600" : "text-orange-500"
              }`}
            >
              {allocationSum} %
            </span>
          </div>
          {allocationDetaillee.length > 0 && !allocationValid && (
            <p className="text-xs text-orange-600">
              Total : {allocationSum} % — ajuste les pourcentages pour atteindre 100 %.
            </p>
          )}

          {/* Add form */}
          <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
            <div className="flex-1 min-w-[130px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={addType}
                onChange={(e) => {
                  setAddType(e.target.value);
                  const found = ALLOCATION_TYPES.find((t) => t.type === e.target.value);
                  setAddSubtype(found ? found.subtypes[0] : "");
                }}
                className={inputCls}
              >
                {ALLOCATION_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>{t.type}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sous-type</label>
              <select
                value={addSubtype}
                onChange={(e) => setAddSubtype(e.target.value)}
                className={inputCls}
              >
                {addTypeData.subtypes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">%</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={addPct}
                  onChange={(e) => setAddPct(e.target.value)}
                  placeholder="10"
                  min={0}
                  max={100}
                  step={1}
                  className="w-16 rounded border border-input bg-background px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              disabled={!addPct || isNaN(parseFloat(addPct)) || parseFloat(addPct) <= 0}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Sauvegarde ────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profil mis à jour avec succès.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Progression actuelle :{" "}
          <strong>{profile.progressionPercent} %</strong>
          {" "}({formatEur((profile.progressionPercent / 100) * OBJECTIF_FIXE)} sur{" "}
          {formatEur(OBJECTIF_FIXE)})
        </p>
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-2 h-3.5 w-3.5" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
