import { cn } from "@/lib/utils";

interface Props {
  totalValue: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  progressionPercent: number;
  objectif?: number;
  matelasEur?: number;
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function HeroCard({
  totalValue,
  monthlyChange,
  monthlyChangePercent,
  progressionPercent,
  objectif = 1_000_000,
  matelasEur = 0,
}: Props) {
  const isPositive = monthlyChange > 0;
  const isNegative = monthlyChange < 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 space-y-4">
      {/* Deux colonnes : patrimoine | objectif */}
      <div className="flex items-start">
        {/* Gauche : patrimoine actuel */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Patrimoine actuel
          </p>
          <p
            className="text-4xl font-bold tracking-tight tabular-nums leading-none"
            style={{
              background:
                "linear-gradient(135deg, hsl(280 90% 65%), hsl(320 75% 60%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {formatEur(totalValue)}
          </p>
          {matelasEur > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              dont {formatEur(matelasEur)} en précaution
            </p>
          )}
        </div>

        {/* Séparateur vertical */}
        <div className="w-px bg-border/50 mx-4 self-stretch" />

        {/* Droite : objectif */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Objectif
          </p>
          <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
            {formatEur(objectif)}
          </p>
        </div>
      </div>

      {/* Badge variation mensuelle */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            isNegative && "bg-red-500/10 text-red-500",
            !isPositive && !isNegative && "bg-muted text-muted-foreground"
          )}
        >
          {isPositive ? "↑" : isNegative ? "↓" : ""}
          {isPositive ? "+" : ""}
          {formatEur(monthlyChange)} ({monthlyChangePercent > 0 ? "+" : ""}
          {monthlyChangePercent.toFixed(1)} %)
        </span>
        <span className="text-xs text-muted-foreground">ce mois</span>
      </div>

      {/* Barre de progression pleine largeur */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              background:
                "linear-gradient(90deg, hsl(280 90% 65%), hsl(320 75% 60%))",
              width: `${Math.min(progressionPercent, 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {progressionPercent.toFixed(1)} % vers {formatEur(objectif)}
        </p>
      </div>
    </div>
  );
}
