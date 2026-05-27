export interface PriceData {
  price: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  updatedAt: string;
  error?: "source_unavailable" | "timeout" | "not_found";
}
export type PriceMap = Record<string, PriceData>;
