import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getPortfolioHistory,
  getPortfolioHistoryByRange,
  type HistoryPeriod,
  type HistoryPoint,
} from "@/lib/services/portfolio.service";

const VALID_PERIODS: HistoryPeriod[] = ["7d", "1m", "3m", "6m", "1y", "all"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const CASH_TYPES = [
  "Compte courant",
  "Compte joint",
  "Compte pro",
  "Cash disponible",
  "Livret A",
  "LDD / LDDS",
  "LEP",
  "Comptes à Terme",
  "Monétaire",
];

function computeEvolution(data: HistoryPoint[], totalApports: number) {
  const startValue = data.length > 0 ? data[0].totalValue : 0;
  const endValue   = data.length > 0 ? data[data.length - 1].totalValue : 0;
  const deltaEur   = endValue - startValue;
  const deltaPct   = startValue === 0 ? 0 : Math.round((deltaEur / startValue) * 1000) / 10;
  const performanceNette    = deltaEur - totalApports;
  const performanceNettePct = startValue === 0 ? 0 : Math.round((performanceNette / startValue) * 1000) / 10;
  return { startValue, endValue, deltaEur, deltaPct, totalApports, performanceNette, performanceNettePct };
}

// GET /api/portfolio/history?period=7d|1m|3m|6m|1y|all
// GET /api/portfolio/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const params = req.nextUrl.searchParams;
  const rawStart = params.get("startDate");
  const rawEnd = params.get("endDate");

  // Tenter la résolution par plage de dates libre
  if (rawStart !== null && rawEnd !== null) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const validFormat =
      DATE_REGEX.test(rawStart) && DATE_REGEX.test(rawEnd);

    if (!validFormat) {
      return NextResponse.json(
        { error: "Format de date invalide. Attendu : YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const startDate = new Date(rawStart);
    const endDate = new Date(rawEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Date invalide" },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "endDate doit être >= startDate" },
        { status: 400 }
      );
    }

    if (endDate > today) {
      return NextResponse.json(
        { error: "endDate ne peut pas être dans le futur" },
        { status: 400 }
      );
    }

    try {
      const data = await getPortfolioHistoryByRange(session.userId, {
        startDate,
        endDate,
      });

      const apportsTx = await prisma.transaction.findMany({
        where: {
          userId: session.userId,
          date: { gte: startDate, lte: endDate },
          asset: { pilier: { not: "LIQUIDITE" }, type: { notIn: CASH_TYPES } },
        },
        select: { montantInvesti: true },
      });
      const totalApports = apportsTx.reduce((s, t) => s + t.montantInvesti, 0);

      return NextResponse.json({ data, evolution: computeEvolution(data, totalApports) });
    } catch {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }

  // Fallback : comportement par période prédéfinie
  const raw = params.get("period") ?? "1m";
  const period = VALID_PERIODS.includes(raw as HistoryPeriod)
    ? (raw as HistoryPeriod)
    : "1m";

  try {
    const data = await getPortfolioHistory(session.userId, period);

    // Calculer la startDate équivalente pour la requête transactions
    const now = new Date();
    let periodStartDate: Date | undefined;

    switch (period) {
      case "7d": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        periodStartDate = d;
        break;
      }
      case "1m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        periodStartDate = d;
        break;
      }
      case "3m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 3);
        periodStartDate = d;
        break;
      }
      case "6m": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        periodStartDate = d;
        break;
      }
      case "1y": {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        periodStartDate = d;
        break;
      }
      case "all":
        periodStartDate = undefined;
        break;
    }

    const apportsTx = await prisma.transaction.findMany({
      where: {
        userId: session.userId,
        ...(periodStartDate !== undefined ? { date: { gte: periodStartDate } } : {}),
        asset: { pilier: { not: "LIQUIDITE" }, type: { notIn: CASH_TYPES } },
      },
      select: { montantInvesti: true },
    });
    const totalApports = apportsTx.reduce((s, t) => s + t.montantInvesti, 0);

    return NextResponse.json({ data, evolution: computeEvolution(data, totalApports) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
