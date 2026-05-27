import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
});

// GET /api/decisions — liste les décisions stratégiques
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const decisions = await prisma.decision.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    data: decisions.map((d) => ({
      id: d.id,
      userId: d.userId,
      date: d.date.toISOString(),
      description: d.description,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

// POST /api/decisions — crée une décision
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const decision = await prisma.decision.create({
    data: {
      userId,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: decision.id,
        userId: decision.userId,
        date: decision.date.toISOString(),
        description: decision.description,
        createdAt: decision.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
