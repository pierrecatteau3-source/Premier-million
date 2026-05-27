import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const data = await getPortfolioSummary(session.userId);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
