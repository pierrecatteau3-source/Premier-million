/**
 * Enums partagés — miroir des enums Prisma, utilisables côté client et serveur.
 * Ne pas importer directement depuis lib/generated/prisma dans les composants client.
 */

export const PILIER = {
  PEA: "PEA",
  CRYPTO: "CRYPTO",
  IMMO: "IMMO",
  AUTRE: "AUTRE",
  LIQUIDITE: "LIQUIDITE",
} as const;

export type Pilier = (typeof PILIER)[keyof typeof PILIER];

export const HORIZON = {
  YEAR_1: "YEAR_1",
  YEAR_3: "YEAR_3",
  YEAR_5: "YEAR_5",
  YEAR_10: "YEAR_10",
} as const;

export type Horizon = (typeof HORIZON)[keyof typeof HORIZON];

// Labels affichables par pilier
export const PILIER_LABEL: Record<Pilier, string> = {
  PEA: "PEA",
  CRYPTO: "Crypto",
  IMMO: "Immobilier",
  AUTRE: "Autre",
  LIQUIDITE: "Compte courant",
};

// Labels affichables par horizon
export const HORIZON_LABEL: Record<Horizon, string> = {
  YEAR_1: "1 an",
  YEAR_3: "3 ans",
  YEAR_5: "5 ans",
  YEAR_10: "10 ans",
};

// Couleurs par pilier (Tailwind + hex pour les charts)
export const PILIER_COLOR: Record<Pilier, { tailwind: string; hex: string }> = {
  PEA: { tailwind: "bg-blue-500", hex: "#3b82f6" },
  CRYPTO: { tailwind: "bg-orange-500", hex: "#f97316" },
  IMMO: { tailwind: "bg-green-500", hex: "#22c55e" },
  AUTRE: { tailwind: "bg-gray-400", hex: "#9ca3af" },
  LIQUIDITE: { tailwind: "bg-cyan-500", hex: "#06b6d4" },
};

// Volatilité estimée par pilier (utilisée dans lib/risk.ts)
export const PILIER_VOLATILITY: Record<Pilier, number> = {
  PEA: 0.15,
  CRYPTO: 0.65,
  IMMO: 0.08,
  AUTRE: 0.05,
  // LIQUIDITE : exclu du calcul de risque — valeur nulle pour éviter toute contribution
  LIQUIDITE: 0,
};
