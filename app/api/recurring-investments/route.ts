import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  assetId: z.string().cuid(),
  amount: z.number().positive(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;
  const data = await prisma.recurringInvestment.findMany({
    where: { userId },
    include: { asset: { select: { name: true, pilier: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    data: data.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  // Vérifier que l'actif appartient au user
  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, userId },
  });
  if (!asset)
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  const created = await prisma.recurringInvestment.create({
    data: { userId, ...parsed.data },
    include: { asset: { select: { name: true, pilier: true } } },
  });
  return NextResponse.json(
    { data: { ...created, createdAt: created.createdAt.toISOString() } },
    { status: 201 }
  );
}
