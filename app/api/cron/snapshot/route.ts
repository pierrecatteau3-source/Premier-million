export const runtime = "nodejs";

/**
 * GET /api/cron/snapshot
 * Appelée 2× par jour par un cron Railway (7h + 16h UTC ≈ 9h et 18h Paris).
 * Sécurisée par Authorization: Bearer CRON_SECRET.
 *
 * Ne traite QUE les actifs avec pricing live (live_crypto / live_equity).
 * Les actifs manual / savings sont laissés tels quels (snapshot inchangé).
 * Utilise upsert sur [assetId, date] (date = minuit UTC du jour) — la 2e
 * exécution de la journée écrase la 1re (close > open dans l'historique).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Helpers prix ──────────────────────────────────────────────────────────────

async function fetchCryptoPrices(ids: string[]): Promise<Record<string, number | null>> {
  if (ids.length === 0) return {};
  const apiKey = process.env.COINGECKO_API_KEY;
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=eur`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const raw = (await res.json()) as Record<string, Record<string, number>>;
    const result: Record<string, number | null> = {};
    for (const id of ids) {
      result[id] = raw[id]?.eur ?? null;
    }
    return result;
  } catch {
    clearTimeout(timeout);
    const result: Record<string, number | null> = {};
    for (const id of ids) result[id] = null;
    return result;
  }
}

async function fetchEquityPrices(tickers: string[]): Promise<Record<string, number | null>> {
  if (tickers.length === 0) return {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const result: Record<string, number | null> = {};
    for (const ticker of tickers) {
      try {
        const summary = await yahooFinance.quoteSummary(ticker, { modules: ["price"] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (summary as any).price as { regularMarketPrice?: number } | undefined;
        result[ticker] = p?.regularMarketPrice ?? null;
      } catch {
        result[ticker] = null;
      }
    }
    return result;
  } catch {
    const result: Record<string, number | null> = {};
    for (const ticker of tickers) result[ticker] = null;
    return result;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vérification de la clé secrète
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Date du snapshot = aujourd'hui à minuit UTC
  const now = new Date();
  const snapshotDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  // Ne récupérer QUE les actifs avec un pricing live (crypto / equity) + ticker
  const assets = await prisma.asset.findMany({
    where: {
      pricingMode: { in: ["live_crypto", "live_equity"] },
      ticker: { not: null },
    },
    include: {
      transactions: { select: { quantite: true } },
    },
  });

  if (assets.length === 0) {
    return NextResponse.json({ snapshotsCreated: 0, snapshotsSkipped: 0 });
  }

  // Collecter les tickers par mode de pricing
  const cryptoIds: string[] = [];
  const equityTickers: string[] = [];

  for (const asset of assets) {
    if (asset.pricingMode === "live_crypto") cryptoIds.push(asset.ticker!);
    else if (asset.pricingMode === "live_equity") equityTickers.push(asset.ticker!);
  }

  // Dédoublonner
  const uniqueCrypto = Array.from(new Set(cryptoIds));
  const uniqueEquity = Array.from(new Set(equityTickers));

  // Fetch prix en parallèle
  const [cryptoPrices, equityPrices] = await Promise.all([
    fetchCryptoPrices(uniqueCrypto),
    fetchEquityPrices(uniqueEquity),
  ]);

  let snapshotsCreated = 0;
  let snapshotsSkipped = 0;

  for (const asset of assets) {
    const quantiteTotal = asset.transactions.reduce((s, t) => s + t.quantite, 0);

    if (quantiteTotal <= 0) {
      snapshotsSkipped++;
      continue;
    }

    const livePrice =
      asset.pricingMode === "live_crypto"
        ? (cryptoPrices[asset.ticker!] ?? null)
        : (equityPrices[asset.ticker!] ?? null);

    if (livePrice == null) {
      snapshotsSkipped++;
      continue;
    }

    const value = quantiteTotal * livePrice;

    // Upsert sur la contrainte unique [assetId, date]
    await prisma.snapshot.upsert({
      where: { assetId_date: { assetId: asset.id, date: snapshotDate } },
      update: { value },
      create: { assetId: asset.id, value, date: snapshotDate },
    });
    snapshotsCreated++;
  }

  return NextResponse.json({
    snapshotsCreated,
    snapshotsSkipped,
    date: snapshotDate.toISOString(),
  });
}
