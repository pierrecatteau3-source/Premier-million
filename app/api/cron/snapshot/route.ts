export const runtime = "nodejs";

/**
 * GET /api/cron/snapshot
 * Appelée 2× par jour par un cron Railway (7h + 16h UTC ≈ 9h et 18h Paris).
 * Sécurisée par Authorization: Bearer CRON_SECRET.
 *
 * Ne traite QUE les actifs avec pricing live (live_crypto / live_equity).
 * Les actifs manual / savings sont laissés tels quels (snapshot inchangé).
 * Utilise upsert sur [assetId, date] (date = minuit UTC du jour) — la 2e
 * exécution de la journée écrase la 1re (close > open dans l'historique).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchEquityCurrentPrices } from "@/lib/services/yahoo.service";
import { fetchCryptoCurrentPrices } from "@/lib/services/coingecko.service";

// ─── Helpers prix ──────────────────────────────────────────────────────────────
// Crypto via CoinGecko, equity via fetch direct /v8/chart — services centralisés
// et résilients (timeout, retry, rejet des prix <= 0).

async function fetchCryptoPrices(ids: string[]): Promise<Record<string, number | null>> {
  if (ids.length === 0) return {};
  return fetchCryptoCurrentPrices(ids);
}

async function fetchEquityPrices(tickers: string[]): Promise<Record<string, number | null>> {
  if (tickers.length === 0) return {};
  return fetchEquityCurrentPrices(tickers);
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vérification de la clé secrète
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Date du snapshot = aujourd'hui à minuit UTC
  const now = new Date();
  const snapshotDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  // Ne récupérer QUE les actifs avec un pricing live (crypto / equity) + ticker
  const assets = await prisma.asset.findMany({
    where: {
      pricingMode: { in: ["live_crypto", "live_equity"] },
      ticker: { not: null },
    },
    include: {
      transactions: { select: { quantite: true } },
    },
  });

  if (assets.length === 0) {
    return NextResponse.json({ snapshotsCreated: 0, snapshotsSkipped: 0 });
  }

  // Collecter les tickers par mode de pricing
  const cryptoIds: string[] = [];
  const equityTickers: string[] = [];

  for (const asset of assets) {
    if (asset.pricingMode === "live_crypto") cryptoIds.push(asset.ticker!);
    else if (asset.pricingMode === "live_equity") equityTickers.push(asset.ticker!);
  }

  // Dédoublonner
  const uniqueCrypto = Array.from(new Set(cryptoIds));
  const uniqueEquity = Array.from(new Set(equityTickers));

  // Fetch prix en parallèle
  const [cryptoPrices, equityPrices] = await Promise.all([
    fetchCryptoPrices(uniqueCrypto),
    fetchEquityPrices(uniqueEquity),
  ]);

  let snapshotsCreated = 0;
  let snapshotsSkipped = 0;

  for (const asset of assets) {
    const quantiteTotal = asset.transactions.reduce((s, t) => s + t.quantite, 0);

    if (quantiteTotal <= 0) {
      snapshotsSkipped++;
      continue;
    }

    const livePrice =
      asset.pricingMode === "live_crypto"
        ? (cryptoPrices[asset.ticker!] ?? null)
        : (equityPrices[asset.ticker!] ?? null);

    // Rejette null ET <= 0 (garde alignée sur /api/snapshots/sync) : un prix 0
    // signifie un échec source, pas une valeur réelle. Sans ce garde, le cron
    // écrivait un snapshot à 0 qui se propageait par carry-forward dans l'historique.
    if (livePrice == null || livePrice <= 0) {
      snapshotsSkipped++;
      continue;
    }

    const value = quantiteTotal * livePrice;

    // Upsert sur la contrainte unique [assetId, date]
    await prisma.snapshot.upsert({
      where: { assetId_date: { assetId: asset.id, date: snapshotDate } },
      update: { value },
      create: { assetId: asset.id, value, date: snapshotDate },
    });
    snapshotsCreated++;
  }

  return NextResponse.json({
    snapshotsCreated,
    snapshotsSkipped,
    date: snapshotDate.toISOString(),
  });
}
