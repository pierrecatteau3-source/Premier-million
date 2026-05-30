"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { PilierSummary, Pilier } from "@/types";
import { PILIER_LABEL } from "@/types";
import { IconPEA, IconCrypto, IconImmo, IconAutre, type IconProps } from "@/components/icons";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";

type PillarConfig = {
  Icon: (p: IconProps) => React.ReactNode;
  name: string;
  sub: string;
  barColor: string;
  actualColor: string;
  iconBox: CSSProperties;
};

const CONFIG: Record<Exclude<Pilier, "LIQUIDITE">, PillarConfig> = {
  PEA: {
    Icon: IconPEA,
    name: "PEA",
    sub: "Actions monde",
    barColor: "var(--pm-gold)",
    actualColor: "var(--pm-gold)",
    iconBox: {
      background: "linear-gradient(135deg, rgba(224,180,80,0.18), rgba(224,180,80,0.04))",
      borderColor: "var(--pm-rule-gold)",
    },
  },
  CRYPTO: {
    Icon: IconCrypto,
    name: "Crypto",
    sub: "Digital assets",
    barColor: "var(--pm-copper-bright)",
    actualColor: "var(--pm-copper-bright)",
    iconBox: {
      background: "linear-gradient(135deg, rgba(200,136,74,0.20), rgba(200,136,74,0.04))",
      borderColor: "rgba(200,136,74,0.30)",
    },
  },
  IMMO: {
    Icon: IconImmo,
    name: "Immobilier",
    sub: "Tokenisé",
    barColor: "var(--pm-positive)",
    actualColor: "var(--pm-positive)",
    iconBox: {
      background: "linear-gradient(135deg, rgba(148,200,112,0.16), rgba(148,200,112,0.04))",
      borderColor: "rgba(148,200,112,0.28)",
    },
  },
  AUTRE: {
    Icon: IconAutre,
    name: "Trésor caché",
    sub: "À débloquer",
    barColor: "var(--pm-ink-dim)",
    actualColor: "var(--pm-gold)",
    iconBox: {
      background: "var(--pm-bg-deep)",
      borderColor: "var(--pm-rule-strong)",
      borderStyle: "dashed",
    },
  },
};

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

function PillarCard({
  pilier,
  onOpen,
}: {
  pilier: PilierSummary;
  onOpen: (code: Pilier) => void;
}) {
  const cfg = CONFIG[pilier.pilier as Exclude<Pilier, "LIQUIDITE">] ?? CONFIG.AUTRE;
  const assetCount = pilier.assets.length;

  const coutRevient = pilier.assets.reduce((s, a) => s + (a.coutRevient ?? 0), 0);
  const pvLatente = pilier.assets.reduce((s, a) => s + (a.pvLatente ?? 0), 0);
  const pvPct = coutRevient > 0 ? (pvLatente / coutRevient) * 100 : null;
  const hasPnl = coutRevient > 0;
  const up = pvLatente >= 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(pilier.pilier)}
      aria-label={`Voir les actifs du pilier ${cfg.name}`}
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-gold/60 hover:bg-surface-2 hover:shadow-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="mb-[18px] flex items-start justify-between gap-3">
        <div
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-md border"
          style={{ ...cfg.iconBox, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <cfg.Icon size={32} />
        </div>
        <span className="whitespace-nowrap rounded-sm border border-border bg-surface-deep px-2 py-1 font-sans text-[9px] uppercase tracking-[0.18em] text-ink-muted">
          {assetCount > 0 ? `${assetCount} actif${assetCount > 1 ? "s" : ""}` : "Vide"}
        </span>
      </div>

      <h3 className="font-display text-[18px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
        {cfg.name}
      </h3>
      <div className="mt-1.5 font-sans text-[9.5px] uppercase tracking-[0.15em] text-ink-muted">
        {cfg.sub}
      </div>

      <div className="mt-[18px] flex items-baseline gap-1.5 font-display text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink">
        {eur0(pilier.totalValue)}
        <span className="font-sans text-[12px] tracking-[0.12em] text-ink-muted">€</span>
      </div>

      <div className="mt-1.5 flex items-baseline gap-2 font-sans text-[11px] tracking-[0.04em]">
        {hasPnl ? (
          <>
            <span className={up ? "text-positive" : "text-negative"}>
              {up ? "+ " : "− "}
              {eur0(Math.abs(pvLatente))} €
            </span>
            <span className="text-ink-dim">·</span>
            <span className={up ? "text-positive" : "text-negative"}>
              {up ? "+ " : "− "}
              {Math.abs(pvPct ?? 0)
                .toFixed(1)
                .replace(".", ",")}{" "}
              %
            </span>
          </>
        ) : (
          <span className="text-ink-dim">À ouvrir</span>
        )}
      </div>

      <div className="mt-[18px] border-t border-dashed border-border pt-4">
        <div className="relative h-1.5 overflow-hidden rounded-pill bg-surface-deep">
          <div
            className="h-full rounded-pill transition-[width] duration-500"
            style={{
              width: `${Math.min(pilier.percentage, 100)}%`,
              background: cfg.barColor,
            }}
          />
          <div
            className="absolute -top-[3px] h-3 w-0.5 rounded-[2px] bg-ink-soft"
            style={{ left: `${Math.min(pilier.targetPercentage, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-sans text-[9.5px] tracking-[0.08em] text-ink-muted">
          <span style={{ color: cfg.actualColor }}>
            {pilier.percentage.toFixed(1).replace(".", ",")} %
          </span>
          <span>cible {pilier.targetPercentage} %</span>
        </div>
      </div>
    </button>
  );
}

function PillarAssetsModal({
  pilier,
  piliersForManager,
  onClose,
}: {
  pilier: Pilier;
  piliersForManager: PilierSummary[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const cfg = CONFIG[pilier as Exclude<Pilier, "LIQUIDITE">] ?? CONFIG.AUTRE;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Actifs du pilier ${cfg.name}`}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative z-10 my-8 w-full max-w-5xl rounded-2xl border border-border p-5 shadow-2xl sm:p-7"
        style={{ backgroundColor: "hsl(var(--popover))" }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              Pilier
            </span>
            <h2 className="font-display text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink">
              {cfg.name}{" "}
              <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink-muted">
                · {PILIER_LABEL[pilier]}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <PortfolioClient piliers={piliersForManager} initialFilter={pilier} />
      </div>
    </div>,
    document.body
  );
}

export function PillarsGrid({
  piliers,
  piliersForManager,
}: {
  piliers: PilierSummary[];
  piliersForManager: PilierSummary[];
}) {
  const [open, setOpen] = useState<Pilier | null>(null);
  const reels = piliers.filter((p) => p.pilier !== "LIQUIDITE");

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reels.map((p) => (
          <PillarCard key={p.pilier} pilier={p} onOpen={setOpen} />
        ))}
      </div>
      {open && (
        <PillarAssetsModal
          pilier={open}
          piliersForManager={piliersForManager}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
