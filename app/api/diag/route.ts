export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  const out: Record<string, unknown> = {};
  const period1 = new Date(Date.now() - 8 * 86_400_000);

  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const r = await yf.chart("CW8.PA", { period1, interval: "1h" });
    out.libChart = { quotes: r.quotes?.length ?? 0 };
  } catch (e) {
    out.libChart = { error: (e as Error).name + ": " + (e as Error).message.slice(0, 200) };
  }

  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
    const r = await yf.quoteSummary("CW8.PA", { modules: ["price"] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    out.libQuote = { price: (r as any).price?.regularMarketPrice ?? null };
  } catch (e) {
    out.libQuote = { error: (e as Error).name + ": " + (e as Error).message.slice(0, 200) };
  }

  try {
    const p2 = Math.floor(Date.now() / 1000);
    const p1 = p2 - 8 * 86_400;
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/CW8.PA?period1=${p1}&period2=${p2}&interval=1h`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }, cache: "no-store" }
    );
    const body = await res.text();
    let count = 0;
    try {
      const j = JSON.parse(body);
      count = j?.chart?.result?.[0]?.timestamp?.length ?? 0;
    } catch { /* not json */ }
    out.directV8 = { status: res.status, count, bodyHead: body.slice(0, 100) };
  } catch (e) {
    out.directV8 = { error: (e as Error).name + ": " + (e as Error).message.slice(0, 200) };
  }

  return NextResponse.json(out);
}
