import type { AchievementDef } from "@/types";
import type { AchievementContext } from "@/lib/services/achievements.service";

export type AchievementWithCriteria = AchievementDef & {
  criteria: (ctx: AchievementContext) => boolean;
};

/**
 * Catalogue des achievements — chaque ID est stable (changer un ID = perte
 * du déblocage en DB côté UserAchievement.achievementId).
 *
 * Noms : jeux de mots francophones quand possible.
 * Tiers : bronze (très accessible) → diamond (objectif final).
 */
export const ACHIEVEMENTS: AchievementWithCriteria[] = [

  // ════════════════════════════════════════════════════════════════════════════
  //  PORTEFEUILLE — Création, transactions, achats
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "premiers_pas",
    label: "Premiers pas",
    description: "Créer votre premier actif. Le voyage des mille bornes commence par un actif.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Footprints",
    criteria: (ctx) => ctx.assetCount >= 1,
  },
  {
    id: "premier_achat",
    label: "Baptême du marché",
    description: "Enregistrer une première transaction. Salut le marché, on se voit souvent.",
    category: "portefeuille",
    tier: "bronze",
    icon: "ShoppingCart",
    criteria: (ctx) => ctx.transactionCount >= 1,
  },
  {
    id: "boursicoteur",
    label: "Boursicoteur du dimanche",
    description: "10 transactions enregistrées. Le café du commerce est ouvert.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Coffee",
    criteria: (ctx) => ctx.transactionCount >= 10,
  },
  {
    id: "day_trader",
    label: "Day-trader du lundi",
    description: "50 transactions. T'as l'œil rivé sur les bougies maintenant ?",
    category: "portefeuille",
    tier: "silver",
    icon: "Activity",
    criteria: (ctx) => ctx.transactionCount >= 50,
  },
  {
    id: "carnet_dordres",
    label: "Carnet d'ordres",
    description: "100 transactions. Tu fais peur aux brokers.",
    category: "portefeuille",
    tier: "gold",
    icon: "ListOrdered",
    criteria: (ctx) => ctx.transactionCount >= 100,
  },
  {
    id: "investisseur_regulier",
    label: "Métronome",
    description: "Créer un investissement récurrent. Tic tac, tic tac, tu pèses.",
    category: "portefeuille",
    tier: "silver",
    icon: "RefreshCcw",
    criteria: (ctx) => ctx.recurringCount >= 1,
  },
  {
    id: "casse_pieds",
    label: "Casse-piliers",
    description: "5+ actifs. À ce stade tu connais le portail courtier par cœur.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Hammer",
    criteria: (ctx) => ctx.assetCount >= 5,
  },
  {
    id: "betonneur",
    label: "Bétonneur",
    description: "10+ actifs. Le portefeuille devient un chantier sérieux.",
    category: "portefeuille",
    tier: "silver",
    icon: "Construction",
    criteria: (ctx) => ctx.assetCount >= 10,
  },
  {
    id: "collectionneur",
    label: "Maître de la diversité",
    description: "20+ actifs. Tu collectionnes les ISIN comme les vignettes Panini.",
    category: "portefeuille",
    tier: "gold",
    icon: "Package2",
    criteria: (ctx) => ctx.assetCount >= 20,
  },
  {
    id: "tutti_frutti",
    label: "Tutti frutti",
    description: "8+ types d'actifs distincts. Le portefeuille fait fruit-mix.",
    category: "portefeuille",
    tier: "gold",
    icon: "Apple",
    criteria: (ctx) => ctx.distinctAssetTypes >= 8,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PATRIMOINE — Caps progressifs vers le million
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "pas_un_radis",
    label: "Pas un radis",
    description: "Patrimoine < 100 €. Pour commencer, c'est légal.",
    category: "patrimoine",
    tier: "bronze",
    icon: "Carrot",
    criteria: (ctx) => ctx.totalValue > 0 && ctx.totalValue < 100,
  },
  {
    id: "mille_bornes",
    label: "Mille bornes",
    description: "1 000 € de patrimoine. Le jeu commence vraiment.",
    category: "patrimoine",
    tier: "bronze",
    icon: "Milestone",
    criteria: (ctx) => ctx.totalValue >= 1_000,
  },
  {
    id: "decathlon",
    label: "Décathlon",
    description: "10 000 € — dix fois mille, dix fois plus solide.",
    category: "patrimoine",
    tier: "bronze",
    icon: "Medal",
    criteria: (ctx) => ctx.totalValue >= 10_000,
  },
  {
    id: "cinquantenaire",
    label: "Cinquantenaire",
    description: "50 000 € — un demi-cap, mais ça compte.",
    category: "patrimoine",
    tier: "silver",
    icon: "BarChart2",
    criteria: (ctx) => ctx.totalValue >= 50_000,
  },
  {
    id: "centurion",
    label: "Centurion",
    description: "100 000 € — la barre psychologique en armure.",
    category: "patrimoine",
    tier: "silver",
    icon: "ShieldCheck",
    criteria: (ctx) => ctx.totalValue >= 100_000,
  },
  {
    id: "quart_dheure_gloire",
    label: "Quart d'heure de gloire",
    description: "250 000 € — 1/4 de million, Warhol approuve.",
    category: "patrimoine",
    tier: "gold",
    icon: "Star",
    criteria: (ctx) => ctx.totalValue >= 250_000,
  },
  {
    id: "mi_temps",
    label: "Mi-temps",
    description: "500 000 € — la pause-vestiaire avant la seconde mi-temps.",
    category: "patrimoine",
    tier: "gold",
    icon: "Flag",
    criteria: (ctx) => ctx.totalValue >= 500_000,
  },
  {
    id: "quasi_quasi",
    label: "Quasi-quasi",
    description: "900 000 € — t'as un nez qui colle à la vitre.",
    category: "patrimoine",
    tier: "gold",
    icon: "Glasses",
    criteria: (ctx) => ctx.totalValue >= 900_000,
  },
  {
    id: "millionnaire",
    label: "Premier Million",
    description: "1 000 000 € — l'objectif. Bienvenue dans le club.",
    category: "patrimoine",
    tier: "diamond",
    icon: "Trophy",
    criteria: (ctx) => ctx.totalValue >= 1_000_000,
  },
  {
    id: "forbes_en_herbe",
    label: "Forbes en herbe",
    description: "Plus de 100 000 € investis cumulés. Y a du blé dans la coupe.",
    category: "patrimoine",
    tier: "silver",
    icon: "Sprout",
    criteria: (ctx) => ctx.totalInvested >= 100_000,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  DIVERSIFICATION & PILIERS
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "quatre_mousquetaires",
    label: "Les Quatre Mousquetaires",
    description: "Au moins un actif dans chacun des 4 piliers : PEA, Crypto, Immo, Autre.",
    category: "portefeuille",
    tier: "silver",
    icon: "Swords",
    criteria: (ctx) =>
      ctx.piliers.has("PEA") &&
      ctx.piliers.has("CRYPTO") &&
      ctx.piliers.has("IMMO") &&
      ctx.piliers.has("AUTRE"),
  },
  {
    id: "pierre_qui_roule",
    label: "Pierre qui roule…",
    description: "Aucun actif détenu actuellement. Bonne nouvelle : ça ne peut que remonter.",
    category: "secret",
    tier: "bronze",
    icon: "CircleSlash",
    hidden: true,
    criteria: (ctx) => ctx.assetCount === 0 && ctx.accountAgeDays >= 7,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  CRYPTO — spécifique
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "pas_trop_coin",
    label: "Pas-trop-coin",
    description: "Première crypto au portefeuille. Welcome to the rollercoaster.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Bitcoin",
    criteria: (ctx) => (ctx.assetCountByPilier["CRYPTO"] ?? 0) >= 1,
  },
  {
    id: "va_banque",
    label: "Va banque",
    description: "Plus de 30 % du portefeuille en crypto. T'as confiance en Satoshi.",
    category: "comportement",
    tier: "silver",
    icon: "Banknote",
    criteria: (ctx) => (ctx.piliersPct["CRYPTO"] ?? 0) > 30,
  },
  {
    id: "lune_ou_rien",
    label: "Lune ou rien",
    description: "Plus de 50 % du portefeuille en crypto. To the moon, ou à la rivière.",
    category: "comportement",
    tier: "gold",
    icon: "Rocket",
    criteria: (ctx) => (ctx.piliersPct["CRYPTO"] ?? 0) > 50,
  },
  {
    id: "yolo",
    label: "YOLO",
    description: "Plus de 80 % du portefeuille en crypto. On naît, on YOLO, on s'en remettra.",
    category: "secret",
    tier: "diamond",
    icon: "Flame",
    hidden: true,
    criteria: (ctx) => (ctx.piliersPct["CRYPTO"] ?? 0) > 80,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PEA / ACTIONS
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "patriote_economique",
    label: "Patriote économique",
    description: "Premier actif en PEA. Vive la République actionnariale.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Flag",
    criteria: (ctx) => (ctx.assetCountByPilier["PEA"] ?? 0) >= 1,
  },
  {
    id: "wall_streetois",
    label: "Wall-streetois",
    description: "Plus de 50 % du portefeuille en PEA. Boulevard des Italiens, c'est cool aussi.",
    category: "comportement",
    tier: "silver",
    icon: "TrendingUp",
    criteria: (ctx) => (ctx.piliersPct["PEA"] ?? 0) > 50,
  },
  {
    id: "dividende_heureux",
    label: "Dividende heureux",
    description: "5+ actifs distincts dans le pilier PEA. Tu touches le ratel.",
    category: "portefeuille",
    tier: "silver",
    icon: "HandCoins",
    criteria: (ctx) => (ctx.assetCountByPilier["PEA"] ?? 0) >= 5,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  IMMOBILIER
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "pierre_angulaire",
    label: "Pierre angulaire",
    description: "Premier actif immobilier. Pierre qui mousse n'amasse rien — sauf des loyers.",
    category: "portefeuille",
    tier: "bronze",
    icon: "Home",
    criteria: (ctx) => (ctx.assetCountByPilier["IMMO"] ?? 0) >= 1,
  },
  {
    id: "promoteur_herbe",
    label: "Promoteur en herbe",
    description: "Plus de 30 % du portefeuille en immobilier. Le béton t'a séduit.",
    category: "comportement",
    tier: "silver",
    icon: "Building2",
    criteria: (ctx) => (ctx.piliersPct["IMMO"] ?? 0) > 30,
  },
  {
    id: "roi_du_baton",
    label: "Roi du bâton",
    description: "3+ biens immobiliers. T'as le syndic dans le sang.",
    category: "portefeuille",
    tier: "gold",
    icon: "Crown",
    criteria: (ctx) => (ctx.assetCountByPilier["IMMO"] ?? 0) >= 3,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PRUDENCE / LIQUIDITÉS
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "tortue_prudente",
    label: "Tortue prudente",
    description: "Plus de 50 % en liquidités. Lente mais qui ne perdra pas la course.",
    category: "comportement",
    tier: "bronze",
    icon: "Turtle",
    criteria: (ctx) => (ctx.piliersPct["LIQUIDITE"] ?? 0) > 50,
  },
  {
    id: "matelas_plumes",
    label: "Matelas à plumes",
    description: "Plus de 80 % en liquidités. Tu dors bien la nuit.",
    category: "secret",
    tier: "silver",
    icon: "Bed",
    hidden: true,
    criteria: (ctx) => (ctx.piliersPct["LIQUIDITE"] ?? 0) > 80,
  },
  {
    id: "lievre_temeraire",
    label: "Lièvre téméraire",
    description: "Moins de 5 % en liquidités. Tout pour le risque.",
    category: "comportement",
    tier: "silver",
    icon: "Rabbit",
    criteria: (ctx) =>
      ctx.totalValue > 1000 &&
      (ctx.piliersPct["LIQUIDITE"] ?? 0) < 5,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  PROFIL — Configuration du compte
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "epargne_active",
    label: "Épargnant actif",
    description: "Renseigner une épargne mensuelle. Préparation = anticipation.",
    category: "profil",
    tier: "bronze",
    icon: "PiggyBank",
    criteria: (ctx) =>
      ctx.epargneMensuelle != null && ctx.epargneMensuelle > 0,
  },
  {
    id: "matelas_precaution",
    label: "Bouclier d'argent",
    description: "Renseigner une épargne de précaution. La trésorerie de guerre est prête.",
    category: "profil",
    tier: "bronze",
    icon: "Shield",
    criteria: (ctx) =>
      ctx.epargnePrecautionMontant != null && ctx.epargnePrecautionMontant > 0,
  },
  {
    id: "etat_civil",
    label: "État civil",
    description: "Profil complet : âge actuel, âge cible et épargne mensuelle renseignés.",
    category: "profil",
    tier: "silver",
    icon: "UserCheck",
    criteria: (ctx) =>
      ctx.ageActuel != null &&
      ctx.ageCible != null &&
      ctx.epargneMensuelle != null &&
      ctx.epargneMensuelle > 0,
  },
  {
    id: "pilote_dans_avion",
    label: "Pilote dans l'avion",
    description: "Définir une allocation cible détaillée. Cap, altitude, vitesse de croisière.",
    category: "profil",
    tier: "silver",
    icon: "Plane",
    criteria: (ctx) =>
      Array.isArray(ctx.allocationDetaillee) && ctx.allocationDetaillee.length > 0,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  ENGAGEMENT — Analyses, décisions
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "boule_de_cristal",
    label: "Boule de cristal",
    description: "Générer une première analyse Claude. L'IA voit ton avenir mieux que toi.",
    category: "engagement",
    tier: "silver",
    icon: "Telescope",
    criteria: (ctx) => ctx.analysisCount >= 1,
  },
  {
    id: "oracle",
    label: "Oracle de Delphes",
    description: "10 analyses Claude générées. Apollon t'envoie ses ondes.",
    category: "engagement",
    tier: "gold",
    icon: "Sparkles",
    criteria: (ctx) => ctx.analysisCount >= 10,
  },
  {
    id: "greffier",
    label: "Greffier",
    description: "Enregistrer une première décision stratégique. Tout est noté.",
    category: "engagement",
    tier: "bronze",
    icon: "BookOpen",
    criteria: (ctx) => ctx.decisionCount >= 1,
  },
  {
    id: "sage_depose",
    label: "Sage déposé",
    description: "10+ décisions stratégiques. Tu pourrais écrire un livre.",
    category: "engagement",
    tier: "gold",
    icon: "ScrollText",
    criteria: (ctx) => ctx.decisionCount >= 10,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  RÉGULARITÉ & TEMPS — Mois consécutifs, ancienneté
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rendez_vous_mensuel",
    label: "Rendez-vous mensuel",
    description: "3 mois consécutifs avec au moins une transaction. La régularité paie.",
    category: "regularite",
    tier: "bronze",
    icon: "CalendarDays",
    criteria: (ctx) => ctx.consecutiveMonthsWithTx >= 3,
  },
  {
    id: "demi_marathonien",
    label: "Demi-marathonien",
    description: "6 mois consécutifs avec transactions. Souffle long.",
    category: "regularite",
    tier: "silver",
    icon: "Footprints",
    criteria: (ctx) => ctx.consecutiveMonthsWithTx >= 6,
  },
  {
    id: "marathonien",
    label: "Marathonien",
    description: "12 mois consécutifs avec transactions. La distance complète.",
    category: "regularite",
    tier: "gold",
    icon: "Medal",
    criteria: (ctx) => ctx.consecutiveMonthsWithTx >= 12,
  },
  {
    id: "iron_man",
    label: "Iron Man",
    description: "24 mois consécutifs avec transactions. Cap des 2 ans.",
    category: "regularite",
    tier: "diamond",
    icon: "Shield",
    criteria: (ctx) => ctx.consecutiveMonthsWithTx >= 24,
  },
  {
    id: "anniversaire",
    label: "Bougie sur le gâteau",
    description: "1 an de présence sur Premier Million. Joyeux compte !",
    category: "regularite",
    tier: "silver",
    icon: "Cake",
    criteria: (ctx) => ctx.accountAgeDays >= 365,
  },
  {
    id: "noces_de_bois",
    label: "Noces de bois",
    description: "5 ans de fidélité au compte. Solide comme un chêne.",
    category: "regularite",
    tier: "diamond",
    icon: "TreePine",
    criteria: (ctx) => ctx.accountAgeDays >= 365 * 5,
  },
  {
    id: "carpe_diem",
    label: "Carpe diem",
    description: "Premier actif créé dans les 7 jours suivant l'inscription.",
    category: "regularite",
    tier: "bronze",
    icon: "Sunrise",
    criteria: (ctx) => ctx.assetCount >= 1 && ctx.accountAgeDays <= 7,
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  ANTI-TROPHIES & SECRETS — Les drôles
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "alzheimer_precoce",
    label: "Alzheimer précoce",
    description: "Aucune transaction depuis 3 mois (alors qu'il y en a eu avant). Tu as oublié quelque chose ?",
    category: "secret",
    tier: "bronze",
    icon: "Brain",
    hidden: true,
    criteria: (ctx) =>
      ctx.transactionCount >= 1 &&
      ctx.daysSinceLastTransaction !== null &&
      ctx.daysSinceLastTransaction >= 90,
  },
  {
    id: "hibernation",
    label: "Hibernation",
    description: "Aucune transaction depuis 6 mois. L'ours dort, le portefeuille dort.",
    category: "secret",
    tier: "silver",
    icon: "Bed",
    hidden: true,
    criteria: (ctx) =>
      ctx.transactionCount >= 1 &&
      ctx.daysSinceLastTransaction !== null &&
      ctx.daysSinceLastTransaction >= 180,
  },
  {
    id: "rip_van_winkle",
    label: "Rip Van Winkle",
    description: "Aucune transaction depuis 1 an. Tu as dormi à travers un bull market entier.",
    category: "secret",
    tier: "gold",
    icon: "Moon",
    hidden: true,
    criteria: (ctx) =>
      ctx.transactionCount >= 1 &&
      ctx.daysSinceLastTransaction !== null &&
      ctx.daysSinceLastTransaction >= 365,
  },
  {
    id: "bear_necessities",
    label: "Bear necessities",
    description: "Portefeuille en drawdown de plus de 30 %. Les essentiels d'un ours.",
    category: "secret",
    tier: "silver",
    icon: "TrendingDown",
    hidden: true,
    criteria: (ctx) => ctx.currentDrawdownPct >= 30,
  },
  {
    id: "catch_a_falling_knife",
    label: "Catch a falling knife",
    description: "Drawdown de plus de 50 %. La douleur t'a rendu plus sage. (Ou pas.)",
    category: "secret",
    tier: "gold",
    icon: "AlertTriangle",
    hidden: true,
    criteria: (ctx) => ctx.currentDrawdownPct >= 50,
  },
  {
    id: "cocorico",
    label: "Cocorico",
    description: "Plus haut patrimoine historique = patrimoine actuel. Tu chantes en haut du tas.",
    category: "comportement",
    tier: "silver",
    icon: "Award",
    criteria: (ctx) =>
      ctx.totalValue > 0 && ctx.peakValue > 0 && ctx.currentDrawdownPct < 1,
  },
  {
    id: "all_in",
    label: "All-in",
    description: "100 % du portefeuille concentré sur un seul pilier. Ovni du marché.",
    category: "secret",
    tier: "silver",
    icon: "Target",
    hidden: true,
    criteria: (ctx) => {
      const values = Object.values(ctx.piliersPct).filter((v) => v > 0);
      return ctx.totalValue > 1000 && values.length === 1 && values[0]! > 99;
    },
  },
  {
    id: "le_pari_de_pascal",
    label: "Le pari de Pascal",
    description: "Patrimoine entre 99 € et 101 €. Pour ou contre le marché ?",
    category: "secret",
    tier: "bronze",
    icon: "Dices",
    hidden: true,
    criteria: (ctx) => ctx.totalValue >= 99 && ctx.totalValue <= 101,
  },
  {
    id: "smic_millionnaire",
    label: "SMIC-millionnaire",
    description: "Patrimoine = 100 mois de SMIC net (≈ 145 000 €). T'as bossé l'équivalent.",
    category: "patrimoine",
    tier: "silver",
    icon: "Briefcase",
    criteria: (ctx) => ctx.totalValue >= 145_000,
  },
];
