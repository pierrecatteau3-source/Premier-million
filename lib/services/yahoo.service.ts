/**
 * Service Yahoo Finance — SERVEUR UNIQUEMENT.
 *
 * On N'UTILISE PAS le paquet `yahoo-finance2` : son fetch interne (acquisition
 * crumb + cookie) casse sous le runtime Next / depuis une IP serveur (Railway,
 * runners GitHub Actions) et renvoie régulièrement vide ou 0 — ce qui faisait
 * « geler » les courbes (snapshot skippé → carry-forward plat).
 *
 * À la place : fetch DIRECT de l'endpoint public `/v8/finance/chart`, qui ne
 * réclame pas de crumb et s'avère bien plus fiable (cf. le pattern déjà éprouvé
 * dans app/api/prices/sparkline/route.ts). Robustesse :
 *   - miroirs `query1` puis `query2`
 *   - timeout par hôte
 *   - 2 passes (retry) avant d'abandonner
 *   - rejet systématique des prix `null` / `<= 0`
 *
 * Ne throw jamais — renvoie `[]` ou `null` en cas d'échec, et log un warn.
 */

const HOSTS = ["query1", "query2"] as const;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_PASSES = 2;
/** Cache Next côté serveur : 1 appel réel / URL identique / heure. */
const REVALIDATE_S = 3_600;

export interface DailyClose {
  /** Minuit UTC du jour de cotation. */
  date: Date;
  /** Cours de clôture (déjà filtré > 0). */
  close: number;
}

export interface EquityQuote {
  price: number | null;
  changePct: number | null;
}

interface YahooChartResult {
  meta?: { regularMarketPrice?: number; currency?: string };
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

interface YahooChartResponse {
  chart?: { result?: YahooChartResult[]; error?: unknown };
}

/** Minuit UTC du jour correspondant à un timestamp Unix (secondes). */
function utcMidnightFromUnix(sec: number): Date {
  const d = new Date(sec * 1000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Récupère le premier `result` de l'endpoint chart pour un ticker.
 * Essaie les deux miroirs, 2 passes, avec timeout. Renvoie null après échec total.
 */
async function fetchChartResult(
  ticker: string,
  params: string
): Promise<YahooChartResult | null> {
  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?${params}`;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    for (const host of HOSTS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`https://${host}.finance.yahoo.com${path}`, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
          signal: controller.signal,
          next: { revalidate: REVALIDATE_S },
        });
        clearTimeout(timer);
        if (!res.ok) continue; // 429 / 5xx → miroir suivant
        const json = (await res.json()) as YahooChartResponse;
        const result = json.chart?.result?.[0];
        if (result) return result;
      } catch {
        clearTimeout(timer);
        // timeout / réseau → on tente l'hôte / la passe suivante
      }
    }
  }

  console.warn(`[yahoo] chart indisponible pour "${ticker}" (${params})`);
  return null;
}

/** Extrait les closes valides (> 0) d'un result, dédoublonnés par jour UTC. */
function extractDailyCloses(result: YahooChartResult): DailyClose[] {
  const ts = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  // last-write-wins par jour UTC : si Yahoo renvoie une bougie intraday en plus
  // de la clôture, on garde la dernière valeur du jour.
  const byDay = new Map<number, number>();
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null || c <= 0) continue;
    byDay.set(utcMidnightFromUnix(ts[i]).getTime(), c);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([t, close]) => ({ date: new Date(t), close }));
}

/**
 * Historique des clôtures journalières d'un ticker equity sur [period1, period2]
 * (timestamps Unix en secondes). Sert au backfill des courbes.
 */
export async function fetchEquityDailyCloses(
  ticker: string,
  period1: number,
  period2: number
): Promise<DailyClose[]> {
  const result = await fetchChartResult(
    ticker,
    `period1=${period1}&period2=${period2}&interval=1d`
  );
  if (!result) return [];
  if (result.meta?.currency && result.meta.currency !== "EUR") {
    // L'app suppose des montants en EUR (pas de conversion FX). On signale juste.
    console.warn(
      `[yahoo] "${ticker}" coté en ${result.meta.currency} ≠ EUR — valeurs non converties`
    );
  }
  return extractDailyCloses(result);
}

/**
 * Cours courant + variation jour de plusieurs tickers equity.
 * Prix = `meta.regularMarketPrice` (sinon dernière clôture valide).
 * Variation = (dernière clôture / avant-dernière − 1) × 100.
 * Séquentiel volontairement (peu de tickers) pour ne pas se faire rate-limiter.
 */
export async function fetchEquityQuotes(
  tickers: string[]
): Promise<Record<string, EquityQuote>> {
  const out: Record<string, EquityQuote> = {};
  const uniq = Array.from(new Set(tickers.map((t) => t.trim()).filter(Boolean)));

  for (const ticker of uniq) {
    const result = await fetchChartResult(ticker, `range=7d&interval=1d`);
    if (!result) {
      out[ticker] = { price: null, changePct: null };
      continue;
    }
    const closes = extractDailyCloses(result);
    const lastClose = closes.length > 0 ? closes[closes.length - 1].close : null;
    const prevClose = closes.length > 1 ? closes[closes.length - 2].close : null;

    const meta = result.meta?.regularMarketPrice;
    const price = meta != null && meta > 0 ? meta : lastClose;
    const changePct =
      lastClose != null && prevClose != null && prevClose > 0
        ? (lastClose / prevClose - 1) * 100
        : null;

    out[ticker] = { price, changePct };
  }
  return out;
}

/**
 * Cours courant seul (Record ticker → prix EUR ou null). Garde la même forme que
 * l'ancien helper basé sur quoteSummary, pour un remplacement direct dans les
 * routes snapshot / recurring.
 */
export async function fetchEquityCurrentPrices(
  tickers: string[]
): Promise<Record<string, number | null>> {
  const quotes = await fetchEquityQuotes(tickers);
  const out: Record<string, number | null> = {};
  for (const [ticker, q] of Object.entries(quotes)) out[ticker] = q.price;
  return out;
}
