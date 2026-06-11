import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import { calculateTargetAge } from "@/lib/utils/projection";
import { resolveAge } from "@/lib/utils/age";

export const dynamic = "force-dynamic";

/**
 * ROUTE DE DIAGNOSTIC TEMPORAIRE — à supprimer une fois le bug
 * « Objectif atteint à » résolu (même pattern que l'ex-/api/diag Yahoo).
 *
 * Reproduit À L'IDENTIQUE le calcul du dashboard et expose chaque entrée :
 * permet de voir en un coup d'œil quelle donnée en base est fausse/absente,
 * et quel commit tourne réellement en prod.
 */
export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  const [user, portfolio] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        objectif: true,
        epargneMensuelle: true,
        evolutionEpargne: true,
        ageCible: true,
        ageActuel: true,
        dateNaissance: true,
        objectifCroissance: true,
      },
    }),
    getPortfolioSummary(userId),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // Même logique que app/(dashboard)/dashboard/page.tsx
  const ageUtilise = resolveAge(user);
  const targetAge =
    ageUtilise != null && user.epargneMensuelle != null
      ? calculateTargetAge(
          portfolio.totalValue,
          user.epargneMensuelle,
          user.evolutionEpargne ?? 0,
          user.objectifCroissance ?? 8,
          ageUtilise
        )
      : null;

  return NextResponse.json({
    build: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "inconnu (local ?)",
    calculeLe: new Date().toISOString(),
    compte: { userId: user.id, email: user.email },
    entreesDuCalcul: {
      patrimoineTotal: portfolio.totalValue,
      epargneMensuelle: user.epargneMensuelle,
      evolutionEpargnePctParAn: user.evolutionEpargne ?? 0,
      tauxCroissancePctParAn: user.objectifCroissance ?? 8,
      dateNaissance: user.dateNaissance?.toISOString().slice(0, 10) ?? null,
      ageActuelLegacy: user.ageActuel,
      ageUtilise,
    },
    resultat: {
      objectifAtteintA: targetAge,
      objectif: user.objectif,
      ageCibleProfil: user.ageCible,
    },
  });
}
