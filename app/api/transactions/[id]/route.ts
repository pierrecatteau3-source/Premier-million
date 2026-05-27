import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
  });
  if (!transaction) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });

  await prisma.transaction.delete({ where: { id: params.id, userId } });

  const snapDate = new Date(transaction.date);
  snapDate.setHours(0, 0, 0, 0);

  const remainingTx = await prisma.transaction.findMany({
    where: { assetId: transaction.assetId, date: { lte: snapDate } },
    select: { montantInvesti: true },
  });
  const newCumul = remainingTx.reduce((s, t) => s + t.montantInvesti, 0);

  if (newCumul > 0) {
    await prisma.snapshot.upsert({
      where: { assetId_date: { assetId: transaction.assetId, date: snapDate } },
      update: { value: newCumul },
      create: { assetId: transaction.assetId, value: newCumul, date: snapDate },
    });
  } else {
    await prisma.snapshot.deleteMany({
      where: { assetId: transaction.assetId, date: snapDate },
    });
  }

  revalidatePath("/portefeuille");
  revalidatePath("/historique");

  return NextResponse.json({ success: true });
}

const patchSchema = z.object({
  prixEntreeEur: z.number().positive().optional(),
  quantite: z.number().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  // Vérifier que la transaction appartient à l'utilisateur
  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
  });
  if (!transaction) {
    return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  }

  // Vérifier la fenêtre de 3 mois
  const limiteDate = new Date();
  limiteDate.setMonth(limiteDate.getMonth() - 3);
  if (transaction.date < limiteDate) {
    return NextResponse.json(
      { error: "Modification impossible au-delà de 3 mois" },
      { status: 403 }
    );
  }

  // Valider le body
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newQuantite = parsed.data.quantite ?? transaction.quantite;
  const newPrixEntreeEur = parsed.data.prixEntreeEur ?? transaction.prixEntreeEur;
  const newMontantInvesti = newQuantite * newPrixEntreeEur;

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      quantite: newQuantite,
      prixEntreeEur: newPrixEntreeEur,
      montantInvesti: newMontantInvesti,
    },
  });

  // Recalculer le snapshot cost-basis pour la date de cette transaction
  const snapDatePatch = new Date(transaction.date);
  snapDatePatch.setHours(0, 0, 0, 0);

  const patchTx = await prisma.transaction.findMany({
    where: { assetId: transaction.assetId, date: { lte: snapDatePatch } },
    select: { montantInvesti: true },
  });
  const patchCumul = patchTx.reduce((s, t) => s + t.montantInvesti, 0);

  await prisma.snapshot.upsert({
    where: { assetId_date: { assetId: transaction.assetId, date: snapDatePatch } },
    update: { value: patchCumul },
    create: { assetId: transaction.assetId, value: patchCumul, date: snapDatePatch },
  });

  revalidatePath("/portefeuille");
  revalidatePath("/historique");

  return NextResponse.json({
    data: {
      ...updated,
      date: updated.date.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
