import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const patchSchema = z.object({
  active: z.boolean().optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const existing = await prisma.recurringInvestment.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const updateData: {
    active?: boolean;
    amount?: number;
    frequency?: string;
    dayOfWeek?: number | null;
    dayOfMonth?: number | null;
  } = {};
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
  if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
  if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
  if (parsed.data.dayOfWeek !== undefined) updateData.dayOfWeek = parsed.data.dayOfWeek;
  if (parsed.data.dayOfMonth !== undefined) updateData.dayOfMonth = parsed.data.dayOfMonth;

  const updated = await prisma.recurringInvestment.update({
    where: { id: params.id },
    data: updateData,
    include: { asset: { select: { name: true, pilier: true } } },
  });
  return NextResponse.json({
    data: { ...updated, createdAt: updated.createdAt.toISOString() },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;
  const existing = await prisma.recurringInvestment.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await prisma.recurringInvestment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
