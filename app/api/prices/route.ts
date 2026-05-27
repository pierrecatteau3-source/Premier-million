export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { PriceMap } from "@/types/prices";

// GET /api/prices?ids=bitcoin,ethereum&mode=crypto
// GET /api/prices?tickers=EWLD.PA,CW8.PA&mode=equity
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "crypto";
  const updatedAt = new Date().toISOString();

  if (mode === "crypto") {
    const ids = searchParams.get("ids") ?? "";
    if (!ids) return NextResponse.json({ data: {}, updatedAt });

    const apiKey = process.env.COINGECKO_API_KEY;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true&include_7d_change=true&include_30d_change=true`;
    // TODO: ajouter COINGECKO_API_KEY pour lever le rate-limit

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
        headers["x-cg-demo-api-key"] = apiKey;
      }
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const raw = await res.json() as Record<string, Record<string, number>>;

      const data: PriceMap = {};
      for (const id of ids.split(",")) {
        const entry = raw[id.trim()];
        if (!entry) {
          data[id.trim()] = { price: null, change24hPct: null, change7dPct: null, change30dPct: null, updatedAt, error: "not_found" };
        } else {
          data[id.trim()] = {
            price: entry["eur"] ?? null,
            change24hPct: entry["eur_24h_change"] ?? null,
            change7dPct: entry["eur_7d_change"] ?? null,
            change30dPct: entry["eur_30d_change"] ?? null,
            updatedAt,
          };
        }
      }
      return NextResponse.json({ data, updatedAt });
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const data: PriceMap = {};
      for (const id of ids.split(",")) {
        data[id.trim()] = { price: null, change24hPct: null, change7dPct: null, change30dPct: null, updatedAt, error: isTimeout ? "timeout" : "source_unavailable" };
      }
      return NextResponse.json({ data, updatedAt }, { status: isTimeout ? 503 : 502 });
    }
  }

  // mode === "equity"
  const tickers = searchParams.get("tickers") ?? "";
  if (!tickers) return NextResponse.json({ data: {}, updatedAt });

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const YahooFinance = (await import("yahoo-finance2")).default;
    // yahoo-finance2 v3: default export is the class, must instantiate before calling methods
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const data: PriceMap = {};
    for (const ticker of tickers.split(",")) {
      const t = ticker.trim();
      try {
        const result = await yahooFinance.quoteSummary(t, { modules: ["price"] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (result as any).price as { regularMarketPrice?: number; regularMarketChangePercent?: number } | undefined;
        data[t] = {
          price: p?.regularMarketPrice ?? null,
          change24hPct: p?.regularMarketChangePercent != null ? p.regularMarketChangePercent * 100 : null,
          change7dPct: null,
          change30dPct: null,
          updatedAt,
        };
      } catch {
        data[t] = { price: null, change24hPct: null, change7dPct: null, change30dPct: null, updatedAt, error: "not_found" };
      }
    }
    return NextResponse.json({ data, updatedAt });
  } catch {
    // yahoo-finance2 unavailable
    const data: PriceMap = {};
    for (const t of tickers.split(",")) {
      // TODO: remplacer par une API alternative
      data[t.trim()] = { price: null, change24hPct: null, change7dPct: null, change30dPct: null, updatedAt, error: "source_unavailable" };
    }
    return NextResponse.json({ data, updatedAt }, { status: 502 });
  }
}
