export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { PriceMap } from "@/types/prices";
import { fetchEquityQuotes } from "@/lib/services/yahoo.service";
import { fetchCryptoQuotes } from "@/lib/services/coingecko.service";

// GET /api/prices?ids=bitcoin,ethereum&mode=crypto
// GET /api/prices?tickers=EWLD.PA,CW8.PA&mode=equity
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "crypto";
  const updatedAt = new Date().toISOString();

  if (mode === "crypto") {
    const ids = searchParams.get("ids") ?? "";
    if (!ids) return NextResponse.json({ data: {}, updatedAt });

    const idList = ids
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const quotes = await fetchCryptoQuotes(idList);
    const data: PriceMap = {};
    let anyOk = false;
    for (const id of idList) {
      const q = quotes[id];
      if (q && q.price != null) {
        anyOk = true;
        data[id] = {
          price: q.price,
          change24hPct: q.change24hPct,
          change7dPct: q.change7dPct,
          change30dPct: q.change30dPct,
          updatedAt,
        };
      } else {
        data[id] = {
          price: null,
          change24hPct: null,
          change7dPct: null,
          change30dPct: null,
          updatedAt,
          error: "source_unavailable",
        };
      }
    }

    return NextResponse.json(
      { data, updatedAt },
      { status: anyOk || idList.length === 0 ? 200 : 502 }
    );
  }

  // mode === "equity" — fetch direct /v8/chart (fiable, sans crumb).
  const tickers = searchParams.get("tickers") ?? "";
  if (!tickers) return NextResponse.json({ data: {}, updatedAt });

  const tickerList = tickers
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const quotes = await fetchEquityQuotes(tickerList);
  const data: PriceMap = {};
  let anyOk = false;
  for (const t of tickerList) {
    const q = quotes[t];
    if (q && q.price != null) {
      anyOk = true;
      data[t] = {
        price: q.price,
        change24hPct: q.changePct,
        change7dPct: null,
        change30dPct: null,
        updatedAt,
      };
    } else {
      data[t] = {
        price: null,
        change24hPct: null,
        change7dPct: null,
        change30dPct: null,
        updatedAt,
        error: "source_unavailable",
      };
    }
  }

  return NextResponse.json(
    { data, updatedAt },
    { status: anyOk || tickerList.length === 0 ? 200 : 502 }
  );
}
