import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const snapshotSchema = z.object({
  assetId: z.string().cuid(),
  value: z.number().nonnegative(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
});

// GET /api/snapshots?assetId=xxx — historique des valeurs d'un actif
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const assetId = req.nextUrl.searchParams.get("assetId");

  try {
    const where = assetId
      ? // Vérifie que l'actif appartient bien à l'utilisateur
        { assetId, asset: { userId } }
      : { asset: { userId } };

    const snapshots = await prisma.snapshot.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({
      data: snapshots.map((s) => ({
        id: s.id,
        assetId: s.assetId,
        value: s.value,
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/snapshots — enregistre une valeur pour un actif
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = snapshotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Vérifie que l'actif appartient à l'utilisateur
  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, userId },
  });

  if (!asset) {
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  }

  try {
    const snapshot = await prisma.snapshot.create({
      data: {
        assetId: parsed.data.assetId,
        value: parsed.data.value,
        date: new Date(parsed.data.date),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: snapshot.id,
          assetId: snapshot.assetId,
          value: snapshot.value,
          date: snapshot.date.toISOString(),
          createdAt: snapshot.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/snapshots — upsert valeur pour un actif à une date
export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = snapshotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, userId },
  });

  if (!asset) {
    return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });
  }

  try {
    const dateObj = new Date(parsed.data.date);
    const snapshot = await prisma.snapshot.upsert({
      where: { assetId_date: { assetId: parsed.data.assetId, date: dateObj } },
      update: { value: parsed.data.value },
      create: { assetId: parsed.data.assetId, value: parsed.data.value, date: dateObj },
    });

    return NextResponse.json({
      data: {
        id: snapshot.id,
        assetId: snapshot.assetId,
        value: snapshot.value,
        date: snapshot.date.toISOString(),
        createdAt: snapshot.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
