import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PILIER } from "@/types";

const createAssetSchema = z.object({
  name: z.string().min(1).max(100),
  pilier: z.enum(["PEA", "CRYPTO", "IMMO", "AUTRE", "LIQUIDITE"]),
  type: z.string().min(1).max(50),
});

// GET /api/assets — liste tous les actifs de l'utilisateur avec leur dernier snapshot
// Paramètre optionnel : ?needsMigration=true — retourne uniquement les actifs en mode prix
// live qui n'ont encore aucune transaction enregistrée (pour le MigrationPrompt).
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const needsMigration = req.nextUrl.searchParams.get("needsMigration") === "true";

  try {
    const assets = await prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        snapshots: {
          orderBy: { date: "desc" },
          take: 1,
        },
        transactions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // Filtre : actifs en mode prix live sans aucune transaction
    const filtered = needsMigration
      ? assets.filter(
          (a) =>
            (a.pricingMode === "live_crypto" || a.pricingMode === "live_equity") &&
            a.transactions.length === 0
        )
      : assets;

    // Pour la migration, on a besoin du snapshot le plus ancien (date initiale d'achat)
    let oldestSnapMap: Record<string, string | null> = {};
    if (needsMigration && filtered.length > 0) {
      const oldestSnaps = await prisma.snapshot.findMany({
        where: { assetId: { in: filtered.map((a) => a.id) } },
        orderBy: { date: "asc" },
        distinct: ["assetId"],
        select: { assetId: true, date: true },
      });
      oldestSnapMap = Object.fromEntries(
        oldestSnaps.map((s) => [s.assetId, s.date.toISOString()])
      );
    }

    const data = filtered.map((asset) => ({
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker ?? null,
      pilier: asset.pilier,
      type: asset.type,
      userId: asset.userId,
      createdAt: asset.createdAt.toISOString(),
      latestValue: asset.snapshots[0]?.value ?? null,
      latestDate: asset.snapshots[0]?.date.toISOString() ?? null,
      // Date du snapshot le plus ancien — utilisé comme date d'achat par défaut dans la migration
      oldestSnapshotDate: needsMigration ? (oldestSnapMap[asset.id] ?? null) : undefined,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/assets — crée un nouvel actif
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = createAssetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const asset = await prisma.asset.create({
      data: { ...parsed.data, userId },
    });

    return NextResponse.json(
      {
        data: {
          id: asset.id,
          name: asset.name,
          pilier: asset.pilier,
          type: asset.type,
          userId: asset.userId,
          createdAt: asset.createdAt.toISOString(),
          latestValue: null,
          latestDate: null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/assets]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Évite l'erreur TS "unused import"
void PILIER;
