import { PortfolioChart } from "@/components/portfolio/PortfolioChart";
import { SkaterChibi } from "@/components/icons";

export function EvolutionBlock() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-lg border border-border bg-surface px-5 pb-6 pt-7 md:px-7">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.025em]">
          Évolution du <em className="italic text-gold">trésor</em>
        </h3>
      </div>
      <div className="relative">
        <PortfolioChart compact defaultRangeDays={30} />
        <div className="pointer-events-none absolute right-3 top-0 animate-glide">
          <SkaterChibi size={40} />
        </div>
      </div>
    </div>
  );
}
