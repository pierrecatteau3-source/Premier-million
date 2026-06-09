/**
 * Service d'import BitPanda — SERVEUR UNIQUEMENT.
 *
 * Récupère l'activité du compte BitPanda via l'API publique grand public
 * (https://api.bitpanda.com/v1) et l'importe dans le portefeuille :
 *   - chaque achat (y compris les plans d'épargne / investissements automatiques,
 *     marqués `is_savings: true`) devient une Transaction `source: "bitpanda"` ;
 *   - l'actif crypto correspondant est créé à la volée s'il n'existe pas encore ;
 *   - des snapshots cost-basis sont reconstruits pour alimenter l'historique.
 *
 * L'import NE remplace PAS les saisies manuelles : il s'ajoute. Le dédoublonnage
 * repose sur `Transaction.externalId` (= id du trade BitPanda), donc relancer
 * l'import ne crée jamais de doublon.
 *
 * Périmètre actuel (décision produit 2026-06-09) : crypto uniquement, achats
 * uniquement, déclenchement manuel depuis /parametres.
 */

import { prisma } from "@/lib/prisma";
import { coingeckoIdForSymbol } from "@/lib/constants/crypto-coingecko";

const BITPANDA_API_BASE = "https://api.bitpanda.com/v1";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_PAGES = 50; // garde-fou pagination (50 × 100 = 5000 trades max)

/** Erreur « attendue » dont le message peut être renvoyé tel quel au client. */
export class BitpandaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BitpandaError";
  }
}

export interface BitpandaImportResult {
  /** Transactions effectivement créées. */
  imported: number;
  /** Trades déjà importés lors d'un run précédent (dédoublonnés). */
  skipped: number;
  /** Actifs crypto créés automatiquement pendant l'import. */
  assetsCreated: number;
  /** Trades écartés (ventes, swaps, statut non finalisé, coin introuvable…). */
  ignored: number;
}

// ─── Types bruts BitPanda (champs utiles uniquement) ────────────────────────────

interface BpWallet {
  attributes?: {
    cryptocoin_id?: string;
    cryptocoin_symbol?: string;
    name?: string;
  };
}

interface BpTrade {
  id: string;
  attributes?: {
    status?: string; // "finished" | "pending" | "processing" | ...
    type?: string; // "buy" | "sell"
    cryptocoin_id?: string;
    amount_fiat?: string; // dans la fiat du trade
    amount_cryptocoin?: string;
    fiat_to_eur_rate?: string; // multiplicateur fiat → EUR
    price?: string; // prix unitaire dans la fiat du trade
    is_savings?: boolean;
    is_swap?: boolean;
    time?: { date_iso8601?: string };
  };
}

// ─── Appels HTTP ────────────────────────────────────────────────────────────────

async function bpFetch<T>(path: string, apiKey: string, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BITPANDA_API_BASE}${path}`, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      signal: controller.signal,
    });
  } catch {
    throw new BitpandaError("Connexion à BitPanda impossible (réseau ou délai dépassé).");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 || res.status === 403) {
    throw new BitpandaError(
      `Accès refusé par BitPanda (${res.status}) sur ${label}. Vérifie que la clé est ` +
        `bien confirmée par email et qu'elle a les droits Trade + Transaction + Balance.`
    );
  }
  if (res.status === 429) {
    throw new BitpandaError("BitPanda limite les requêtes pour l'instant. Réessaie dans un moment.");
  }
  if (!res.ok) {
    throw new BitpandaError(`BitPanda a répondu une erreur (${res.status}) sur ${label}.`);
  }
  return (await res.json()) as T;
}

/** cryptocoin_id → { symbol, name } via /v1/wallets (les trades n'ont que l'id). */
async function fetchWalletSymbolMap(
  apiKey: string
): Promise<Map<string, { symbol: string; name: string }>> {
  const json = await bpFetch<{ data?: BpWallet[] }>(
    `/wallets?page_size=500`,
    apiKey,
    "les portefeuilles (droit Balance)"
  );
  const map = new Map<string, { symbol: string; name: string }>();
  for (const w of json.data ?? []) {
    const id = w.attributes?.cryptocoin_id;
    const symbol = w.attributes?.cryptocoin_symbol;
    if (id && symbol) {
      map.set(id, { symbol, name: w.attributes?.name?.trim() || symbol });
    }
  }
  return map;
}

/** Tous les achats du compte, en suivant la pagination par curseur. */
async function fetchAllBuyTrades(apiKey: string): Promise<BpTrade[]> {
  const all: BpTrade[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ type: "buy", page_size: "100" });
    if (cursor) params.set("cursor", cursor);

    const json = await bpFetch<{
      data?: BpTrade[];
      meta?: { next_cursor?: string | null };
    }>(`/trades?${params.toString()}`, apiKey, "les achats (droit Trade)");

    const batch = json.data ?? [];
    all.push(...batch);

    const next = json.meta?.next_cursor ?? null;
    if (!next || batch.length === 0) break;
    cursor = next;
  }

  return all;
}

// ─── Snapshots cost-basis ───────────────────────────────────────────────────────

/**
 * Recalcule et insère les snapshots cost-basis (cumul du montant investi) aux dates
 * de transaction d'un actif. Reproduit la sémantique de la saisie manuelle :
 * `skipDuplicates` → on ne réécrit jamais un snapshot existant (notamment les
 * valeurs de marché posées par le cron). Seules les dates sans snapshot reçoivent
 * un point cost-basis.
 */
async function rebuildCostBasisSnapshots(assetId: string): Promise<void> {
  const txs = await prisma.transaction.findMany({
    where: { assetId },
    select: { date: true, montantInvesti: true },
    orderBy: { date: "asc" },
  });
  if (txs.length === 0) return;

  let cumul = 0;
  const cumulByDate = new Map<number, number>();
  for (const t of txs) {
    cumul += t.montantInvesti;
    const d = new Date(t.date);
    d.setHours(0, 0, 0, 0);
    cumulByDate.set(d.getTime(), cumul); // dernière écriture du jour = cumul de fin de journée
  }

  const data = Array.from(cumulByDate.entries()).map(([ms, value]) => ({
    assetId,
    value,
    date: new Date(ms),
  }));

  await prisma.snapshot.createMany({ data, skipDuplicates: true });
}

// ─── Import principal ───────────────────────────────────────────────────────────

export async function importBitpandaTrades(userId: string): Promise<BitpandaImportResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bitpandaApiKey: true },
  });
  const apiKey = user?.bitpandaApiKey?.trim();
  if (!apiKey) {
    throw new BitpandaError("Aucune clé API BitPanda enregistrée. Ajoute-la d'abord.");
  }

  const result: BitpandaImportResult = {
    imported: 0,
    skipped: 0,
    assetsCreated: 0,
    ignored: 0,
  };

  const [walletMap, trades] = await Promise.all([
    fetchWalletSymbolMap(apiKey),
    fetchAllBuyTrades(apiKey),
  ]);

  // Index des actifs CRYPTO existants (par ticker et par nom, en majuscules).
  const existingAssets = await prisma.asset.findMany({
    where: { userId, pilier: "CRYPTO" },
    select: { id: true, ticker: true, name: true },
  });
  const assetByKey = new Map<string, string>();
  for (const a of existingAssets) {
    if (a.ticker) assetByKey.set(a.ticker.toUpperCase(), a.id);
    assetByKey.set(`NAME:${a.name.toUpperCase()}`, a.id);
  }

  // Trades déjà importés (dédoublonnage).
  const alreadyImported = await prisma.transaction.findMany({
    where: { userId, externalId: { not: null } },
    select: { externalId: true },
  });
  const importedIds = new Set(alreadyImported.map((t) => t.externalId as string));

  const affectedAssetIds = new Set<string>();

  for (const trade of trades) {
    const a = trade.attributes;
    if (!a) {
      result.ignored++;
      continue;
    }

    // Garde-fous : achats finalisés uniquement.
    if (a.type !== "buy" || a.status !== "finished") {
      result.ignored++;
      continue;
    }
    if (importedIds.has(trade.id)) {
      result.skipped++;
      continue;
    }

    const wallet = a.cryptocoin_id ? walletMap.get(a.cryptocoin_id) : undefined;
    const symbol = wallet?.symbol;
    if (!symbol) {
      result.ignored++; // coin introuvable dans les wallets → on ne sait pas quoi créer
      continue;
    }

    const rate = parseFloat(a.fiat_to_eur_rate ?? "1") || 1;
    const quantite = parseFloat(a.amount_cryptocoin ?? "");
    const prixEntreeEur = parseFloat(a.price ?? "") * rate;
    const montantInvesti = parseFloat(a.amount_fiat ?? "") * rate;
    const iso = a.time?.date_iso8601;
    if (!(quantite > 0) || !(prixEntreeEur > 0) || !iso) {
      result.ignored++;
      continue;
    }

    // Résolution / création de l'actif.
    const cgId = coingeckoIdForSymbol(symbol);
    const tickerKey = (cgId ?? symbol).toUpperCase();
    let assetId = assetByKey.get(tickerKey) ?? assetByKey.get(`NAME:${symbol.toUpperCase()}`);
    if (!assetId) {
      const created = await prisma.asset.create({
        data: {
          userId,
          name: symbol,
          pilier: "CRYPTO",
          type: "Token",
          pricingMode: cgId ? "live_crypto" : "manual",
          ticker: cgId ?? symbol,
        },
        select: { id: true },
      });
      assetId = created.id;
      assetByKey.set(tickerKey, assetId);
      assetByKey.set(`NAME:${symbol.toUpperCase()}`, assetId);
      result.assetsCreated++;
    }

    await prisma.transaction.create({
      data: {
        userId,
        assetId,
        date: new Date(iso),
        quantite,
        prixEntreeEur,
        montantInvesti,
        source: "bitpanda",
        note: a.is_savings ? "Plan d'épargne BitPanda" : "Import BitPanda",
        externalId: trade.id,
      },
    });

    importedIds.add(trade.id);
    affectedAssetIds.add(assetId);
    result.imported++;
  }

  for (const assetId of Array.from(affectedAssetIds)) {
    await rebuildCostBasisSnapshots(assetId);
  }

  return result;
}
