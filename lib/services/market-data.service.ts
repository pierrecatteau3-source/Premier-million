/**
 * Service de données marché — SERVEUR UNIQUEMENT.
 * Récupère les indices boursiers (Alpha Vantage) et crypto (CoinGecko).
 * Ne throw jamais — retourne null sur chaque champ en cas d'échec.
 */

export interface MarketSnapshot {
  fetchedAt: string;
  indices: {
    cac40:  { value: number; change1d: number } | null;
    sp500:  { value: number; change1d: number } | null;
    nasdaq: { value: number; change1d: number } | null;
  };
  crypto: {
    btc: { priceEur: number; change24h: number } | null;
    eth: { priceEur: number; change24h: number } | null;
  };
}

const TIMEOUT_MS = 5000;

function withTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

async function fetchCrypto(): Promise<MarketSnapshot["crypto"]> {
  try {
    const key = process.env.COINGECKO_API_KEY;
    const headers: Record<string, string> = key
      ? { "x-cg-demo-api-key": key }
      : {};
    const res = await withTimeout(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true",
      { headers }
    );
    if (!res.ok) return { btc: null, eth: null };
    const data = await res.json() as Record<string, Record<string, number>>;
    return {
      btc: data.bitcoin
        ? { priceEur: data.bitcoin.eur, change24h: data.bitcoin.eur_24h_change }
        : null,
      eth: data.ethereum
        ? { priceEur: data.ethereum.eur, change24h: data.ethereum.eur_24h_change }
        : null,
    };
  } catch {
    return { btc: null, eth: null };
  }
}

async function fetchIndex(
  symbol: string,
  apiKey: string
): Promise<{ value: number; change1d: number } | null> {
  try {
    const res = await withTimeout(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json() as { "Global Quote"?: Record<string, string> };
    const q = data["Global Quote"];
    if (!q || !q["05. price"]) return null;
    return {
      value: parseFloat(q["05. price"]),
      change1d: parseFloat(q["10. change percent"]?.replace("%", "") ?? "0"),
    };
  } catch {
    return null;
  }
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY ?? "";

  const [cryptoResult, cac40Result, sp500Result, nasdaqResult] =
    await Promise.allSettled([
      fetchCrypto(),
      apiKey ? fetchIndex("%5EFCHI", apiKey) : Promise.resolve(null),
      apiKey ? fetchIndex("%5EGSPC", apiKey) : Promise.resolve(null),
      apiKey ? fetchIndex("%5EIXIC", apiKey) : Promise.resolve(null),
    ]);

  return {
    fetchedAt: new Date().toLocaleString("fr-FR"),
    indices: {
      cac40:  cac40Result.status  === "fulfilled" ? cac40Result.value  : null,
      sp500:  sp500Result.status  === "fulfilled" ? sp500Result.value  : null,
      nasdaq: nasdaqResult.status === "fulfilled" ? nasdaqResult.value : null,
    },
    crypto: cryptoResult.status === "fulfilled" ? cryptoResult.value : { btc: null, eth: null },
  };
}
