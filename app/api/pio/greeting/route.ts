import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getWeeklyPerformancePct } from "@/lib/services/portfolio.service";
import { pickGreetingForHour, buildPerfJab } from "@/lib/pio/greetings";

// GET /api/pio/greeting?h=<heure locale 0-23>
// Salutation cohérente avec l'heure + petite vanne sur la perf RÉELLE de la semaine.
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
  const perfPct = await getWeeklyPerformancePct(session.userId).catch(() => null);
  const jab = buildPerfJab(perfPct);
  const text = jab ? `${greeting} ${jab}` : greeting;

  return NextResponse.json({ data: { greeting: text } });
}
