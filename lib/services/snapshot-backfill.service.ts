/**
 * Backfill de l'historique de MARCHÉ — SERVEUR UNIQUEMENT.
 *
 * Problème corrigé : les courbes des actifs live (equity / crypto) étaient
 * 100 % synthétiques. Les seuls points persistés étaient (a) la valeur du jour
 * et (b) des points de COÛT D'ACQUISITION aux dates de transaction. Aucun prix
 * de marché passé n'était jamais récupéré → courbe plate au prix d'achat qui ne
 * « sautait » qu'aux rares jours snapshotés. (cf. audit 2026-06-26)
 *
 * Ici on reconstruit de vrais points de marché journaliers :
 *   - equity → clôtures Yahoo (fetch direct /v8/chart, fiable)
 *   - crypto → historique CoinGecko (market_chart)
 * puis on upsert `Snapshot.value = quantitéDétenueÀCetteDate × clôture` sur la
 * clé [assetId, date=minuit UTC]. Le prix de marché PRIME sur le cost-basis
 * (un upsert écrase la valeur existante).
 *
 * Idempotent : un point déjà présent et identique n'est pas réécrit.
 * Ne throw jamais au niveau d'un actif (un échec source n'interrompt pas les autres).
 */

import { prisma } from "@/lib/prisma";
import { fetchEquityDailyCloses } from "@/lib/services/yahoo.service";
import { fetchCryptoDailyCloses } from "@/lib/services/coingecko.service";

const DAY_MS = 86_400_000;

export interface BackfillResult {
  assetsProcessed: number;
  snapshotsWritten: number;
}

interface BackfillAsset {
  id: string;
  ticker: string | null;
  pricingMode: string;
  transactions: { quantite: number; date: Date }[];
}

/** Minuit UTC d'une date. */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * À partir des clôtures journalières et des transactions, construit les lignes
 * Snapshot { date, value } = quantité cumulée détenue à la date × clôture.
 * Les jours antérieurs au 1er achat (quantité ≤ 0) sont ignorés.
 */
function buildMarketRows(
  closes: { date: Date; close: number }[],
  transactions: { quantite: number; date: Date }[]
): { date: Date; value: number }[] {
  const sortedTx = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const rows: { date: Date; value: number }[] = [];
  let txIdx = 0;
  let qty = 0;

  for (const { date, close } of closes) {
    // Intègre toutes les transactions dont la date ≤ ce jour de cotation.
    while (
      txIdx < sortedTx.length &&
      utcMidnight(sortedTx[txIdx].date).getTime() <= date.getTime()
    ) {
      qty += sortedTx[txIdx].quantite;
      txIdx++;
    }
    if (qty <= 0) continue;
    rows.push({ date, value: qty * close });
  }
  return rows;
}

/**
 * Persiste les lignes de marché pour un actif. Crée les nouvelles dates en lot
 * et ne met à jour que les valeurs réellement différentes (marché écrase
 * cost-basis). Renvoie le nombre de snapshots écrits.
 */
async function persistRows(
  assetId: string,
  rows: { date: Date; value: number }[],
  rangeStart: Date,
  rangeEnd: Date
): Promise<number> {
  if (rows.length === 0) return 0;

  const existing = await prisma.snapshot.findMany({
    where: { assetId, date: { gte: rangeStart, lte: rangeEnd } },
    select: { date: true, value: true },
  });
  const existingByTime = new Map(existing.map((s) => [s.date.getTime(), s.value]));

  const toCreate: { assetId: string; date: Date; value: number }[] = [];
  const toUpdate: { date: Date; value: number }[] = [];

  for (const r of rows) {
    const prev = existingByTime.get(r.date.getTime());
    if (prev === undefined) toCreate.push({ assetId, date: r.date, value: r.value });
    else if (Math.abs(prev - r.value) > 0.005) toUpdate.push(r);
  }

  if (toCreate.length > 0) {
    await prisma.snapshot.createMany({ data: toCreate, skipDuplicates: true });
  }
  for (const r of toUpdate) {
    await prisma.snapshot.update({
      where: { assetId_date: { assetId, date: r.date } },
      data: { value: r.value },
    });
  }
  return toCreate.length + toUpdate.length;
}

/** Borne de départ : 1re transaction, ou today − sinceDays si `sinceDays` fourni. */
function computeStart(
  transactions: { date: Date }[],
  sinceDays: number | undefined,
  now: Date
): Date {
  const firstTx = utcMidnight(
    transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date)
  );
  if (sinceDays == null) return firstTx;
  const recent = utcMidnight(new Date(now.getTime() - sinceDays * DAY_MS));
  return recent > firstTx ? recent : firstTx;
}

async function backfillEquity(
  asset: BackfillAsset,
  sinceDays: number | undefined,
  now: Date
): Promise<number> {
  const start = computeStart(asset.transactions, sinceDays, now);
  // period2 arrondi à l'heure courante → URL stable ⇒ cache Next réutilisable.
  const period2 = Math.floor(now.getTime() / 1000 / 3600) * 3600;
  const period1 = Math.floor(start.getTime() / 1000);

  const closes = await fetchEquityDailyCloses(asset.ticker!, period1, period2);
  if (closes.length === 0) return 0;

  const rows = buildMarketRows(closes, asset.transactions);
  return persistRows(asset.id, rows, start, utcMidnight(now));
}

async function backfillCrypto(
  asset: BackfillAsset,
  sinceDays: number | undefined,
  now: Date
): Promise<number> {
  const start = computeStart(asset.transactions, sinceDays, now);
  const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / DAY_MS) + 1);

  const closes = await fetchCryptoDailyCloses(asset.ticker!, days);
  if (closes.length === 0) return 0;

  // On ne garde que les points dans [start, today] (market_chart renvoie parfois
  // un peu plus large selon la granularité CoinGecko).
  const startMs = start.getTime();
  const inRange = closes.filter((c) => c.date.getTime() >= startMs);
  const rows = buildMarketRows(inRange, asset.transactions);
  return persistRows(asset.id, rows, start, utcMidnight(now));
}

/**
 * Backfill l'historique de marché de tous les actifs live d'un utilisateur.
 * @param sinceDays  si fourni, ne reconstruit que les N derniers jours (self-heal
 *                   léger) ; sinon reconstruit depuis la 1re transaction (réparation).
 */
export async function backfillMarketHistory(
  userId: string,
  opts: { sinceDays?: number } = {}
): Promise<BackfillResult> {
  const assets = await prisma.asset.findMany({
    where: {
      userId,
      pricingMode: { in: ["live_equity", "live_crypto"] },
      ticker: { not: null },
    },
    select: {
      id: true,
      ticker: true,
      pricingMode: true,
      transactions: { select: { quantite: true, date: true } },
    },
  });

  const now = new Date();
  let snapshotsWritten = 0;
  let assetsProcessed = 0;

  for (const asset of assets) {
    if (!asset.ticker || asset.transactions.length === 0) continue;
    try {
      const written =
        asset.pricingMode === "live_equity"
          ? await backfillEquity(asset, opts.sinceDays, now)
          : await backfillCrypto(asset, opts.sinceDays, now);
      snapshotsWritten += written;
      assetsProcessed++;
    } catch (err) {
      console.warn(`[backfill] échec actif ${asset.ticker}`, err);
    }
  }

  return { assetsProcessed, snapshotsWritten };
}
