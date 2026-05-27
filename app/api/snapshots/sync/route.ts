export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// POST /api/snapshots/sync
// 1. Fetches live prices and upserts today's market-value snapshot for each live asset.
// 2. Creates cost-basis snapshots at each transaction date (skips if snapshot already exists).
// Called by RefreshButton and auto-triggered by PortfolioClient on first load.
export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const assets = await prisma.asset.findMany({
    where: {
      userId,
      pricingMode: { in: ["live_equity", "live_crypto"] },
    },
    include: {
      transactions: {
        select: { quantite: true, date: true, montantInvesti: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (assets.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  // Normalize a Date to local midnight (consistent with how "today" is computed)
  function toMidnight(d: Date): Date {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
  }

  const today = toMidnight(new Date());
  const todayKey = today.toISOString().split("T")[0];

  // --- Separate tickers by pricing mode ---
  const cryptoIds: string[] = [];
  const equityTickers: string[] = [];
  for (const a of assets) {
    if (!a.ticker) continue;
    const t = a.ticker.trim();
    if (!t) continue;
    if (a.pricingMode === "live_crypto") cryptoIds.push(t);
    else if (a.pricingMode === "live_equity") equityTickers.push(t);
  }

  const priceMap: Record<string, number | null> = {};

  // Fetch crypto prices via CoinGecko
  if (cryptoIds.length > 0) {
    try {
      const apiKey = process.env.COINGECKO_API_KEY;
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=eur`;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
        headers["x-cg-demo-api-key"] = apiKey;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const raw = (await res.json()) as Record<string, Record<string, number>>;
        for (const id of cryptoIds) {
          priceMap[id] = raw[id]?.eur ?? null;
        }
      }
    } catch { /* continue with equity */ }
  }

  // Fetch equity prices via yahoo-finance2
  if (equityTickers.length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const YahooFinance = (await import("yahoo-finance2")).default;
      const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
      for (const ticker of equityTickers) {
        try {
          const result = await yahooFinance.quoteSummary(ticker, { modules: ["price"] });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = (result as any).price as { regularMarketPrice?: number } | undefined;
          priceMap[ticker] = p?.regularMarketPrice ?? null;
        } catch {
          priceMap[ticker] = null;
        }
      }
    } catch { /* yahoo-finance2 unavailable */ }
  }

  let count = 0;

  // --- Step 1: Upsert today's market-value snapshot ---
  for (const asset of assets) {
    if (!asset.ticker) continue;
    const ticker = asset.ticker.trim();
    const livePrice = priceMap[ticker];
    if (livePrice == null || livePrice <= 0) continue;

    const quantite = asset.transactions.reduce((s, t) => s + t.quantite, 0);
    if (quantite <= 0) continue;

    await prisma.snapshot.upsert({
      where: { assetId_date: { assetId: asset.id, date: today } },
      update: { value: quantite * livePrice },
      create: { assetId: asset.id, value: quantite * livePrice, date: today },
    });
    count++;
  }

  // --- Step 2: Create cost-basis snapshots at transaction dates ---
  // One snapshot per (assetId, transaction-date): cumulative montantInvesti up to that date.
  // skipDuplicates ensures we never overwrite an existing market-value snapshot.
  const costBasisRows: Array<{ assetId: string; value: number; date: Date }> = [];

  for (const asset of assets) {
    if (asset.transactions.length === 0) continue;

    // Accumulate montantInvesti per calendar day (skip today — market snapshot takes precedence)
    const dailyInflow = new Map<string, number>();
    for (const tx of asset.transactions) {
      const dateKey = toMidnight(tx.date).toISOString().split("T")[0];
      if (dateKey === todayKey) continue;
      dailyInflow.set(dateKey, (dailyInflow.get(dateKey) ?? 0) + tx.montantInvesti);
    }

    // Walk in chronological order and build cumulative cost snapshots
    let cumulative = 0;
    const sortedDays = Array.from(dailyInflow.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    for (const [dateKey, amount] of sortedDays) {
      cumulative += amount;
      costBasisRows.push({ assetId: asset.id, value: cumulative, date: new Date(dateKey) });
    }
  }

  if (costBasisRows.length > 0) {
    const result = await prisma.snapshot.createMany({
      data: costBasisRows,
      skipDuplicates: true,
    });
    count += result.count;
  }

  // --- Step 2b : cost-basis snapshots pour les actifs manuels ---
  const manualAssets = await prisma.asset.findMany({
    where: {
      userId,
      pricingMode: { notIn: ["live_equity", "live_crypto"] },
    },
    include: {
      transactions: {
        select: { quantite: true, date: true, montantInvesti: true },
        orderBy: { date: "asc" },
      },
    },
  });

  const manualCostRows: Array<{ assetId: string; value: number; date: Date }> = [];
  for (const asset of manualAssets) {
    if (asset.transactions.length === 0) continue;
    const dailyInflow = new Map<string, number>();
    for (const tx of asset.transactions) {
      const dateKey = toMidnight(tx.date).toISOString().split("T")[0];
      if (dateKey === todayKey) continue;
      dailyInflow.set(dateKey, (dailyInflow.get(dateKey) ?? 0) + tx.montantInvesti);
    }
    let cumulative = 0;
    const sortedDays = Array.from(dailyInflow.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [dateKey, amount] of sortedDays) {
      cumulative += amount;
      manualCostRows.push({ assetId: asset.id, value: cumulative, date: new Date(dateKey) });
    }
  }
  if (manualCostRows.length > 0) {
    const r = await prisma.snapshot.createMany({ data: manualCostRows, skipDuplicates: true });
    count += r.count;
  }

  return NextResponse.json({ count });
}
