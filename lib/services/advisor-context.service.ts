/**
 * Assemblage du contexte du MODE CONSEIL de Pio ("Analyse ma stratégie").
 * SERVEUR UNIQUEMENT (accès Prisma + persona serveur).
 *
 * Réutilise les moteurs existants (portefeuille, risque, projection) pour produire
 * un objet PioAdvisorContextInput ancré dans les vrais chiffres de l'utilisateur,
 * que buildPioAdvisorContext transforme ensuite en prompt.
 */
import { prisma } from "@/lib/prisma";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { fetchMarketSnapshot } from "@/lib/services/market-data.service";
import { buildRiskScoreInput, computeAdvancedRiskScore } from "@/lib/riskEngine";
import { calculateProjection, calculateTargetAge } from "@/lib/utils/projection";
import { resolveAge } from "@/lib/utils/age";
import { formatMarketContext } from "@/lib/pio/greetings";
import type { PioAdvisorContextInput } from "@/lib/pio/persona";

const PILIER_LABELS: Record<string, string> = {
  PEA: "PEA / Actions",
  CRYPTO: "Crypto",
  IMMO: "Immobilier",
  AUTRE: "Autre (épargne/oblig.)",
};

/**
 * Construit le contexte enrichi passé à callPioAdvisor.
 * Ne lance pas d'appel Claude — pure agrégation de données.
 */
export async function getAdvisorContext(userId: string): Promise<PioAdvisorContextInput> {
  const [portfolio, user, market] = await Promise.all([
    getPortfolioSummary(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        objectif: true,
        ageActuel: true,
        dateNaissance: true,
        ageCible: true,
        epargneMensuelle: true,
        evolutionEpargne: true,
        objectifCroissance: true,
        allocationDetaillee: true,
        epargnePrecautionMontant: true,
        epargnePrecaution: true,
        risqueMaxPerte: true,
        niveauConnaissance: true,
      },
    }),
    fetchMarketSnapshot().catch(() => null),
  ]);

  const objectifEur = user?.objectif ?? 1_000_000;
  // Âge dérivé de la date de naissance (auto-actualisé), fallback legacy ageActuel.
  const ageActuel = user ? resolveAge(user) : null;

  // Ajustement matelas + % investissables + lignes d'allocation (helper partagé)
  const assembly = buildRiskScoreInput(portfolio, {
    epargnePrecautionMontant: user?.epargnePrecautionMontant ?? null,
    epargnePrecaution: user?.epargnePrecaution ?? null,
    epargneMensuelle: user?.epargneMensuelle ?? null,
    allocationDetaillee: user?.allocationDetaillee ?? null,
  });

  const risk = computeAdvancedRiskScore(assembly.input);
  const riskScore = risk.total;
  const riskLevel: "faible" | "modéré" | "élevé" =
    riskScore < 3.5 ? "faible" : riskScore < 5.5 ? "modéré" : "élevé";

  const patrimoineNet = assembly.patrimoineNet;
  const hasAssets =
    portfolio.totalValue > 0 || portfolio.piliers.some((p) => p.assets.length > 0);
  const patrimoineNetEur = hasAssets ? patrimoineNet : null;
  const progressPct =
    patrimoineNetEur != null && objectifEur > 0
      ? (patrimoineNetEur / objectifEur) * 100
      : null;

  // Trajectoire : âge d'atteinte de l'objectif au rythme actuel
  const targetAge =
    ageActuel != null && user?.epargneMensuelle != null
      ? calculateTargetAge(
          patrimoineNet,
          user.epargneMensuelle,
          user.evolutionEpargne ?? 0,
          user.objectifCroissance ?? 8,
          ageActuel,
          objectifEur
        )
      : null;

  // Projection à l'horizon "âge cible" (si renseigné)
  let projection: PioAdvisorContextInput["projection"] = null;
  if (ageActuel != null && user?.ageCible != null && user.ageCible > ageActuel) {
    const years = user.ageCible - ageActuel;
    const res = calculateProjection({
      currentValue: patrimoineNet,
      monthlySavings: user.epargneMensuelle ?? 0,
      annualRate: (user.objectifCroissance ?? 8) / 100,
      years,
      target: objectifEur,
    });
    projection = {
      horizonYears: years,
      projectedValueEur: res.projectedValue,
      reachable: res.reachable,
    };
  }

  const piliers = assembly.piliersNet.map((p) => ({
    label: PILIER_LABELS[p.pilier] ?? p.pilier,
    valueEur: p.totalValue,
    pct: p.percentage,
    targetPct: p.targetPercentage,
    gapPts: p.allocationGap,
  }));

  const assets = portfolio.piliers.flatMap((p) =>
    p.assets.map((a) => ({
      name: a.name,
      pilier: PILIER_LABELS[p.pilier] ?? p.pilier,
      valueEur: a.latestValue ?? null,
      pvPct: a.pvPct ?? null,
    }))
  );

  const nowLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date());

  return {
    nowLabel,
    objectifEur,
    patrimoineNetEur,
    progressPct,
    ageActuel,
    ageCible: user?.ageCible ?? null,
    epargneMensuelleEur: user?.epargneMensuelle ?? null,
    risqueMaxPerte: user?.risqueMaxPerte ?? null,
    niveauConnaissance: user?.niveauConnaissance ?? null,
    riskScore,
    riskLevel,
    riskComponents: {
      vol: risk.scoreVol,
      concentration: risk.scoreConcentration,
      liquidite: risk.scoreLiquidite,
      levier: risk.scoreLevier,
    },
    targetAge,
    projection,
    piliers,
    assets,
    marketLine: formatMarketContext(market),
  };
}
