import type { Horizon } from "@/types";
import { HORIZON_LABEL } from "@/types";
import type { MarketSnapshot } from "@/lib/services/market-data.service";

interface AnalysisOptions {
  marketData?: MarketSnapshot | null;
  contextDocuments?: { filename: string; content: string }[];
}

function buildMarketDataBlock(marketData?: MarketSnapshot | null): string {
  if (!marketData) return "";

  const fmt = (v: number | null, unit = "") =>
    v != null ? `${v.toLocaleString("fr-FR")}${unit}` : "indisponible";
  const fmtChange = (v: number | null) =>
    v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "n/a";

  return `
DONNÉES MARCHÉ EN TEMPS RÉEL (${marketData.fetchedAt}) :
- CAC40  : ${fmt(marketData.indices.cac40?.value ?? null)} pts (${fmtChange(marketData.indices.cac40?.change1d ?? null)} / 24h)
- S&P500 : ${fmt(marketData.indices.sp500?.value ?? null)} pts (${fmtChange(marketData.indices.sp500?.change1d ?? null)} / 24h)
- NASDAQ : ${fmt(marketData.indices.nasdaq?.value ?? null)} pts (${fmtChange(marketData.indices.nasdaq?.change1d ?? null)} / 24h)
- Bitcoin  : ${fmt(marketData.crypto.btc?.priceEur ?? null, "€")} (${fmtChange(marketData.crypto.btc?.change24h ?? null)} / 24h)
- Ethereum : ${fmt(marketData.crypto.eth?.priceEur ?? null, "€")} (${fmtChange(marketData.crypto.eth?.change24h ?? null)} / 24h)

`;
}

function buildContextDocsBlock(
  docs?: { filename: string; content: string }[]
): string {
  if (!docs || docs.length === 0) return "";

  const sections = docs
    .map((d) => `--- ${d.filename} ---\n${d.content}`)
    .join("\n\n");

  return `
DOCUMENTS DE CONTEXTE FOURNIS PAR L'UTILISATEUR :
Ces documents contiennent des recherches approfondies que l'utilisateur a réalisées.
Priorise ces informations dans ton analyse — elles sont plus récentes que tes données d'entraînement.

${sections}

`;
}

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
 * Retourne les instructions de focus spécifiques à chaque horizon pour buildEnrichedAnalysisPrompt.
 * Chaque horizon produit des recommandations qualitativement différentes.
 */
function getHorizonFocusPortfolio(horizon: Horizon): {
  systemAddendum: string;
  userAddendum: string;
} {
  switch (horizon) {
    case "YEAR_1":
      return {
        systemAddendum: `FOCUS HORIZON 1 AN :
Tu analyses la situation tactique immédiate. Sur cet horizon, les mouvements de marché de court terme (cycles crypto, corrections boursières, taux d'intérêt) sont déterminants. Priorise : la gestion du cash disponible, le rééquilibrage urgent des écarts d'allocation > 10 pts, les opportunités d'entrée sur les actifs sous-pondérés. Évite de recommander des changements structurels lourds — cet horizon est celui de l'exécution tactique, pas de la stratégie long terme.`,
        userAddendum: `Focus sur les 12 prochains mois : quelles actions concrètes et immédiates (dans les semaines à venir) me permettraient d'optimiser mon portefeuille ? Identifie les rééquilibrages urgents, les actifs à renforcer ou réduire maintenant, et les catalyseurs de marché à surveiller sur les 12 prochains mois.`,
      };

    case "YEAR_3":
      return {
        systemAddendum: `FOCUS HORIZON 3 ANS :
Sur cet horizon, les cycles de marché crypto (typiquement 3-4 ans entre halvings Bitcoin) et les cycles économiques classiques sont pleinement visibles. Tu dois raisonner en termes de cycles : où en est-on dans le cycle crypto ? Où en est le cycle des taux ? Quel est le meilleur timing pour déployer du capital dans chaque pilier ? Recommande des stratégies d'accumulation programmée (DCA), de diversification sectorielle dans le PEA, et d'initiation ou renforcement de positions immobilières si pertinent. Cet horizon est celui du compounding : chaque euro investi aujourd'hui doit maximiser sa croissance sur 36 mois.`,
        userAddendum: `Focus sur les 3 prochaines années : comment optimiser mon allocation pour tirer parti des cycles de marché actuels (crypto, actions, immobilier) ? Donne-moi une stratégie d'accumulation progressive avec des jalons annuels. Quels secteurs et actifs renforcer en priorité pour maximiser la croissance composée sur cet horizon ?`,
      };

    case "YEAR_5":
      return {
        systemAddendum: `FOCUS HORIZON 5 ANS :
Sur 5 ans, la construction structurelle du portefeuille prime sur le timing. Tes recommandations doivent porter sur : l'allocation stratégique cible (est-elle bien calibrée pour un objectif de 1M€ ?), les thématiques d'investissement à fort potentiel de croissance sur 5 ans (IA, énergies, biotech, marchés émergents), la fiscalité optimisée (PEA plafond, enveloppes fiscales), et l'effet de levier raisonnable (immobilier à crédit). Évalue si le rythme d'épargne actuel est suffisant pour atteindre l'objectif et propose des ajustements structurels. Cet horizon est celui de la construction patrimoniale — chaque décision doit être réfléchie sur la durée.`,
        userAddendum: `Focus sur les 5 prochaines années : mon allocation actuelle et mon rythme d'épargne sont-ils cohérents avec l'objectif de 1M€ ? Quels ajustements structurels apporter à mon portefeuille ? Quelles thématiques d'investissement à 5 ans sont les plus prometteuses pour mon profil ? Évalue aussi l'optimisation fiscale de mon portefeuille (PEA, enveloppes, timing des plus-values).`,
      };

    case "YEAR_10":
      return {
        systemAddendum: `FOCUS HORIZON 10 ANS :
Sur 10 ans, les fondamentaux long terme dominent : l'effet des intérêts composés, les mégatendances technologiques et démographiques, et la solidité des thèses d'investissement de conviction. Tes recommandations doivent être de nature stratégique et visionnaire : quels secteurs seront dominants dans 10 ans ? Comment positionner un portefeuille pour capturer des rendements asymétriques ? Aborde la diversification géographique, les actifs alternatifs, et la progressivité du profil de risque selon l'âge. Sur cet horizon, l'investisseur jeune doit maintenir une tolérance au risque élevée et éviter les erreurs de sur-prudence. Oriente vers les convictions fortes et les positions de long terme.`,
        userAddendum: `Focus sur les 10 prochaines années : quelles sont mes convictions d'investissement les plus importantes pour construire 1M€ ? Quels mégatendances et secteurs devraient être sur-pondérés dans mon portefeuille sur la décennie ? Comment dois-je faire évoluer mon allocation au fil des années ? Donne-moi une vision stratégique de long terme — pas des conseils de court terme — avec les positions de conviction à construire dès maintenant.`,
      };
  }
}

/**
 * Retourne les instructions de focus spécifiques à chaque horizon pour buildMarketVisionPrompt.
 */
function getHorizonFocusMarket(horizon: Horizon): {
  systemAddendum: string;
  userAddendum: string;
} {
  switch (horizon) {
    case "YEAR_1":
      return {
        systemAddendum: `FOCUS VEILLE MARCHÉ 1 AN :
Concentre-toi sur les catalyseurs immédiats et les opportunités d'entrée à court terme dans les secteurs technologiques. Quels secteurs tech sont en train d'amorcer une accélération dans les 12 prochains mois ? Quels événements calendaires (lancements produits, régulations, résultats trimestriels, halvings) sont des catalyseurs proches ? Fournis des noms d'ETF ou d'actions accessibles immédiatement avec des points d'entrée pertinents.`,
        userAddendum: `Sur les 12 prochains mois : quelles opportunités tech puis-je saisir maintenant ? Quels sont les catalyseurs immédiats à surveiller dans l'IA, la crypto, les semi-conducteurs et les autres secteurs innovants ? Donne-moi des noms d'ETF ou d'actions avec une justification d'entrée à court terme.`,
      };

    case "YEAR_3":
      return {
        systemAddendum: `FOCUS VEILLE MARCHÉ 3 ANS :
Analyse les secteurs technologiques dont le cycle de maturité atteindra son pic dans 3 ans. Identifie les technologies qui passent du stade "early adopters" au mainstream. Sur cet horizon, le timing d'entrée reste important mais la dynamique de croissance du secteur prime. Analyse en détail les cycles d'adoption, les acteurs qui consolident leur avance, et les points d'inflexion attendus dans 18-36 mois (IA générative, quantique, spatial, biotech CRISPR, etc.).`,
        userAddendum: `Sur 3 ans : quels secteurs technologiques sont en phase d'accélération et devraient atteindre leur maturité commerciale ? Quels acteurs consolident leur position dominante ? Donne-moi une analyse des cycles d'adoption et des meilleures façons d'y être exposé via ETF ou actions directes sur 3 ans.`,
      };

    case "YEAR_5":
      return {
        systemAddendum: `FOCUS VEILLE MARCHÉ 5 ANS :
Sur 5 ans, les thématiques d'investissement tech doivent être sélectionnées pour leur potentiel structurel, pas leur momentum actuel. Analyse les technologies dont les fondamentaux économiques (TAM, barrières à l'entrée, modèles de récurrence) justifient une croissance soutenue sur 5 ans. Recommande une construction de portefeuille thématique diversifiée entre thèmes matures (IA infra) et thèmes émergents (quantique, spatial). Intègre la dimension de diversification géographique (US vs Europe vs Asie).`,
        userAddendum: `Sur 5 ans : comment construire une exposition thématique tech structurée et diversifiée ? Quelles thématiques méritent une conviction forte à 5 ans et lesquelles sont trop spéculatives ? Comment équilibrer entre secteurs tech matures et émergents dans mon portefeuille ? Donne-moi une construction de portefeuille thématique cohérente pour cet horizon.`,
      };

    case "YEAR_10":
      return {
        systemAddendum: `FOCUS VEILLE MARCHÉ 10 ANS :
Sur 10 ans, les mégatendances technologiques de rupture sont le sujet. Identifie les technologies qui vont remodeler l'économie mondiale d'ici 2035 : IA générale, ordinateurs quantiques, fusion nucléaire, ingénierie génétique, robotique autonome, interfaces cerveau-machine. Pour chaque mégatendance, évalue la probabilité de matérialisation sur 10 ans, les acteurs actuels positionnés pour en bénéficier, et les vecteurs d'investissement accessibles aujourd'hui (même si le marché n'est pas encore mature). L'investisseur de 10 ans doit accepter plus d'incertitude en échange d'un potentiel de rendement exceptionnel.`,
        userAddendum: `Sur 10 ans : quelles sont les mégatendances technologiques de rupture qui vont créer le plus de valeur d'ici 2035 ? Comment puis-je m'y exposer aujourd'hui, même si ces marchés sont encore embryonnaires ? Donne-moi une vision de long terme sur les technologies qui redéfiniront l'économie et les meilleures façons d'y investir maintenant pour maximiser la croissance sur une décennie.`,
      };
  }
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
 * Les instructions de focus varient qualitativement selon l'horizon choisi.
 */
export function buildEnrichedAnalysisPrompt(
  horizon: Horizon,
  user: UserProfileContext,
  portfolio: EnrichedPortfolioContext,
  options: AnalysisOptions = {}
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

  const { systemAddendum, userAddendum } = getHorizonFocusPortfolio(horizon);

  const systemPrompt = `Tu es un conseiller financier personnel expert en investissement long terme pour des particuliers français.
Tu analyses le portefeuille d'un investisseur pour l'aider à atteindre son objectif de ${formatEur(user.objectif)}.
Tu es factuel, concis et pratique. Tes conseils sont personnalisés, jamais génériques.
${profilAge ? `\n${profilAge}` : ""}

${systemAddendum}

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

${buildMarketDataBlock(options.marketData)}${buildContextDocsBlock(options.contextDocuments)}DATE D'ANALYSE : ${dateAnalyse}
HORIZON DEMANDÉ : ${horizonLabel}`;

  const userMessage = `Génère une analyse structurée en Markdown pour mon portefeuille sur un horizon de ${horizonLabel}.

${userAddendum}

L'analyse doit couvrir exactement ces sections :

## Bilan de situation
Évalue ma progression vers l'objectif de ${formatEur(user.objectif)}${ageActuel != null && ageCible != null ? `. Projette l'atteinte de l'objectif en tenant compte de mon âge (${ageActuel} ans) et de mon âge cible (${ageCible} ans)` : ""}. Compare ma répartition actuelle à l'allocation cible. Identifie les écarts significatifs.

## Points forts du portefeuille
Liste 2 à 3 atouts concrets de ma situation actuelle (diversification, PV latentes positives, épargne mensuelle, actifs performants, etc.).

## Points de vigilance
Liste 3 à 5 risques concrets sur l'horizon ${horizonLabel}. Pour chaque risque, précise quel actif ou pilier est exposé et pourquoi.

## Recommandations pour l'horizon ${horizonLabel}
Donne 3 à 5 actions prioritaires et actionnables pour les prochains ${horizonLabel}. Chaque recommandation doit être spécifique à ma situation (pas de conseils génériques). Adapte le niveau d'urgence et la granularité au caractère ${horizon === "YEAR_1" ? "tactique et immédiat" : horizon === "YEAR_3" ? "cyclique et de moyen terme" : horizon === "YEAR_5" ? "structurel et de construction patrimoniale" : "stratégique et de conviction long terme"} de cet horizon.

## Conseil d'investissement personnalisé
${ageActuel != null ? `En tant qu'investisseur jeune (${ageActuel} ans) avec un horizon long terme (${horizonAns != null ? horizonAns + " ans" : "long"}), ` : ""}donne-moi un conseil d'investissement personnalisé tenant compte de mon profil de risque, de mon allocation actuelle et de mon objectif. Oriente vers les actifs de croissance et les opportunités à saisir sur la durée. Sois direct et actionnable.

## Récapitulatif
Synthétise les points clés de l'analyse dans un tableau Markdown avec exactement ces colonnes : | Indicateur | Valeur | Interprétation |. 5 à 8 lignes maximum.

## Stratégies d'investissement (PEA uniquement)
Propose trois stratégies concrètes et actionnables, adaptées à mon profil et à l'horizon ${horizonLabel} :

### Modéré
- ETF éligibles PEA recommandés (nom + ticker)
- Actions éligibles PEA recommandées (nom + ticker)
- Allocation suggérée en % entre ETF et actions
- Justification courte

### Risqué
- ETF éligibles PEA recommandés (nom + ticker)
- Actions éligibles PEA recommandées (nom + ticker)
- Allocation suggérée en % entre ETF et actions
- Justification courte

### Très risqué
- ETF éligibles PEA recommandés (nom + ticker)
- Actions éligibles PEA recommandées (nom + ticker)
- Allocation suggérée en % entre ETF et actions
- Justification courte

---

Contraintes : Markdown propre avec les titres ## exacts ci-dessus, conseils personnalisés à ma situation exacte. Termine par une courte mention que cette analyse est indicative et ne constitue pas un conseil en investissement au sens réglementaire.`;

  return { systemPrompt, userMessage };
}

/**
 * Construit le prompt pour la Vision Marché — veille opportunités technologiques émergentes.
 * Retourne { systemPrompt, userMessage } pour callClaudeAnalysis().
 * Le focus et la granularité varient qualitativement selon l'horizon.
 */
export function buildMarketVisionPrompt(
  horizon: Horizon,
  user: UserProfileContext,
  portfolio: EnrichedPortfolioContext,
  options: AnalysisOptions = {}
): { systemPrompt: string; userMessage: string } {
  const horizonLabel = HORIZON_LABEL[horizon];
  const dateAnalyse = new Date().toLocaleDateString("fr-FR");

  const ageActuel = user.ageActuel ?? null;
  const ageCible = user.ageCible ?? null;
  const horizonAns = ageActuel != null && ageCible != null ? ageCible - ageActuel : null;

  const { systemAddendum, userAddendum } = getHorizonFocusMarket(horizon);

  const systemPrompt = `Tu es un expert en veille technologique et investissement thématique pour particuliers français.
Tu analyses les tendances des secteurs technologiques émergents à fort potentiel de croissance sur le long terme.
Tu es factuel, précis et orienté vers l'action. Tu connais les marchés boursiers, les ETF thématiques, et les véhicules d'investissement accessibles aux particuliers (PEA, CTO, etc.).
Date d'analyse : ${dateAnalyse}.
${ageActuel != null ? `L'investisseur a ${ageActuel} ans${horizonAns != null ? ` avec un horizon de ${horizonAns} ans` : ""}. Il peut et doit prendre des risques calculés sur les secteurs innovants pour maximiser la croissance long terme.` : ""}

${systemAddendum}

PROFIL INVESTISSEUR :
- Âge : ${ageActuel != null ? `${ageActuel} ans` : "non renseigné"}${ageCible != null ? ` | Âge cible : ${ageCible} ans` : ""}
- Tolérance au risque : ${user.risqueMaxPerte != null ? `${user.risqueMaxPerte}% de perte maximale acceptable` : "élevée (non précisée)"}
- Niveau de connaissance : ${user.niveauConnaissance ?? "non renseigné"}
- Patrimoine total : ${formatEur(portfolio.totalValue)} | Objectif : ${formatEur(user.objectif)}
- Allocation actuelle : ${portfolio.piliers.map((p) => `${p.name} ${p.percentage.toFixed(0)}%`).join(", ")}
- Horizon d'analyse demandé : ${horizonLabel}

${buildMarketDataBlock(options.marketData)}${buildContextDocsBlock(options.contextDocuments)}DATE D'ANALYSE : ${dateAnalyse}`;

  const userMessage = `Génère une veille structurée en Markdown sur les opportunités technologiques émergentes pour un investisseur particulier français.

${userAddendum}

L'analyse doit couvrir exactement ces sections :

## Opportunités technologiques émergentes
Pour chacun des 6 secteurs, rédige 4-6 phrases : stade de maturité actuel, 2-3 acteurs cotés clés (nom + ticker + éligibilité PEA oui/non), catalyseur principal sur ${horizonLabel}, niveau de risque (1-5) et une phrase de synthèse. Pas de tableau par secteur.

**1. Informatique quantique**
**2. Photonique & semi-conducteurs optiques**
**3. Intelligence artificielle & infrastructure** (au-delà des GAFAM : puces, software vertical, infra)
**4. Biotech & medtech** (thérapies géniques, diagnostics IA)
**5. Spatial & défense**
**6. Autres secteurs à potentiel** (énergie propre, robotique, matériaux avancés)

## Avis personnalisé
${ageActuel != null ? `En tant qu'investisseur de ${ageActuel} ans avec un horizon de ${horizonAns != null ? horizonAns + " ans" : "long terme"}, ` : ""}classe les 3 meilleures thématiques pour mon profil sur ${horizonLabel}. Pour chacune : nom du secteur, pourquoi c'est prioritaire pour moi, une action ou ETF PEA concret à privilégier.

## Récapitulatif global
Tableau Markdown : | Secteur | Stade de maturité | Risque (1-5) | Meilleur actif PEA | Horizon optimal | Priorité |
6 lignes (une par secteur).

## Stratégies d'investissement (PEA uniquement)
Trois stratégies adaptées à mon profil et à l'horizon ${horizonLabel} :

### Modéré
- 2 ETF PEA (nom + ticker)
- 2 actions PEA (nom + ticker)
- Allocation % entre ETF et actions
- Justification en 2 phrases

### Risqué
- 2 ETF PEA (nom + ticker)
- 3 actions PEA (nom + ticker)
- Allocation %
- Justification en 2 phrases

### Très risqué
- 1 ETF PEA (nom + ticker)
- 4 actions PEA (nom + ticker)
- Allocation %
- Justification en 2 phrases

---

Contraintes : Markdown propre, titres ## et ### exacts, 4-6 phrases par secteur (ni plus ni moins). Mentionne en fin que les informations sont basées sur les données d'entraînement.`;

  return { systemPrompt, userMessage };
}

// Re-export des types pour usage externe
export type { UserProfileContext, EnrichedPortfolioContext, AssetContext, PilierContext };
