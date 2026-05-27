"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Horizon } from "@/types";
import { HORIZON_LABEL } from "@/types";
import { Loader2, RefreshCw, Clock, Zap, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Analysis {
  id: string;
  horizon: string;
  type?: string;
  content: string;
  createdAt: string;
  userId?: string;
}

interface Props {
  horizon: Horizon;
  /** "PORTFOLIO" = analyse portefeuille personnalisée | "MARKET" = vision marché tech */
  analysisType?: "PORTFOLIO" | "MARKET";
  initial: { analysis: Analysis; cached: boolean } | null;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function ageDays(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Modale de confirmation pour régénération d'une analyse récente (< 30 jours) */
function ConfirmModal({
  ageDaysCount,
  onConfirm,
  onCancel,
}: {
  ageDaysCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Modale */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        {/* Bouton fermer */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icône avertissement */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Régénérer l&apos;analyse ?
          </h2>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Cette analyse a été générée{" "}
          <strong className="text-foreground">
            il y a {ageDaysCount} jour{ageDaysCount > 1 ? "s" : ""}
          </strong>
          . La régénérer consommera des crédits API Anthropic.
        </p>

        <p className="text-xs text-muted-foreground mb-5 rounded-md bg-muted/50 px-3 py-2">
          Une mise à jour automatique est disponible après 30 jours. Il est conseillé de ne régénérer qu&apos;en cas de changement significatif de votre situation.
        </p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="sm" onClick={onConfirm}>
            Régénérer quand même
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AnalysisCard({ horizon, analysisType = "PORTFOLIO", initial }: Props) {
  const [result, setResult] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  /** Déclenche l'appel API avec ou sans force selon le contexte */
  async function generate(force: boolean = false) {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon, type: analysisType, force }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setError(json?.error ?? `Erreur serveur (${res.status}) — réessaie dans quelques instants.`);
          return;
        }

        if (!json?.data) {
          setError("Réponse inattendue du serveur — réessaie dans quelques instants.");
          return;
        }

        setResult(json.data);
      } catch {
        setError("Impossible de contacter le serveur — vérifie que l'application est démarrée.");
      }
    });
  }

  /** Gère le clic sur le bouton "Régénérer" */
  function handleRegenerateClick() {
    if (!result) {
      // Pas d'analyse existante → génération directe sans confirmation
      void generate(false);
      return;
    }

    const age = ageDays(result.analysis.createdAt);

    if (age < 30) {
      // Analyse récente → demander confirmation
      setShowConfirm(true);
    } else {
      // Analyse expirée (> 30 jours) → régénération directe
      void generate(true);
    }
  }

  function handleConfirm() {
    setShowConfirm(false);
    void generate(true);
  }

  function handleCancel() {
    setShowConfirm(false);
  }

  const horizonLabel = HORIZON_LABEL[horizon];
  const age = result ? ageDays(result.analysis.createdAt) : null;
  const isExpired = age !== null && age >= 30;

  const loadingLabel =
    analysisType === "MARKET"
      ? `Claude analyse les opportunités technologiques pour l'horizon ${horizonLabel}…`
      : `Claude analyse votre portefeuille pour l'horizon ${horizonLabel}…`;

  return (
    <>
      {/* Modale de confirmation */}
      {showConfirm && age !== null && (
        <ConfirmModal
          ageDaysCount={age}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {result ? (
              <>
                {result.cached && !isExpired ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4 text-primary" />
                )}
                <span>
                  {result.cached && age === 0
                    ? "Générée aujourd'hui"
                    : result.cached
                    ? "Depuis le cache"
                    : "Générée à l'instant"}
                </span>

                {/* Badge date */}
                <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Mis à jour le {formatDate(result.analysis.createdAt)}
                </span>

                {/* Badge âge */}
                {age !== null && age > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      isExpired
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    )}
                  >
                    {isExpired ? "Expirée" : `il y a ${age} j`}
                  </span>
                )}
              </>
            ) : (
              <span>Aucune analyse disponible pour {horizonLabel}</span>
            )}
          </div>

          <Button
            onClick={handleRegenerateClick}
            disabled={isPending}
            variant={result && !isExpired ? "outline" : "default"}
            size="sm"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {result
              ? isExpired
                ? "Mettre à jour l'analyse"
                : "Régénérer"
              : "Générer l'analyse"}
          </Button>
        </div>

        {/* Message d'expiration */}
        {isExpired && result && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            Cette analyse date de{" "}
            <strong>{age} jours</strong>. Une mise à jour est recommandée pour refléter votre situation actuelle.
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Chargement */}
        {isPending && !result && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{loadingLabel}</span>
          </div>
        )}

        {/* Contenu Markdown */}
        {result && (
          <div
            className={cn(
              "prose prose-sm max-w-none rounded-lg border border-border bg-card p-6 transition-opacity",
              isPending && "opacity-50"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-5 mb-2 text-base font-semibold text-foreground first:mt-0 border-b border-border/40 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-4 mb-2 text-sm font-semibold text-foreground first:mt-0">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-foreground/90">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 space-y-1 pl-4">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground/90 list-disc">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                table: ({ children }) => (
                  <div className="my-4 w-full overflow-x-auto rounded-lg border border-border">
                    <table className="w-full border-collapse text-xs min-w-[600px]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/60">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-xs text-foreground/90 align-top">
                    {children}
                  </td>
                ),
                hr: () => <hr className="my-4 border-border" />,
              }}
            >
              {result.analysis.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Placeholder vide */}
        {!result && !isPending && !error && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Génère une analyse Claude pour l&apos;horizon {horizonLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              L&apos;analyse sera mise en cache 30 jours pour éviter les coûts inutiles.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
