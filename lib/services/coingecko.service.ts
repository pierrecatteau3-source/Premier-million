/**
 * Service CoinGecko — SERVEUR UNIQUEMENT.
 *
 * Centralise TOUS les appels prix crypto (live + historique) avec la même
 * robustesse que lib/services/yahoo.service.ts : timeout, retry (sur 429 / 5xx),
 * rejet systématique des prix `null` / `<= 0`, gestion de la clé API demo.
 *
 * Avant : le fetch CoinGecko était dupliqué inline dans ~6 routes, chacune en un
 * seul essai sans retry → un blip / rate-limit faisait sauter le snapshot et
 * « gelait » la courbe (même cause que côté Yahoo).
 *
 * Ne throw jamais — renvoie null / [] en cas d'échec, et log un warn.
 */

const BASE = "https://api.coingecko.com/api/v3";
const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 600;
/** Cache Next : 1 appel réel / URL identique / heure (limite le rate-limit demo). */
const REVALIDATE_S = 3_600;
/**
 * Le tier public/demo limite l'historique market_chart à ~365 jours. Au-delà,
 * l'API renvoie une erreur → on borne pour rester fiable (les jours plus anciens
 * retombent sur le carry-forward du cost-basis, dégradation acceptable).
 */
const MAX_HISTORY_DAYS = 365;

export interface CryptoQuote {
  price: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
}

export interface CryptoDailyClose {
  /** Minuit UTC du jour. */
  date: Date;
  close: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
    headers["x-cg-demo-api-key"] = apiKey;
  }
  return headers;
}

function dedupe(ids: string[]): string[] {
  return Array.from(new Set(ids.map((i) => i.trim()).filter(Boolean)));
}

/** GET JSON avec timeout + retry (429 / 5xx / réseau). Renvoie null après échec. */
async function getJson<T>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: buildHeaders(),
        signal: controller.signal,
        next: { revalidate: REVALIDATE_S },
      });
      clearTimeout(timer);
      if (res.ok) return (await res.json()) as T;
      // 4xx (hors 429) = requête invalide → inutile de retenter.
      if (res.status !== 429 && res.status < 500) break;
    } catch {
      clearTimeout(timer);
      // timeout / réseau → retry
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(RETRY_BACKOFF_MS);
  }
  console.warn(`[coingecko] indisponible: ${path}`);
  return null;
}

/**
 * Cours courant (EUR) de plusieurs ids CoinGecko. Record id → prix ou null.
 * Rejette les prix `<= 0`. Même forme que yahoo.fetchEquityCurrentPrices.
 */
export async function fetchCryptoCurrentPrices(
  ids: string[]
): Promise<Record<string, number | null>> {
  const uniq = dedupe(ids);
  if (uniq.length === 0) return {};

  const data = await getJson<Record<string, Record<string, number>>>(
    `/simple/price?ids=${uniq.join(",")}&vs_currencies=eur`
  );

  const out: Record<string, number | null> = {};
  for (const id of uniq) {
    const p = data?.[id]?.eur;
    out[id] = p != null && p > 0 ? p : null;
  }
  return out;
}

/**
 * Cours courant + variations 24h / 7j / 30j de plusieurs ids. Pour /api/prices.
 */
export async function fetchCryptoQuotes(
  ids: string[]
): Promise<Record<string, CryptoQuote>> {
  const uniq = dedupe(ids);
  const out: Record<string, CryptoQuote> = {};
  if (uniq.length === 0) return out;

  const data = await getJson<Record<string, Record<string, number>>>(
    `/simple/price?ids=${uniq.join(
      ","
    )}&vs_currencies=eur&include_24hr_change=true&include_7d_change=true&include_30d_change=true`
  );

  for (const id of uniq) {
    const e = data?.[id];
    const price = e?.eur;
    out[id] = {
      price: price != null && price > 0 ? price : null,
      change24hPct: e?.eur_24h_change ?? null,
      change7dPct: e?.eur_7d_change ?? null,
      change30dPct: e?.eur_30d_change ?? null,
    };
  }
  return out;
}

/**
 * Historique des clôtures journalières (EUR) d'un id sur `days` jours, bucketé
 * par jour UTC (dernière valeur du jour = clôture). Sert au backfill des courbes.
 */
export async function fetchCryptoDailyCloses(
  id: string,
  days: number
): Promise<CryptoDailyClose[]> {
  const cappedDays = Math.min(Math.max(1, Math.ceil(days)), MAX_HISTORY_DAYS);
  const data = await getJson<{ prices?: [number, number][] }>(
    `/coins/${encodeURIComponent(id)}/market_chart?vs_currency=eur&days=${cappedDays}`
  );
  if (!data?.prices) return [];

  const byDay = new Map<number, number>();
  for (const [ms, price] of data.prices) {
    if (price == null || price <= 0) continue;
    const d = new Date(ms);
    byDay.set(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), price);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, close]) => ({ date: new Date(t), close }));
}
