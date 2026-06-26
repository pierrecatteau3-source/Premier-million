export const runtime = "nodejs";

/**
 * POST /api/snapshots/backfill
 * Reconstruit l'historique de MARCHÉ des actifs live de l'utilisateur (vraies
 * clôtures Yahoo / CoinGecko, pas du cost-basis). Répare les courbes « gelées ».
 *
 *   - défaut            → réparation complète (depuis la 1re transaction)
 *   - ?recent=1         → self-heal léger (14 derniers jours), pour l'auto-trigger
 *
 * Idempotent. Protégé par session.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { backfillMarketHistory } from "@/lib/services/snapshot-backfill.service";

const RECENT_DAYS = 14;

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const recent = req.nextUrl.searchParams.get("recent");
  const sinceDays = recent ? RECENT_DAYS : undefined;

  try {
    const result = await backfillMarketHistory(session.userId, { sinceDays });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/snapshots/backfill]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
