"use client";

import { usePathname } from "next/navigation";

const CRUMB_LABELS: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/portefeuille": "Portefeuille · Le trésor",
  "/risque": "Risque & atouts",
  "/analyse": "Analyse",
  "/vision-marche": "Vision marché",
  "/profil": "Profil & stratégie",
  "/personnage": "Mon associé",
  "/succes": "Succès · Collection",
  "/historique": "Historique",
};

function resolveLabel(pathname: string): string {
  if (CRUMB_LABELS[pathname]) return CRUMB_LABELS[pathname];
  const match = Object.keys(CRUMB_LABELS).find(
    (href) => href !== "/dashboard" && pathname.startsWith(href)
  );
  return match ? CRUMB_LABELS[match] : "Premier Million";
}

export function Topbar() {
  const pathname = usePathname();
  const here = resolveLabel(pathname);

  return (
    <div className="mb-2 flex items-center justify-between border-b border-border pb-6">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        <span>Premier Million</span>
        <span className="text-ink-faint">/</span>
        <span className="text-gold">{here}</span>
      </div>
      <div className="flex items-center gap-[18px] font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-[11px] py-1.5">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-positive shadow-[0_0_0_3px_rgba(148,200,112,0.18)]" />
          Vol. I · Saison 2026
        </span>
        <span className="rounded-pill border border-gold/30 bg-gold/10 px-[11px] py-1.5 text-gold-bright">
          EUR · FR
        </span>
      </div>
    </div>
  );
}
