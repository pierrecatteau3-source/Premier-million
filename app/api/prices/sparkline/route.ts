export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { SparkPoint, SparklineMap } from "@/types/prices";

// Rafraîchissement toutes les 3 h : la donnée upstream est mise en cache par Next
// (`revalidate`), donc 1 appel externe / actif / 3 h max.
const REVALIDATE = 10_800; // 3 h en secondes

function parseDays(raw: string | null): number {
  const n = parseInt(raw ?? "7", 10);
  if (Number.isNaN(n)) return 7;
  return Math.min(Math.max(n, 1), 30);
}

function splitParam(raw: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// GET /api/prices/sparkline?mode=crypto&ids=bitcoin,ethereum&days=7
// GET /api/prices/sparkline?mode=equity&tickers=CW8.PA,HO.PA&days=7
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "crypto";
  const days = parseDays(searchParams.get("days"));
  const updatedAt = new Date().toISOString();

  if (mode === "crypto") {
    const ids = splitParam(searchParams.get("ids"));
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
          const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } });
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
  // Endpoint chart v8 de Yahoo en fetch direct. On N'UTILISE PAS yahoo-finance2 ici :
  // son fetch interne casse sous le runtime Next (les actions revenaient toutes vides).
  // /v8/chart ne réclame pas de crumb ; un fetch direct profite aussi du cache 3 h.
  const tickers = splitParam(searchParams.get("tickers"));
  if (tickers.length === 0) return NextResponse.json({ data: {}, updatedAt });

  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - (days + 1) * 86_400;

  const data: SparklineMap = {};
  await Promise.all(
    tickers.map(async (t) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        t
      )}?period1=${period1}&period2=${period2}&interval=1h`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
          next: { revalidate: REVALIDATE },
        });
        if (!res.ok) {
          data[t] = [];
          return;
        }
        const json = (await res.json()) as {
          chart?: {
            result?: {
              timestamp?: number[];
              indicators?: { quote?: { close?: (number | null)[] }[] };
            }[];
          };
        };
        const result = json.chart?.result?.[0];
        const ts = result?.timestamp ?? [];
        const closes = result?.indicators?.quote?.[0]?.close ?? [];
        const points: SparkPoint[] = [];
        for (let i = 0; i < ts.length; i++) {
          const c = closes[i];
          if (c != null) points.push({ t: ts[i] * 1000, v: c });
        }
        data[t] = points;
      } catch {
        data[t] = [];
      }
    })
  );
  return NextResponse.json({ data, updatedAt });
}
