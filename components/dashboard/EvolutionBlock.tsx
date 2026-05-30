import { PortfolioChart } from "@/components/portfolio/PortfolioChart";

export function EvolutionBlock() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface px-5 pb-6 pt-7 md:px-7">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-[22px] font-bold tracking-[-0.025em]">
          Évolution du <em className="italic text-gold">trésor</em>
        </h3>
      </div>
      <PortfolioChart compact defaultRangeDays={30} showSkater />
    </div>
  );
}
