import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { HORIZON } from "@/types";
import type { Horizon } from "@/types";

const validHorizons = Object.values(HORIZON);

// GET /api/analysis/[horizon]?type=PORTFOLIO|MARKET — retourne la dernière analyse pour cet horizon
// (aucune expiration : les analyses sont conservées en base indéfiniment)
export async function GET(
  req: NextRequest,
  { params }: { params: { horizon: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  if (!validHorizons.includes(params.horizon as (typeof validHorizons)[number])) {
    return NextResponse.json(
      { error: `Horizon invalide. Valeurs acceptées : ${validHorizons.join(", ")}` },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const analysisType = searchParams.get("type") ?? "PORTFOLIO";

  const analysis = await prisma.analysis.findFirst({
    where: {
      userId,
      horizon: params.horizon as Horizon,
      type: analysisType,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!analysis) {
    return NextResponse.json(
      { error: "Aucune analyse disponible pour cet horizon — générez-en une." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      analysis: {
        id: analysis.id,
        userId: analysis.userId,
        horizon: analysis.horizon,
        type: analysis.type,
        content: analysis.content,
        createdAt: analysis.createdAt.toISOString(),
      },
      cached: true,
    },
  });
}
