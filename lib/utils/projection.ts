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
