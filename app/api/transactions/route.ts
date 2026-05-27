import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const createSchema = z.object({
  assetId: z.string().min(1),
  date: z.string().min(1),
  quantite: z.number().positive(),
  prixEntreeEur: z.number().positive(),
  source: z.enum(["manuel", "virement_auto"]).optional().default("manuel"),
  note: z.string().max(300).nullable().optional(),
});

// Types d'actifs Cash et Épargne à exclure de l'historique des achats
const EXCLUDED_ASSET_TYPES = [
  "Compte courant",
  "Cash disponible",
  "Livret A",
  "LDD / LDDS",
  "LEP",
  "Comptes à Terme",
  "Monétaire",
] as const;

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const assetId = req.nextUrl.searchParams.get("assetId");

  // Mode détail actif : assetId fourni → comportement existant (utilisé par TransactionForm)
  if (assetId) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });

    const transactions = await prisma.transaction.findMany({
      where: { assetId, userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      data: transactions.map((t) => ({
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  }

  // Mode historique global : toutes les transactions de l'utilisateur,
  // avec les données de l'actif associé, hors actifs Cash et Épargne.
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      asset: {
        type: { notIn: EXCLUDED_ASSET_TYPES as unknown as string[] },
      },
    },
    include: { asset: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    data: transactions.map((t) => ({
      id: t.id,
      assetId: t.assetId,
      userId: t.userId,
      date: t.date.toISOString(),
      quantite: t.quantite,
      prixEntreeEur: t.prixEntreeEur,
      montantInvesti: t.montantInvesti,
      source: t.source,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
      asset: {
        id: t.asset.id,
        name: t.asset.name,
        pilier: t.asset.pilier,
        type: t.asset.type,
      },
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { assetId, date, quantite, prixEntreeEur, source, note } = parsed.data;

  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) return NextResponse.json({ error: "Actif introuvable" }, { status: 404 });

  const montantInvesti = quantite * prixEntreeEur;
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      assetId,
      date: new Date(date),
      quantite,
      prixEntreeEur,
      montantInvesti,
      source: source ?? "manuel",
      note: note ?? null,
    },
  });

  // Snapshot cost-basis : cumul montantInvesti pour cet actif jusqu'à la date de la transaction
  const snapDate = new Date(date);
  snapDate.setHours(0, 0, 0, 0);

  const allTxUpToDate = await prisma.transaction.findMany({
    where: { assetId, date: { lte: snapDate } },
    select: { montantInvesti: true },
  });
  const cumul = allTxUpToDate.reduce((s, t) => s + t.montantInvesti, 0);

  await prisma.snapshot.createMany({
    data: [{ assetId, value: cumul, date: snapDate }],
    skipDuplicates: true,
  });

  revalidatePath("/portefeuille");
  revalidatePath("/historique");

  return NextResponse.json({
    data: {
      ...transaction,
      date: transaction.date.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
    },
  }, { status: 201 });
}
