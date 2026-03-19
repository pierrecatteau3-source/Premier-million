import type { Horizon } from "@/types";
import { HORIZON_LABEL } from "@/types";

interface PortfolioContext {
  totalValue: number;
  pea: number;       // % réel
  crypto: number;
  immo: number;
  autre: number;
}

interface UserContext {
  objectif: number;
  epargneMensuelle: number | null;
  allocationCible: { pea: number; crypto: number; immo: number; autre: number };
}

// Contexte utilisateur enrichi avec profil complet
interface UserProfileContext {
  objectif: number;
  ageActuel: number | null;
  ageCible: number | null;
  epargneMensuelle: number | null;
  risqueMaxPerte: number | null;
  niveauConnaissance: string | null;
  allocationCible: { pea: number; crypto: number; immo: number; autre: number };
}

// Actif individuel avec PMP et PV latente
interface AssetContext {
  name: string;
  pilier: string;
  latestValue: number | undefined;
  coutRevient: number | null;
  pmp: number | null;
  pvLatente: number | null;
}

// Pilier avec valeur totale et pourcentage
interface PilierContext {
  name: string;
  totalValue: number;
  percentage: number;
  targetPercentage: number;
}

interface EnrichedPortfolioContext {
  totalValue: number;
  piliers: PilierContext[];
  assets: AssetContext[];
}

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

/**
 * Prompt legacy (non-enrichi) — conservé pour compatibilité ascendante.
 * Utilisé uniquement si le contexte étendu n'est pas disponible.
 */
export function buildMarketAnalysisPrompt(
  horizon: Horizon,
  user: UserContext,
  portfolio: PortfolioContext
): string {
  const horizonLabel = HORIZON_LABEL[horizon];
  const progression = ((portfolio.totalValue / user.objectif) * 100).toFixed(1);
  const manquant = formatEur(Math.max(user.objectif - portfolio.totalValue, 0));

  return `Tu es un conseiller financier expert, spécialisé dans la gestion de patrimoine pour les investisseurs particuliers français. Tu analyses les marchés avec rigueur et donnes des conseils actionnables.

## Profil investisseur

- **Objectif patrimonial** : ${formatEur(user.objectif)}
- **Patrimoine actuel** : ${formatEur(portfolio.totalValue)} (${progression} % de l'objectif — encore ${manquant} à construire)
- **Épargne mensuelle** : ${user.epargneMensuelle ? formatEur(user.epargneMensuelle) : "Non renseignée"}

## Répartition actuelle du portefeuille

| Pilier | Réel | Cible | Écart |
|--------|------|-------|-------|
| PEA (actions) | ${portfolio.pea.toFixed(1)} % | ${user.allocationCible.pea} % | ${(portfolio.pea - user.allocationCible.pea).toFixed(1)} pt |
| Crypto | ${portfolio.crypto.toFixed(1)} % | ${user.allocationCible.crypto} % | ${(portfolio.crypto - user.allocationCible.crypto).toFixed(1)} pt |
| Immobilier | ${portfolio.immo.toFixed(1)} % | ${user.allocationCible.immo} % | ${(portfolio.immo - user.allocationCible.immo).toFixed(1)} pt |
| Autre (épargne) | ${portfolio.autre.toFixed(1)} % | ${user.allocationCible.autre} % | ${(portfolio.autre - user.allocationCible.autre).toFixed(1)} pt |

## Mission

Rédige une analyse macro pour un **horizon de ${horizonLabel}**, structurée ainsi :

### 1. Contexte macro actuel
Synthèse des grandes dynamiques économiques et géopolitiques pertinentes pour cet horizon. Sois concis et factuel.

### 2. Risques identifiés
Liste 3 à 5 risques concrets pour ce portefeuille sur l'horizon ${horizonLabel}. Pour chaque risque, précise quel pilier est exposé.

### 3. Opportunités pour ce profil
Liste 3 à 5 opportunités spécifiques compte tenu de la répartition actuelle et de l'écart à l'allocation cible. Sois précis et actionnable.

### 4. Conseil de positionnement
Recommandation synthétique : que faire dans les prochains ${horizonLabel} pour rapprocher ce portefeuille de l'objectif ? Priorise les actions selon leur impact potentiel.

---

**Contraintes de format** : Réponds en Markdown. Sois direct et pratique — évite les généralités. Limite-toi à 600 mots maximum. Ne fournis pas de conseil d'investissement au sens réglementaire : rappelle brièvement à la fin que cette analyse est indicative.`;
}

/**
 * Construit le prompt système enrichi (Analyse IA portefeuille) avec profil complet + portefeuille + actifs.
 * Retourne { systemPrompt, userMessage } pour callClaudeAnalysis().
 */
export function buildEnrichedAnalysisPrompt(
  horizon: Horizon,
  user: UserProfileContext,
  portfolio: EnrichedPortfolioContext
): { systemPrompt: string; userMessage: string } {
  const horizonLabel = HORIZON_LABEL[horizon];
  const progression = portfolio.totalValue > 0
    ? ((portfolio.totalValue / user.objectif) * 100).toFixed(1)
    : "0.0";
  const manquant = formatEur(Math.max(user.objectif - portfolio.totalValue, 0));
  const dateAnalyse = new Date().toLocaleDateString("fr-FR");

  const ageActuel = user.ageActuel ?? null;
  const ageCible = user.ageCible ?? null;
  const horizonAns = ageActuel != null && ageCible != null ? ageCible - ageActuel : null;

  // Lignes piliers
  const pilierLines = portfolio.piliers
    .map(
      (p) =>
        `- ${p.name} : ${formatEur(p.totalValue)} (${p.percentage.toFixed(1)}%) — cible ${p.targetPercentage}% — écart ${(p.percentage - p.targetPercentage).toFixed(1)} pt`
    )
    .join("\n");

  // Lignes actifs (uniquement ceux avec une valeur)
  const assetsWithValue = portfolio.assets.filter((a) => a.latestValue != null && a.latestValue > 0);
  const assetLines =
    assetsWithValue.length > 0
      ? assetsWithValue
          .map((a) => {
            const val = formatEur(a.latestValue ?? 0);
            const pmp = a.pmp != null ? `PMP ${formatEur(a.pmp)}` : "PMP non renseigné";
            const pv =
              a.pvLatente != null
                ? `PV latente ${a.pvLatente >= 0 ? "+" : ""}${formatEur(a.pvLatente)}`
                : "PV latente inconnue";
            return `- ${a.name} [${a.pilier}] : ${val} — ${pmp} — ${pv}`;
          })
          .join("\n")
      : "- Aucun actif valorisé";

  const profilAge = ageActuel != null && horizonAns != null
    ? `L'investisseur est jeune (${ageActuel} ans) avec un horizon long (${horizonAns} ans). Il peut et doit prendre des risques calculés pour maximiser la croissance de son capital. Adapte tes conseils en conséquence : privilégie les actifs de croissance, l'exposition aux secteurs innovants, et ne te limite pas aux recommandations conservatrices.`
    : "";

  const systemPrompt = `Tu es un conseiller financier personnel expert en investissement long terme pour des particuliers français.
Tu analyses le portefeuille d'un investisseur pour l'aider à atteindre son objectif de ${formatEur(user.objectif)}.
Tu es factuel, concis et pratique. Tes conseils sont personnalisés, jamais génériques.
${profilAge ? `\n${profilAge}` : ""}

PROFIL INVESTISSEUR :
- Âge actuel : ${ageActuel != null ? `${ageActuel} ans` : "non renseigné"} | Âge cible : ${ageCible != null ? `${ageCible} ans` : "non renseigné"}${horizonAns != null ? ` (horizon ${horizonAns} ans)` : ""}
- Épargne mensuelle : ${user.epargneMensuelle != null ? formatEur(user.epargneMensuelle) + "/mois" : "non renseignée"}
- Tolérance au risque : ${user.risqueMaxPerte != null ? `${user.risqueMaxPerte}% de perte maximale acceptable` : "non renseignée"}
- Niveau de connaissance : ${user.niveauConnaissance ?? "non renseigné"}
- Allocation cible : PEA ${user.allocationCible.pea}% | Crypto ${user.allocationCible.crypto}% | Immo ${user.allocationCible.immo}% | Autre ${user.allocationCible.autre}%

PORTEFEUILLE ACTUEL (total : ${formatEur(portfolio.totalValue)} — ${progression}% de l'objectif — ${manquant} restant) :
${pilierLines}

ACTIFS DÉTENUS :
${assetLines}

DATE D'ANALYSE : ${dateAnalyse}
HORIZON DEMANDÉ : ${horizonLabel}`;

  const userMessage = `Génère une analyse structurée en Markdown pour mon portefeuille sur un horizon de ${horizonLabel}.

L'analyse doit couvrir exactement ces sections :

## Bilan de situation
Évalue ma progression vers l'objectif de ${formatEur(user.objectif)}${ageActuel != null && ageCible != null ? `. Projette l'atteinte de l'objectif en tenant compte de mon âge (${ageActuel} ans) et de mon âge cible (${ageCible} ans)` : ""}. Compare ma répartition actuelle à l'allocation cible. Identifie les écarts significatifs.

## Points forts du portefeuille
Liste 2 à 3 atouts concrets de ma situation actuelle (diversification, PV latentes positives, épargne mensuelle, actifs performants, etc.).

## Points de vigilance
Liste 3 à 5 risques concrets sur l'horizon ${horizonLabel}. Pour chaque risque, précise quel actif ou pilier est exposé et pourquoi.

## Recommandations pour l'horizon ${horizonLabel}
Donne 3 à 5 actions prioritaires et actionnables pour les prochains ${horizonLabel}. Chaque recommandation doit être spécifique à ma situation (pas de conseils génériques).

## Conseil d'investissement personnalisé
${ageActuel != null ? `En tant qu'investisseur jeune (${ageActuel} ans) avec un horizon long terme (${horizonAns != null ? horizonAns + " ans" : "long"}), ` : ""}donne-moi un conseil d'investissement personnalisé tenant compte de mon profil de risque, de mon allocation actuelle et de mon objectif. Oriente vers les actifs de croissance et les opportunités à saisir sur la durée. Sois direct et actionnable.

---

Contraintes : Markdown propre avec les titres ## exacts ci-dessus, 800 mots maximum, conseils personnalisés à ma situation exacte. Termine par une courte mention que cette analyse est indicative et ne constitue pas un conseil en investissement au sens réglementaire.`;

  return { systemPrompt, userMessage };
}

/**
 * Construit le prompt pour la Vision Marché — veille opportunités technologiques émergentes.
 * Retourne { systemPrompt, userMessage } pour callClaudeAnalysis().
 */
export function buildMarketVisionPrompt(
  horizon: Horizon,
  user: UserProfileContext,
  portfolio: EnrichedPortfolioContext
): { systemPrompt: string; userMessage: string } {
  const horizonLabel = HORIZON_LABEL[horizon];
  const dateAnalyse = new Date().toLocaleDateString("fr-FR");

  const ageActuel = user.ageActuel ?? null;
  const ageCible = user.ageCible ?? null;
  const horizonAns = ageActuel != null && ageCible != null ? ageCible - ageActuel : null;

  const systemPrompt = `Tu es un expert en veille technologique et investissement thématique pour particuliers français.
Tu analyses les tendances des secteurs technologiques émergents à fort potentiel de croissance sur le long terme.
Tu es factuel, précis et orienté vers l'action. Tu connais les marchés boursiers, les ETF thématiques, et les véhicules d'investissement accessibles aux particuliers (PEA, CTO, etc.).
Date d'analyse : ${dateAnalyse}.
${ageActuel != null ? `L'investisseur a ${ageActuel} ans${horizonAns != null ? ` avec un horizon de ${horizonAns} ans` : ""}. Il peut et doit prendre des risques calculés sur les secteurs innovants pour maximiser la croissance long terme.` : ""}

PROFIL INVESTISSEUR :
- Âge : ${ageActuel != null ? `${ageActuel} ans` : "non renseigné"}${ageCible != null ? ` | Âge cible : ${ageCible} ans` : ""}
- Tolérance au risque : ${user.risqueMaxPerte != null ? `${user.risqueMaxPerte}% de perte maximale acceptable` : "élevée (non précisée)"}
- Niveau de connaissance : ${user.niveauConnaissance ?? "non renseigné"}
- Patrimoine total : ${formatEur(portfolio.totalValue)} | Objectif : ${formatEur(user.objectif)}
- Allocation actuelle : ${portfolio.piliers.map((p) => `${p.name} ${p.percentage.toFixed(0)}%`).join(", ")}
- Horizon d'analyse demandé : ${horizonLabel}`;

  const userMessage = `Génère une veille structurée en Markdown sur les opportunités technologiques émergentes pour un investisseur particulier français.

L'analyse doit couvrir exactement ces sections :

## Opportunités technologiques émergentes
Analyse les secteurs suivants avec leur stade de maturité, les principaux acteurs cotés et les dynamiques actuelles (date : ${dateAnalyse}) :

**1. Informatique quantique**
Entreprises cotées, ETF, maturité commerciale estimée, catalyseurs récents.

**2. Photonique & semi-conducteurs optiques**
Acteurs clés, dynamique du secteur, applications industrielles et leur traction.

**3. Intelligence artificielle & infrastructure**
Opportunités au-delà des géants (GAFAM) : fournisseurs d'infrastructure, puces spécialisées, logiciels verticaux.

**4. Biotech & medtech**
Innovation de rupture à horizon 5-10 ans, thérapies géniques, diagnostics IA, acteurs émergents.

**5. Spatial & défense**
Acteurs privés cotés, accélération budgétaire, applications commerciales (connectivité, observation).

**6. Autres secteurs à potentiel**
Selon l'actualité à la date d'analyse : énergie propre, robotique, matériaux avancés, fintech, etc.

## Comment investir sur ces thématiques
Pour chaque thématique pertinente : ETF thématiques disponibles (nom, ticker si connu), actions directes accessibles, niveau de risque (1-5), éligibilité PEA ou CTO uniquement. Sois précis sur l'accessibilité pour un investisseur français.

## Avis personnalisé
${ageActuel != null ? `En tant qu'investisseur de ${ageActuel} ans avec un horizon long terme (${horizonAns != null ? horizonAns + " ans" : "long"}), ` : ""}compte tenu de mon allocation actuelle et de mon profil, quelles thématiques prioriser en priorité ? Donne un classement des 3 meilleures opportunités pour mon profil avec une justification concrète.

---

Contraintes : Markdown propre avec les titres ## et ** exacts ci-dessus, 900 mots maximum, informations factuelles et récentes (basées sur tes données jusqu'à ta date de coupure). Mentionne en fin d'analyse que les informations sont basées sur tes données d'entraînement et peuvent ne pas refléter les évolutions les plus récentes du marché.`;

  return { systemPrompt, userMessage };
}

// Re-export des types pour usage externe
export type { UserProfileContext, EnrichedPortfolioContext, AssetContext, PilierContext };
