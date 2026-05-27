import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { computeRiskScore } from "@/lib/risk";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    // L'épargne de précaution est exclue du calcul Risque & Atouts :
    // base de référence = portfolio.totalValue (actifs investis uniquement).
    const portfolio = await getPortfolioSummary(session.userId);

    // Les pourcentages et allocationGap fournis par portfolio.piliers sont déjà
    // calculés sur portfolio.totalValue — aucun retraitement nécessaire.
    const risk = computeRiskScore(portfolio.piliers);
    return NextResponse.json({ data: risk });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
