export const ALLOCATION_TYPES = [
  {
    type: "PEA",
    pilier: "PEA" as const,
    subtypes: ["ETF Monde (PEA)", "Actions Françaises", "Actions Européennes", "Small Caps Européennes", "Fonds Actifs"],
  },
  {
    type: "Actions",
    pilier: "PEA" as const,
    subtypes: ["ETF Monde (CTO)", "Actions Dividendes", "Small Caps", "Marchés Émergents", "Titres vifs (Stock Picking)"],
  },
  {
    type: "Immobilier",
    pilier: "IMMO" as const,
    subtypes: ["Investissement Locatif", "SCPI / OPCI", "Crowdfunding Immobilier", "SIIC / REITs", "Résidence Principale"],
  },
  {
    type: "Obligations / Sécurité",
    pilier: "AUTRE" as const,
    subtypes: ["Fonds Euro", "Obligations d'État", "Obligations d'Entreprises", "Dette Privée"],
  },
  {
    type: "Épargne",
    pilier: "AUTRE" as const,
    subtypes: ["Livret A", "LDD / LDDS", "LEP", "Comptes à Terme", "Monétaire"],
  },
  {
    type: "Cash",
    pilier: "AUTRE" as const,
    subtypes: ["Compte courant", "Cash disponible"],
  },
  /**
   * Compte courant — pilier spécial LIQUIDITE.
   * Comptabilisé dans le patrimoine total mais exclu des piliers (PEA/Crypto/Immo/Autre),
   * des graphiques de répartition et des calculs de Risque & Atouts.
   */
  {
    type: "Compte courant",
    pilier: "LIQUIDITE" as const,
    subtypes: ["Compte courant", "Compte joint", "Compte pro"],
  },
  {
    type: "Crypto",
    pilier: "CRYPTO" as const,
    subtypes: ["Bitcoin (BTC)", "Ethereum (ETH)", "Altcoins", "Stablecoins (Staking)"],
  },
  {
    type: "Alternatifs",
    pilier: "AUTRE" as const,
    subtypes: ["Or et Métaux Précieux", "Private Equity", "Produits Structurés", "Art et Collection", "Matières Premières"],
  },
] as const;

export type AllocationType = typeof ALLOCATION_TYPES[number]["type"];
export type AllocationPilier = typeof ALLOCATION_TYPES[number]["pilier"];

export const TYPE_TO_PILIER = Object.fromEntries(
  ALLOCATION_TYPES.map((t) => [t.type, t.pilier])
) as Record<string, "PEA" | "CRYPTO" | "IMMO" | "AUTRE" | "LIQUIDITE">;
