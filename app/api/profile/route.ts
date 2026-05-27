import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import type { AllocationDetaillee } from "@/types";
import { TYPE_TO_PILIER } from "@/lib/constants/allocation-types";

function computeAllocationCible(lines: AllocationDetaillee) {
  const totals = { pea: 0, crypto: 0, immo: 0, autre: 0 };
  const pilierMap: Record<string, "pea" | "crypto" | "immo" | "autre"> = {
    PEA: "pea",
    CRYPTO: "crypto",
    IMMO: "immo",
    AUTRE: "autre",
  };
  for (const line of lines) {
    const upperPilier = TYPE_TO_PILIER[line.type] ?? "AUTRE";
    const pilier = pilierMap[upperPilier] ?? "autre";
    totals[pilier] += line.pct;
  }
  return totals;
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  objectif: z.number().positive().optional(),
  ageCible: z.number().int().min(18).max(100).nullable().optional(),
  ageActuel: z.number().int().min(1).max(120).nullable().optional(),
  epargneMensuelle: z.number().nonnegative().nullable().optional(),
  epargnePrecaution: z.number().int().min(0).max(36).nullable().optional(),
  epargnePrecautionMontant: z.number().nonnegative().nullable().optional(),
  evolutionEpargne: z.number().min(-50).max(100).nullable().optional(),
  risqueMaxPerte: z.number().min(0).max(100).nullable().optional(),
  niveauConnaissance: z.enum(["Débutant", "Intermédiaire", "Avancé"]).nullable().optional(),
  objectifCroissance: z.number().min(0).max(100).nullable().optional(),
  allocationCible: z
    .object({
      pea: z.number().min(0).max(100),
      crypto: z.number().min(0).max(100),
      immo: z.number().min(0).max(100),
      autre: z.number().min(0).max(100),
    })
    .refine(
      (v) => Math.round(v.pea + v.crypto + v.immo + v.autre) === 100,
      { message: "L'allocation cible doit totaliser 100 %" }
    )
    .optional(),
  allocationDetaillee: z
    .array(
      z.object({
        type: z.string().min(1),
        subtype: z.string().min(1),
        pct: z.number().min(0).max(100),
      })
    )
    .nullable()
    .optional(),
});

// GET /api/profile — retourne le profil + progressionPercent
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      objectif: true,
      ageCible: true,
      ageActuel: true,
      epargneMensuelle: true,
      epargnePrecaution: true,
      epargnePrecautionMontant: true,
      evolutionEpargne: true,
      risqueMaxPerte: true,
      niveauConnaissance: true,
      objectifCroissance: true,
      allocationCible: true,
      allocationDetaillee: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const portfolio = await getPortfolioSummary(userId);
  const progressionPercent =
    user.objectif > 0
      ? Math.min(
          Math.round((portfolio.totalValue / user.objectif) * 1000) / 10,
          100
        )
      : 0;

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      objectif: user.objectif,
      ageCible: user.ageCible,
      ageActuel: user.ageActuel,
      epargneMensuelle: user.epargneMensuelle,
      epargnePrecaution: user.epargnePrecaution,
      epargnePrecautionMontant: user.epargnePrecautionMontant,
      evolutionEpargne: user.evolutionEpargne,
      risqueMaxPerte: user.risqueMaxPerte,
      niveauConnaissance: user.niveauConnaissance,
      objectifCroissance: user.objectifCroissance,
      allocationCible: user.allocationCible,
      allocationDetaillee: user.allocationDetaillee ?? null,
      createdAt: user.createdAt.toISOString(),
      progressionPercent,
    },
  });
}

// PUT /api/profile — met à jour le profil
export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.objectif !== undefined && { objectif: data.objectif }),
      ...(data.ageCible !== undefined && { ageCible: data.ageCible }),
      ...(data.ageActuel !== undefined && { ageActuel: data.ageActuel }),
      ...(data.epargneMensuelle !== undefined && {
        epargneMensuelle: data.epargneMensuelle,
      }),
      ...(data.epargnePrecaution !== undefined && { epargnePrecaution: data.epargnePrecaution }),
      ...(data.epargnePrecautionMontant !== undefined && { epargnePrecautionMontant: data.epargnePrecautionMontant }),
      ...(data.evolutionEpargne !== undefined && { evolutionEpargne: data.evolutionEpargne }),
      ...(data.risqueMaxPerte !== undefined && { risqueMaxPerte: data.risqueMaxPerte }),
      ...(data.niveauConnaissance !== undefined && { niveauConnaissance: data.niveauConnaissance }),
      ...(data.objectifCroissance !== undefined && { objectifCroissance: data.objectifCroissance }),
      ...(data.allocationDetaillee !== undefined && {
        allocationDetaillee: data.allocationDetaillee ?? undefined,
        ...(data.allocationDetaillee !== null && {
          allocationCible: computeAllocationCible(data.allocationDetaillee as AllocationDetaillee),
        }),
      }),
      ...(data.allocationCible !== undefined && data.allocationDetaillee === undefined && {
        allocationCible: data.allocationCible,
      }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      objectif: true,
      ageCible: true,
      ageActuel: true,
      epargneMensuelle: true,
      epargnePrecaution: true,
      epargnePrecautionMontant: true,
      evolutionEpargne: true,
      risqueMaxPerte: true,
      niveauConnaissance: true,
      objectifCroissance: true,
      allocationCible: true,
      allocationDetaillee: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      allocationDetaillee: updated.allocationDetaillee ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
