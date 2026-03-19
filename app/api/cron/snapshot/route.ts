export const runtime = "nodejs";

/**
 * GET /api/cron/snapshot
 * Appelée automatiquement à 19h (17h UTC) par Vercel Cron.
 * Sécurisée par Authorization: Bearer CRON_SECRET.
 *
 * Pour chaque actif actif :
 *   - live_equity / live_crypto + ticker → prix live × quantiteTotal
 *   - manual / savings → dernier snapshot connu (pas de nouveau snapshot si valeur inchangée)
 * Utilise upsert sur la contrainte unique [assetId, date] (date = minuit UTC du jour).
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

  // Récupérer tous les actifs avec leur dernier snapshot et leurs transactions
  const assets = await prisma.asset.findMany({
    include: {
      snapshots: { orderBy: { date: "desc" }, take: 1 },
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
    const mode = asset.pricingMode ?? "manual";
    const ticker = asset.ticker ?? null;
    if (!ticker) continue;
    if (mode === "live_crypto") cryptoIds.push(ticker);
    else if (mode === "live_equity") equityTickers.push(ticker);
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
    const mode = asset.pricingMode ?? "manual";
    const ticker = asset.ticker ?? null;
    const quantiteTotal = asset.transactions.reduce((s, t) => s + t.quantite, 0);
    const lastSnapshotValue = asset.snapshots[0]?.value ?? null;

    let value: number | null = null;

    if (
      (mode === "live_crypto" || mode === "live_equity") &&
      ticker != null &&
      quantiteTotal > 0
    ) {
      const livePrice =
        mode === "live_crypto"
          ? (cryptoPrices[ticker] ?? null)
          : (equityPrices[ticker] ?? null);

      if (livePrice != null) {
        value = quantiteTotal * livePrice;
      }
    } else if (mode === "manual" || mode === "savings") {
      // Utiliser la dernière valeur connue sans en créer une nouvelle si inchangée
      value = lastSnapshotValue;
    }

    if (value == null) {
      snapshotsSkipped++;
      continue;
    }

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
