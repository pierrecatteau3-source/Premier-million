export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/**
 * POST /api/recurring-investments/[id]/execute
 *
 * Exécute manuellement un investissement récurrent :
 * 1. Récupère le prix live de l'actif (live_equity → Yahoo Finance, live_crypto → CoinGecko)
 *    ou utilise le dernier Snapshot si pricingMode === "manual" / "savings"
 * 2. Calcule la quantité : amount / prixEntreeEur
 * 3. Crée une Transaction avec source: "auto"
 * 4. Retourne { transaction, prixUtilise, quantite }
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  // ── 1. Charger le RecurringInvestment avec l'actif ─────────────────────────
  const recurring = await prisma.recurringInvestment.findFirst({
    where: { id: params.id, userId },
    include: {
      asset: {
        include: {
          snapshots: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!recurring) {
    return NextResponse.json({ error: "Investissement récurrent introuvable" }, { status: 404 });
  }

  if (!recurring.active) {
    return NextResponse.json({ error: "Cet investissement récurrent est désactivé" }, { status: 400 });
  }

  const { asset } = recurring;

  // ── 2. Récupérer le prix live selon pricingMode ────────────────────────────
  let prixEntreeEur: number | null = null;
  let prixSource: "live_equity" | "live_crypto" | "snapshot" | "fallback" = "fallback";

  if (
    (asset.pricingMode === "live_equity" || asset.pricingMode === "live_crypto") &&
    asset.ticker
  ) {
    try {
      if (asset.pricingMode === "live_equity") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const YahooFinance = (await import("yahoo-finance2")).default;
        const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
        const result = await yahooFinance.quoteSummary(asset.ticker, { modules: ["price"] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (result as any).price as { regularMarketPrice?: number } | undefined;
        prixEntreeEur = p?.regularMarketPrice ?? null;
        prixSource = "live_equity";
      } else {
        // live_crypto → CoinGecko
        const apiKey = process.env.COINGECKO_API_KEY;
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(asset.ticker)}&vs_currencies=eur`;
        const headers: Record<string, string> = { Accept: "application/json" };
        if (apiKey && apiKey !== "REMPLACER_PAR_TA_CLE") {
          headers["x-cg-demo-api-key"] = apiKey;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(url, { headers, signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const raw = (await res.json()) as Record<string, Record<string, number>>;
            prixEntreeEur = raw[asset.ticker]?.["eur"] ?? null;
            prixSource = "live_crypto";
          }
        } catch {
          clearTimeout(timeout);
        }
      }
    } catch {
      // La récupération live a échoué → on tombera sur le fallback snapshot
    }
  }

  // ── 3. Fallback : dernier Snapshot ────────────────────────────────────────
  if (prixEntreeEur === null) {
    const lastSnapshot = asset.snapshots[0];
    if (lastSnapshot) {
      prixEntreeEur = lastSnapshot.value;
      prixSource = "snapshot";
    }
  }

  // ── 4. Dernier fallback : montant = 1 unité ───────────────────────────────
  if (prixEntreeEur === null || prixEntreeEur <= 0) {
    prixEntreeEur = recurring.amount;
    prixSource = "fallback";
  }

  // ── 5. Calculer la quantité ────────────────────────────────────────────────
  const montantInvesti = recurring.amount;
  const quantite = montantInvesti / prixEntreeEur;

  console.log(
    `[recurring/execute] id=${recurring.id} asset=${asset.name} ` +
      `pricingMode=${asset.pricingMode} ticker=${asset.ticker ?? "—"} ` +
      `prixUtilise=${prixEntreeEur} (source: ${prixSource}) ` +
      `quantite=${quantite} montant=${montantInvesti}`
  );

  // ── 6. Créer la Transaction ────────────────────────────────────────────────
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      assetId: asset.id,
      date: new Date(),
      quantite,
      prixEntreeEur,
      montantInvesti,
      source: "auto",
    },
  });

  return NextResponse.json(
    {
      transaction: {
        ...transaction,
        date: transaction.date.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
      },
      prixUtilise: prixEntreeEur,
      prixSource,
      quantite,
    },
    { status: 201 }
  );
}

