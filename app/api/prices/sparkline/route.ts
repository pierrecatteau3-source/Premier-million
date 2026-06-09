export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { SparkPoint, SparklineMap } from "@/types/prices";

// Rafraîchissement toutes les 3 h : la donnée upstream (CoinGecko) est mise en
// cache par Next pendant 3 h, donc 1 appel externe / actif / 3 h max.
const REVALIDATE = 10_800; // 3 h en secondes

function parseDays(raw: string | null): number {
  const n = parseInt(raw ?? "7", 10);
  if (Number.isNaN(n)) return 7;
  return Math.min(Math.max(n, 1), 30);
}

// GET /api/prices/sparkline?mode=crypto&ids=bitcoin,ethereum&days=7
// GET /api/prices/sparkline?mode=equity&tickers=EWLD.PA,CW8.PA&days=7
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "crypto";
  const days = parseDays(searchParams.get("days"));
  const updatedAt = new Date().toISOString();

  if (mode === "crypto") {
    const ids = (searchParams.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ data: {}, updatedAt });

    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    const data: SparklineMap = {};
    await Promise.all(
      ids.map(async (id) => {
        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
          id
        )}/market_chart?vs_currency=eur&days=${days}`;
        try {
          const res = await fetch(url, {
            headers,
            next: { revalidate: REVALIDATE },
          });
          if (!res.ok) {
            data[id] = [];
            return;
          }
          const json = (await res.json()) as { prices?: [number, number][] };
          data[id] = (json.prices ?? []).map(([t, v]) => ({ t, v }));
        } catch {
          data[id] = [];
        }
      })
    );
    return NextResponse.json({ data, updatedAt });
  }

  // mode === "equity"
  const tickers = (searchParams.get("tickers") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tickers.length === 0) return NextResponse.json({ data: {}, updatedAt });

  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const period1 = new Date(Date.now() - (days + 1) * 86_400_000);

    const data: SparklineMap = {};
    await Promise.all(
      tickers.map(async (t) => {
        try {
          const result = await yahooFinance.chart(t, { period1, interval: "1h" });
          const points: SparkPoint[] = (result.quotes ?? [])
            .filter((q) => q.close != null)
            .map((q) => ({ t: q.date.getTime(), v: q.close as number }));
          data[t] = points;
        } catch {
          data[t] = [];
        }
      })
    );
    return NextResponse.json({ data, updatedAt });
  } catch {
    const data: SparklineMap = {};
    for (const t of tickers) data[t] = [];
    return NextResponse.json({ data, updatedAt }, { status: 502 });
  }
}
