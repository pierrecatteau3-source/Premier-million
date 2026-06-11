"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Lock, Plus, Trash2 } from "lucide-react";
import {
  IconTarget,
  IconWallet,
  IconShield,
  IconSparkles,
  IconBricks,
  IconPEA,
  IconCrypto,
  IconImmo,
  IconAutre,
  type IconProps,
} from "@/components/icons";
import type { UserProfile, AllocationDetaillee } from "@/types";
import { PILIER_LABEL } from "@/types";
import { calculateProjection, MARKET_RATE_DEFAULT } from "@/lib/utils/projection";
import { computeAge } from "@/lib/utils/age";
import { ALLOCATION_TYPES, TYPE_TO_PILIER } from "@/lib/constants/allocation-types";

const OBJECTIF_FIXE = 1_000_000;

// text-base sur mobile (< sm) : iOS zoome au focus sur tout champ < 16px
const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-base text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-ring/40 sm:text-sm";

const inputNarrow =
  "h-10 w-20 rounded-md border border-input bg-background px-2.5 text-right text-base tabular-nums text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-ring/40 sm:text-sm";

// Boîte d'icône dorée — réutilise le pattern des PillarCards du Dashboard.
const goldIconBox: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(224,180,80,0.18), rgba(224,180,80,0.04))",
  borderColor: "var(--pm-rule-gold)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

// Icône + couleur de marque par pilier (pour l'allocation cible).
const PILIER_VISUAL: Record<
  string,
  { Icon: (p: IconProps) => React.ReactNode; color: string }
> = {
  PEA: { Icon: IconPEA, color: "#e0b450" },
  CRYPTO: { Icon: IconCrypto, color: "#dba566" },
  IMMO: { Icon: IconImmo, color: "#94c870" },
  AUTRE: { Icon: IconAutre, color: "#a08b6e" },
  LIQUIDITE: { Icon: IconWallet, color: "#c5c0b0" },
};

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
  const [dateNaissance, setDateNaissance] = useState(
    profile.dateNaissance ? profile.dateNaissance.slice(0, 10) : ""
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

  // Répartition agrégée par pilier (barre de visualisation).
  const byPilier = (() => {
    const m = new Map<string, number>();
    for (const l of allocationDetaillee) {
      const p = TYPE_TO_PILIER[l.type] ?? "AUTRE";
      m.set(p, (m.get(p) ?? 0) + l.pct);
    }
    return Array.from(m.entries(), ([pilier, pct]) => ({ pilier, pct }));
  })();

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
  // Âge dérivé dynamiquement de la date de naissance (NaN si non renseignée).
  const ageActuelNum = dateNaissance ? computeAge(new Date(dateNaissance)) : NaN;
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
            dateNaissance: dateNaissance || null,
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

  const projeteVsObjectif = projection
    ? Math.min((projection.projectedValue / OBJECTIF_FIXE) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Identité & objectif ─────────────────────────────────────── */}
      <SectionCard
        Icon={IconTarget}
        title="Identité & objectif"
        subtitle={`Compte · ${profile.email}`}
        delay={0}
      >
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Prénom / Pseudo">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Cash"
              className={inputCls}
            />
          </Field>
          <Field
            label="Date de naissance"
            helper={
              !isNaN(ageActuelNum)
                ? `${ageActuelNum} ans — l'âge se met à jour automatiquement.`
                : "Ton âge sera calculé automatiquement à partir de cette date."
            }
          >
            <input
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
          </Field>
          <Field label="Objectif patrimonial">
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-surface-deep px-3">
              <Lock className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <span className="text-sm font-semibold tabular-nums text-gold">
                1 000 000 €
              </span>
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
      </SectionCard>

      {/* ── Épargne ─────────────────────────────────────────────────── */}
      <SectionCard
        Icon={IconWallet}
        title="Épargne"
        subtitle="Capacité d'investissement"
        delay={60}
      >
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
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
              <span className="shrink-0 text-xs text-ink-muted">% / an</span>
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ── Faisabilité ─────────────────────────────────────────────── */}
      {showFaisabilite && projection && (
        <section
          className="animate-fade-in overflow-hidden rounded-lg border p-5 sm:p-6"
          style={{
            borderColor: "var(--pm-rule-gold)",
            background:
              "linear-gradient(160deg, rgba(224,180,80,0.08), transparent 72%)",
            animationDelay: "100ms",
            animationFillMode: "backwards",
          }}
        >
          <div className="mb-5 flex items-center gap-3.5">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md border"
              style={goldIconBox}
            >
              <IconSparkles size={24} className="text-gold" />
            </div>
            <div>
              <h3 className="font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
                Faisabilité de l&apos;objectif
              </h3>
              <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Basé sur 8 %/an — moyenne S&amp;P 500 depuis 1957
                {evolutionEpargne !== "" && !isNaN(evolutionEpargneNum) && (
                  <>
                    {" · "}épargne {evolutionEpargneNum > 0 ? "+" : ""}
                    {evolutionEpargneNum} %/an
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Horizon" value={`${years} ans`} />
            <Stat
              label="Valeur projetée"
              value={formatEur(projection.projectedValue)}
              gold
            />
            <div className="space-y-1.5">
              <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                Verdict
              </p>
              {projection.reachable ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-positive/30 bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                  Atteignable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-pill border border-negative/30 bg-negative/10 px-2.5 py-1 text-xs font-semibold text-negative">
                  Insuffisant
                </span>
              )}
            </div>
          </div>

          {/* Barre projeté vs objectif */}
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-pill bg-surface-deep">
              <div
                className="h-full rounded-pill transition-[width] duration-700"
                style={{
                  width: `${projeteVsObjectif}%`,
                  background: projection.reachable
                    ? "var(--pm-positive)"
                    : "var(--pm-gold)",
                }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] tabular-nums text-ink-muted">
              {projeteVsObjectif.toFixed(0).replace(".", ",")} % de l&apos;objectif
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {epargneFinaleProjete !== null && (
              <div className="rounded-md border border-border bg-surface-deep/60 px-3 py-2 text-sm">
                <span className="text-ink-muted">Épargne à {ageCibleNum} ans : </span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatEur(epargneFinaleProjete)}/mois
                </span>
              </div>
            )}
            {matelasEur !== null && (
              <div className="rounded-md border border-border bg-surface-deep/60 px-3 py-2 text-sm">
                <span className="text-ink-muted">Épargne de précaution : </span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatEur(matelasEur)}
                </span>
              </div>
            )}
          </div>

          {!projection.reachable && (
            <p className="mt-3 text-xs text-ink-muted">
              Augmente ton épargne mensuelle ou allonge ton horizon pour atteindre
              1 000 000 €.
            </p>
          )}
        </section>
      )}

      {/* ── Profil de risque & stratégie ────────────────────────────── */}
      <SectionCard
        Icon={IconShield}
        title="Profil de risque & stratégie"
        subtitle="Tolérance · expérience · rendement cible"
        delay={120}
      >
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
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
              <span className="shrink-0 text-xs text-ink-muted">%</span>
            </div>
          </Field>
          <Field label="Niveau de connaissance">
            <select
              value={niveauConnaissance}
              onChange={(e) => setNiveauConnaissance(e.target.value)}
              className="w-full"
            >
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">Intermédiaire</option>
              <option value="Avancé">Avancé</option>
            </select>
          </Field>
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
              <span className="shrink-0 text-xs text-ink-muted">% / an</span>
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ── Allocation cible ────────────────────────────────────────── */}
      <SectionCard
        Icon={IconBricks}
        title="Allocation cible"
        subtitle="Répartition souhaitée · total 100 %"
        delay={180}
      >
        {/* Barre de répartition par pilier */}
        {allocationDetaillee.length > 0 && (
          <div className="mb-5">
            <div className="flex h-3 w-full overflow-hidden rounded-pill bg-surface-deep">
              {byPilier.map(({ pilier, pct }) => (
                <div
                  key={pilier}
                  className="h-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    background: PILIER_VISUAL[pilier]?.color ?? "#a08b6e",
                  }}
                  title={`${PILIER_LABEL[pilier as keyof typeof PILIER_LABEL] ?? pilier} · ${pct} %`}
                />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {byPilier.map(({ pilier, pct }) => (
                <span
                  key={pilier}
                  className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PILIER_VISUAL[pilier]?.color ?? "#a08b6e" }}
                  />
                  {PILIER_LABEL[pilier as keyof typeof PILIER_LABEL] ?? pilier}
                  <span className="font-medium tabular-nums text-ink-soft">
                    {Math.round(pct)} %
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lignes d'allocation */}
        {allocationDetaillee.length > 0 && (
          <div className="space-y-1.5">
            {allocationDetaillee.map((line, idx) => {
              const pilier = TYPE_TO_PILIER[line.type] ?? "AUTRE";
              const vis = PILIER_VISUAL[pilier] ?? PILIER_VISUAL.AUTRE;
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-3 rounded-md border border-border bg-surface-2/40 px-3 py-2 transition-colors hover:border-gold/40 hover:bg-surface-2"
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
                    style={{ background: `${vis.color}1f` }}
                  >
                    <vis.Icon size={16} style={{ color: vis.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">
                      {line.type}
                    </p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {line.subtype}
                    </p>
                  </div>
                  <input
                    type="number"
                    value={line.pct}
                    onChange={(e) => handleUpdatePct(idx, e.target.value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-right text-xs tabular-nums text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
                  />
                  <span className="text-xs text-ink-muted">%</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="ml-1 rounded p-1 text-ink-muted opacity-0 transition-all hover:text-negative group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-deep">
            <div
              className="h-full rounded-pill transition-all duration-500"
              style={{
                width: `${Math.min(allocationSum, 100)}%`,
                background: allocationValid
                  ? "var(--pm-positive)"
                  : allocationSum > 100
                  ? "var(--pm-negative)"
                  : "var(--pm-gold)",
              }}
            />
          </div>
          <span
            className={`text-xs font-semibold tabular-nums ${
              allocationValid
                ? "text-positive"
                : allocationSum > 100
                ? "text-negative"
                : "text-gold"
            }`}
          >
            {allocationSum} %
          </span>
        </div>
        {allocationDetaillee.length > 0 && !allocationValid && (
          <p className="mt-2 text-xs text-ink-muted">
            Ajuste les pourcentages pour atteindre 100 %.
          </p>
        )}

        {/* Formulaire d'ajout */}
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-dashed border-border bg-surface-2/30 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[130px] flex-1 space-y-1">
            <label className="text-xs font-medium text-ink-muted">Type</label>
            <select
              value={addType}
              onChange={(e) => {
                setAddType(e.target.value);
                const found = ALLOCATION_TYPES.find((t) => t.type === e.target.value);
                setAddSubtype(found ? found.subtypes[0] : "");
              }}
              className="w-full"
            >
              {ALLOCATION_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-1">
            <label className="text-xs font-medium text-ink-muted">Sous-type</label>
            <select
              value={addSubtype}
              onChange={(e) => setAddSubtype(e.target.value)}
              className="w-full"
            >
              {addTypeData.subtypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">%</label>
            <input
              type="number"
              value={addPct}
              onChange={(e) => setAddPct(e.target.value)}
              placeholder="10"
              min={0}
              max={100}
              step={1}
              className={inputNarrow}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLine}
            disabled={!addPct || isNaN(parseFloat(addPct)) || parseFloat(addPct) <= 0}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </SectionCard>

      {/* ── Messages ────────────────────────────────────────────────── */}
      {error && (
        <div className="animate-fade-in rounded-md border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      )}
      {success && (
        <div className="animate-fade-in rounded-md border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
          Profil mis à jour.
        </div>
      )}

      {/* ── Barre de sauvegarde ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          Progression actuelle :{" "}
          <strong className="text-gold">{profile.progressionPercent} %</strong>{" "}
          <span className="tabular-nums">
            ({formatEur((profile.progressionPercent / 100) * OBJECTIF_FIXE)} sur{" "}
            {formatEur(OBJECTIF_FIXE)})
          </span>
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

// ── Sous-composants ──────────────────────────────────────────────

function SectionCard({
  Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  Icon: (p: IconProps) => React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="animate-fade-in rounded-lg border border-border bg-surface p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="mb-5 flex items-center gap-3.5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border"
          style={goldIconBox}
        >
          <Icon size={24} className="text-gold" />
        </div>
        <div>
          <h3 className="font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-sans text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p
        className={`font-display text-[17px] font-bold leading-none tabular-nums ${
          gold ? "text-gold" : "text-ink"
        }`}
      >
        {value}
      </p>
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-ink-soft">{label}</label>
      {children}
      {helper && (
        <p className="text-[11px] leading-relaxed text-ink-muted">{helper}</p>
      )}
    </div>
  );
}
