import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAssetHistoryByRange } from "@/lib/services/portfolio.service";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/assets/[id]/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const asset = await prisma.asset.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!asset) {
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  }

  const search = req.nextUrl.searchParams;
  const rawStart = search.get("startDate");
  const rawEnd = search.get("endDate");

  if (
    rawStart === null ||
    rawEnd === null ||
    !DATE_REGEX.test(rawStart) ||
    !DATE_REGEX.test(rawEnd)
  ) {
    return NextResponse.json(
      { error: "Format de date invalide. Attendu : YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const startDate = new Date(rawStart);
  const endDate = new Date(rawEnd);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "endDate doit être >= startDate" },
      { status: 400 }
    );
  }

  try {
    const data = await getAssetHistoryByRange(userId, params.id, {
      startDate,
      endDate,
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
