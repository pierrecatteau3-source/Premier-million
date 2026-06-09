export const runtime = "nodejs";
import { NextResponse } from "next/server";
import dns from "node:dns";

export async function GET() {
  const out: Record<string, unknown> = {};
  const host = "query1.finance.yahoo.com";
  const p2 = Math.floor(Date.now() / 1000);
  const p1 = p2 - 8 * 86_400;
  const url = `https://${host}/v8/finance/chart/CW8.PA?period1=${p1}&period2=${p2}&interval=1h`;

  // DNS records — is Yahoo resolving to IPv6 that Railway can't route?
  try {
    out.dns4 = await dns.promises.resolve4(host).catch((e) => "ERR " + (e as Error).code);
  } catch (e) { out.dns4 = "throw " + (e as Error).message; }
  try {
    out.dns6 = await dns.promises.resolve6(host).catch((e) => "ERR " + (e as Error).code);
  } catch (e) { out.dns6 = "throw " + (e as Error).message; }

  async function tryFetch(label: string) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        cache: "no-store",
      });
      const body = await res.text();
      let count = 0;
      try { count = JSON.parse(body)?.chart?.result?.[0]?.timestamp?.length ?? 0; } catch { /* */ }
      out[label] = { status: res.status, count };
    } catch (e) {
      out[label] = { error: (e as Error).name + ": " + (e as Error).message.slice(0, 160) };
    }
  }

  // 1) default DNS order (likely IPv6-first on Node 20)
  await tryFetch("directDefault");

  // 2) force IPv4 resolution, then retry
  dns.setDefaultResultOrder("ipv4first");
  await tryFetch("directIpv4First");

  // 3) CoinGecko control — proves general egress works
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/ping", { cache: "no-store" });
    out.coingeckoControl = { status: res.status };
  } catch (e) {
    out.coingeckoControl = { error: (e as Error).message.slice(0, 120) };
  }

  return NextResponse.json(out);
}
