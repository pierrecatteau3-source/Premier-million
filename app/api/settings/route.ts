import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Masque une clé : on n'expose jamais la valeur complète au client. */
function mask(key: string | null): { configured: boolean; hint: string | null } {
  if (!key) return { configured: false, hint: null };
  const tail = key.length >= 4 ? key.slice(-4) : key;
  return { configured: true, hint: `••••${tail}` };
}

// GET /api/settings — état masqué des clés API courtiers
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { xtbApiKey: true, bitpandaApiKey: true },
  });

  return NextResponse.json({
    data: {
      xtb: mask(user?.xtbApiKey ?? null),
      bitpanda: mask(user?.bitpandaApiKey ?? null),
    },
  });
}

// Règle par champ : chaîne non vide = nouvelle valeur · "" = effacer · absent = inchangé
const patchSchema = z.object({
  xtbApiKey: z.string().max(500).optional(),
  bitpandaApiKey: z.string().max(500).optional(),
});

// PATCH /api/settings — enregistre / efface une ou plusieurs clés
export async function PATCH(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const data: { xtbApiKey?: string | null; bitpandaApiKey?: string | null } = {};
  if (parsed.data.xtbApiKey !== undefined) {
    const v = parsed.data.xtbApiKey.trim();
    data.xtbApiKey = v === "" ? null : v;
  }
  if (parsed.data.bitpandaApiKey !== undefined) {
    const v = parsed.data.bitpandaApiKey.trim();
    data.bitpandaApiKey = v === "" ? null : v;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucune clé à mettre à jour." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { xtbApiKey: true, bitpandaApiKey: true },
  });

  return NextResponse.json({
    data: {
      xtb: mask(updated.xtbApiKey),
      bitpanda: mask(updated.bitpandaApiKey),
    },
  });
}
