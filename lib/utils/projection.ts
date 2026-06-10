export const MARKET_RATE_DEFAULT = 0.08; // 8 %/an — S&P 500 depuis 1957

export interface ProjectionInput {
  currentValue: number;
  monthlySavings: number;
  annualRate: number;
  years: number;
  target: number;
}

export interface ProjectionResult {
  projectedValue: number;
  reachable: boolean;
  targetYear: number;
}

/**
 * Calcule la valeur future avec intérêts composés + versements mensuels.
 * FV = PV × (1+r)^n + PMT × ((1+r)^n − 1) / r
 * r = annualRate/12, n = years×12
 */
export function calculateProjection(input: ProjectionInput): ProjectionResult {
  const { currentValue, monthlySavings, annualRate, years, target } = input;
  const r = annualRate / 12;
  const n = years * 12;

  const compoundFactor = Math.pow(1 + r, n);
  const fvPV = currentValue * compoundFactor;
  const fvPMT = r > 0 ? monthlySavings * ((compoundFactor - 1) / r) : monthlySavings * n;
  const projectedValue = fvPV + fvPMT;

  return {
    projectedValue: Math.round(projectedValue),
    reachable: projectedValue >= target,
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
