export interface PriceData {
  price: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  updatedAt: string;
  error?: "source_unavailable" | "timeout" | "not_found";
}
export type PriceMap = Record<string, PriceData>;

/** Point d'une mini-courbe de performance : prix coté à un instant donné. */
export interface SparkPoint {
  /** timestamp (ms) */
  t: number;
  /** prix (EUR) à cet instant */
  v: number;
}
/** Séries de prix par identifiant d'actif (id CoinGecko ou ticker Yahoo). */
export type SparklineMap = Record<string, SparkPoint[]>;
