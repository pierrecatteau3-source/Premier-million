import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";


const updateAssetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pilier: z.enum(["PEA", "CRYPTO", "IMMO", "AUTRE", "LIQUIDITE"]).optional(),
  type: z.string().min(1).max(50).optional(),
});

// PUT /api/assets/[id] — modifie un actif
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const existing = await prisma.asset.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateAssetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({
      data: {
        id: asset.id,
        name: asset.name,
        pilier: asset.pilier,
        type: asset.type,
        userId: asset.userId,
        createdAt: asset.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/assets/[id] — supprime un actif et ses snapshots (cascade DB)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const existing = await prisma.asset.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  }

  try {
    await prisma.asset.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/assets/[id] — update ticker and pricingMode
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const patchSchema = z.object({
    ticker: z.string().max(100).nullable().optional(),
    pricingMode: z.enum(["live_crypto", "live_equity", "manual", "savings"]).optional(),
  });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({ where: { id: params.id, userId } });
  if (!asset) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.ticker !== undefined && { ticker: parsed.data.ticker }),
      ...(parsed.data.pricingMode !== undefined && { pricingMode: parsed.data.pricingMode }),
    },
  });

  return NextResponse.json({ data: updated });
}
