import { IconTarget, AchPiggy, IconTrophy } from "@/components/icons";

interface Props {
  perfPct: number | null;
  perfEur: number;
  epargneProjectee: number | null;
  ageCible: number | null;
  nextAchievement: string | null;
}

function eur0(v: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
}

function KpiCard({
  icon,
  eyebrow,
  value,
  unit,
  foot,
  valueClass,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  unit?: string;
  foot: string;
  valueClass?: string;
}) {
  return (
    <div className="relative flex items-center gap-[18px] overflow-hidden rounded-lg border border-border bg-surface px-[22px] py-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface-deep text-gold">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 font-sans text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          {eyebrow}
        </div>
        <div className={`flex items-baseline gap-1.5 font-display text-[28px] font-bold leading-none tracking-[-0.025em] tabular-nums text-ink ${valueClass ?? ""}`}>
          {value}
          {unit && (
            <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              {unit}
            </span>
          )}
        </div>
        <div className="mt-1.5 font-sans text-[9.5px] uppercase tracking-[0.06em] text-ink-muted">
          {foot}
        </div>
      </div>
    </div>
  );
}

export function DashboardKpis({
  perfPct,
  perfEur,
  epargneProjectee,
  ageCible,
  nextAchievement,
}: Props) {
  const perfUp = (perfPct ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      <KpiCard
        icon={<IconTarget size={24} />}
        eyebrow="Performance globale"
        value={perfPct != null ? `${perfUp ? "+ " : "− "}${Math.abs(perfPct).toFixed(1).replace(".", ",")}` : "—"}
        unit={perfPct != null ? "% latent" : undefined}
        foot={`${perfUp ? "+ " : "− "}${eur0(Math.abs(perfEur))} € de plus-values`}
        valueClass={perfPct != null ? (perfUp ? "!text-gold-bright" : "!text-negative") : ""}
      />
      <KpiCard
        icon={<AchPiggy size={24} />}
        eyebrow={ageCible ? `Épargne projetée à ${ageCible} ans` : "Épargne projetée"}
        value={epargneProjectee != null ? eur0(epargneProjectee) : "—"}
        unit={epargneProjectee != null ? "€/mois" : undefined}
        foot="Selon ta progression d'épargne"
      />
      <KpiCard
        icon={<IconTrophy size={24} />}
        eyebrow="Prochain succès"
        value={nextAchievement ?? "Tout est dit"}
        foot={nextAchievement ? "À débloquer bientôt" : "Collection complète"}
        valueClass="!text-[20px]"
      />
    </div>
  );
}
