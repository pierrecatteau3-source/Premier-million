import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import {
  fetchMarketSnapshot,
  type MarketSnapshot,
} from "@/lib/services/market-data.service";
import { pickGreetingForHour, buildMarketJab } from "@/lib/pio/greetings";

// Cache module-level du snapshot marché (10 min) — évite de spammer CoinGecko/Alpha Vantage
// à chaque ouverture du chat, et garde la salutation quasi-instantanée.
let cachedSnapshot: { at: number; snap: MarketSnapshot } | null = null;
const SNAPSHOT_TTL_MS = 10 * 60 * 1000;

async function getSnapshot(): Promise<MarketSnapshot | null> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.at < SNAPSHOT_TTL_MS) {
    return cachedSnapshot.snap;
  }
  try {
    const snap = await fetchMarketSnapshot();
    cachedSnapshot = { at: now, snap };
    return snap;
  } catch {
    return cachedSnapshot?.snap ?? null;
  }
}

// GET /api/pio/greeting?h=<heure locale 0-23> — salutation cohérente + petit pic marché
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const hParam = parseInt(searchParams.get("h") ?? "", 10);
  const hour =
    Number.isFinite(hParam) && hParam >= 0 && hParam <= 23
      ? hParam
      : new Date().getHours();

  const greeting = pickGreetingForHour(hour);
  const jab = buildMarketJab(await getSnapshot());
  const text = jab ? `${greeting} ${jab}` : greeting;

  return NextResponse.json({ data: { greeting: text } });
}
