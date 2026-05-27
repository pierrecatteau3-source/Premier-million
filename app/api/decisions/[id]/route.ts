import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// DELETE /api/decisions/[id] — supprime une décision
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const decision = await prisma.decision.findUnique({
    where: { id: params.id },
  });

  if (!decision) {
    return NextResponse.json({ error: "Décision introuvable" }, { status: 404 });
  }

  if (decision.userId !== userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.decision.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
