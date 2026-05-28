import { IconTrophy, IconTarget, AchRunner } from "@/components/icons";

interface Props {
  unlocked: number;
  total: number;
  pct: number;
  tiers: { bronze: number; silver: number; gold: number; diamond: number };
  next: string | null;
}

function StatCard({
  icon,
  value,
  unit,
  label,
  valueClass,
}: {
  icon: React.ReactNode;
  value: string;
  unit?: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border bg-surface px-5 py-[18px]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface-deep text-gold">
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`flex items-baseline gap-2 font-display text-2xl font-bold tracking-tight ${valueClass ?? ""}`}>
          {value}
          {unit && <span className="font-mono text-[11px] tracking-[0.06em] text-ink-dim">{unit}</span>}
        </div>
        <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

export function SuccesHero({ unlocked, total, pct, tiers, next }: Props) {
  return (
    <section className="mt-4 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div
        className="relative overflow-hidden rounded-lg border border-border px-9 py-8"
        style={{
          background:
            "radial-gradient(circle at 80% 30%, rgba(224,180,80,0.10), transparent 60%), linear-gradient(135deg, var(--pm-surface) 0%, var(--pm-bg-deep) 100%)",
        }}
      >
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
          La collection
        </div>
        <h1 className="mt-3.5 font-display text-[44px] font-bold leading-[0.92] tracking-[-0.045em] text-ink sm:text-[60px] lg:text-[72px]">
          Mur des <em className="font-bold italic text-gold-bright">trophées</em>
        </h1>
        <p className="mt-[18px] max-w-[460px] font-display text-[15px] italic leading-[1.5] text-ink-soft">
          « Chaque médaille raconte une décision tenue. La collection ne récompense pas
          la fortune — elle récompense le bâtisseur. Et parfois, elle se moque un peu de toi. »
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-pill bg-gold/[0.16] px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-gold-bright">
            Or · {tiers.gold}
          </span>
          <span className="rounded-pill bg-silver/[0.14] px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-silver">
            Argent · {tiers.silver}
          </span>
          <span className="rounded-pill bg-bronze/[0.16] px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-bronze">
            Bronze · {tiers.bronze}
          </span>
          {tiers.diamond > 0 && (
            <span className="rounded-pill bg-[rgba(108,197,230,0.16)] px-[9px] py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#9fdcf0]">
              Diamant · {tiers.diamond}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-rows-3 gap-3">
        <StatCard
          icon={<IconTrophy size={22} />}
          value={String(unlocked)}
          unit={`/ ${total}`}
          label="Médailles acquises"
        />
        <StatCard
          icon={<IconTarget size={22} />}
          value={`${pct} %`}
          label="Collection complétée"
          valueClass="text-gold-bright"
        />
        <StatCard
          icon={<AchRunner size={22} />}
          value={next ?? "Tout est dit"}
          label={next ? "Prochain palier" : "Collection complète"}
          valueClass="!text-[18px]"
        />
      </div>
    </section>
  );
}
