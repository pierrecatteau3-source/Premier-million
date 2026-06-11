export const MARKET_RATE_DEFAULT = 0.08; // 8 %/an — S&P 500 depuis 1957

export interface ProjectionInput {
  currentValue: number;
  monthlySavings: number;
  /** Évolution annuelle de l'épargne en % (ex. 4 pour +4 %/an) */
  savingsGrowthPct: number;
  /** Taux de croissance annuel en % (ex. 8 pour 8 %/an) */
  annualRatePct: number;
  years: number;
  target: number;
}

export interface ProjectionResult {
  projectedValue: number;
  reachable: boolean;
  targetYear: number;
}

/**
 * Valeur projetée à un horizon donné, par simulation mensuelle exacte
 * (intérêts composés + épargne qui évolue chaque année).
 *
 * MÊME moteur que `calculateTargetAge` ci-dessous : la « valeur projetée à
 * l'âge cible » (profil, Pio) et « objectif atteint à » (dashboard) racontent
 * ainsi la même histoire — l'ancienne formule fermée à épargne moyenne lissée
 * pouvait les faire diverger de 1-2 ans autour de l'objectif.
 */
export function simulateProjection(input: ProjectionInput): ProjectionResult {
  const { currentValue, monthlySavings, savingsGrowthPct, annualRatePct, years, target } = input;
  const monthlyRate = annualRatePct / 12 / 100;

  let value = currentValue;
  let e = monthlySavings;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + e;
    }
    e *= 1 + savingsGrowthPct / 100;
  }

  return {
    projectedValue: Math.round(value),
    reachable: value >= target,
    targetYear: new Date().getFullYear() + years,
  };
}

/**
 * Âge auquel l'objectif est atteint au rythme actuel (intérêts composés mensuels
 * + épargne mensuelle qui évolue chaque année). Renvoie `null` si non atteint en `maxYears`.
 *
 * @param currentValue Patrimoine de départ (€)
 * @param epargne      Épargne mensuelle (€)
 * @param evolution    Évolution annuelle de l'épargne (%)
 * @param taux         Taux de croissance annuel (%) — ex. 8 pour 8 %
 * @param ageActuel    Âge actuel de l'utilisateur
 * @param objectif     Objectif patrimonial (€), défaut 1 000 000
 * @param maxYears     Horizon max de simulation, défaut 60 ans
 */
export function calculateTargetAge(
  currentValue: number,
  epargne: number,
  evolution: number,
  taux: number,
  ageActuel: number,
  objectif = 1_000_000,
  maxYears = 60
): number | null {
  const monthlyRate = taux / 12 / 100;
  let value = currentValue;
  let e = epargne;
  for (let y = 0; y < maxYears; y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + e;
      if (value >= objectif) return ageActuel + y + (m >= 6 ? 1 : 0);
    }
    e *= 1 + evolution / 100;
  }
  return null;
}
