export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { SparkPoint, SparklineMap } from "@/types/prices";

// Rafraîchissement toutes les 3 h : la donnée upstream est mise en cache par Next
// (`revalidate`), donc 1 appel externe / actif / 3 h max.
const REVALIDATE = 10_800; // 3 h en secondes
const FETCH_TIMEOUT = 8_000; // 8 s par hôte avant d'abandonner / basculer

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

interface YahooChart {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: { quote?: { close?: (number | null)[] }[] };
    }[];
  };
}

/**
 * Récupère la série horaire d'un ticker via l'endpoint chart v8 de Yahoo en fetch
 * direct. On N'UTILISE PAS yahoo-finance2 ici : son fetch interne casse sous le
 * runtime Next (les actions revenaient toutes vides). /v8/chart ne réclame pas de
 * crumb ; un fetch direct profite aussi du cache 3 h (`revalidate`).
 *
 * Robustesse : Yahoo depuis Railway est capricieux (rate-limit, blips réseau).
 * On essaie successivement les deux hôtes miroirs `query1` puis `query2` avec un
 * timeout, et on ne renvoie [] qu'après échec des deux. Les retours vides ne sont
 * pas mis en cache empoisonné côté client (cf. useSparklines).
 */
async function fetchYahooSeries(
  ticker: string,
  period1: number,
  period2: number
): Promise<SparkPoint[]> {
  const hosts = ["query1", "query2"];
  const path = `/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?period1=${period1}&period2=${period2}&interval=1h`;

  for (const host of hosts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch(`https://${host}.finance.yahoo.com${path}`, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: REVALIDATE },
      });
      clearTimeout(timer);
      if (!res.ok) continue; // host KO (429/5xx) → on tente le miroir suivant

      const json = (await res.json()) as YahooChart;
      const result = json.chart?.result?.[0];
      const ts = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      const points: SparkPoint[] = [];
      for (let i = 0; i < ts.length; i++) {
        const c = closes[i];
        if (c != null) points.push({ t: ts[i] * 1000, v: c });
      }
      if (points.length > 0) return points; // succès : on s'arrête
      // Réponse OK mais vide → on tente quand même l'autre hôte avant d'abandonner
    } catch {
      clearTimeout(timer);
      // timeout / réseau → on tente l'hôte suivant
    }
  }
  return [];
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
  const tickers = splitParam(searchParams.get("tickers"));
  if (tickers.length === 0) return NextResponse.json({ data: {}, updatedAt });

  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - (days + 1) * 86_400;

  const data: SparklineMap = {};
  await Promise.all(
    tickers.map(async (t) => {
      data[t] = await fetchYahooSeries(t, period1, period2);
    })
  );
  return NextResponse.json({ data, updatedAt });
}
