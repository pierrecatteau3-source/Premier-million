import { prisma } from "@/lib/prisma";
import type { PortfolioSummary, PilierSummary, Pilier } from "@/types";

/** Extrait la date locale YYYY-MM-DD sans décalage UTC */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type AllocationCible = { pea: number; crypto: number; immo: number; autre: number };

/** Piliers réels (hors LIQUIDITE) utilisés pour les graphiques et l'allocation cible */
const PILIERS_REELS: Pilier[] = ["PEA", "CRYPTO", "IMMO", "AUTRE"];

const TARGET_MAP_KEY: Record<Pilier, keyof AllocationCible | null> = {
  PEA: "pea",
  CRYPTO: "crypto",
  IMMO: "immo",
  AUTRE: "autre",
  LIQUIDITE: null,
};

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allocationCible: true },
  });

  const allocationCible = (user?.allocationCible ?? {
    pea: 25, crypto: 25, immo: 25, autre: 25,
  }) as AllocationCible;

  const assets = await prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      snapshots: {
        orderBy: { date: "desc" },
        take: 2,
      },
      transactions: {
        select: { quantite: true, montantInvesti: true, prixEntreeEur: true },
      },
    },
  });

  if (assets.length === 0) {
    return buildEmpty();
  }

  // Agrège par pilier (piliers réels uniquement — LIQUIDITE est géré séparément)
  const pilierAgg = new Map<Pilier, {
    currentValue: number;
    prevValue: number;
    assets: typeof assets;
  }>();

  for (const p of PILIERS_REELS) {
    pilierAgg.set(p, { currentValue: 0, prevValue: 0, assets: [] });
  }

  let totalValue = 0;
  let totalPrevValue = 0;
  let liquidites = 0;
  let lastUpdated: Date | null = null;
  const liquiditeAssets: typeof assets = [];

  for (const asset of assets) {
    const current = asset.snapshots[0]?.value ?? 0;
    const prev = asset.snapshots[1]?.value ?? current;

    // LIQUIDITE contribue au patrimoine total mais pas aux piliers
    if (asset.pilier === "LIQUIDITE") {
      totalValue += current;
      totalPrevValue += prev;
      liquidites += current;
      liquiditeAssets.push(asset);
    } else {
      const agg = pilierAgg.get(asset.pilier as Pilier)!;
      agg.currentValue += current;
      agg.prevValue += prev;
      agg.assets.push(asset);
      totalValue += current;
      totalPrevValue += prev;
    }

    const snap = asset.snapshots[0];
    if (snap && (!lastUpdated || snap.date > lastUpdated)) {
      lastUpdated = snap.date;
    }
  }

  // Base investissable (hors liquidités) — utilisée pour les % des piliers
  const totalInvestissable = totalValue - liquidites;

  // Helper : mapper un asset Prisma → PilierAsset
  function mapAsset(a: (typeof assets)[number]) {
    const quantiteTotal = a.transactions.reduce((s, t) => s + t.quantite, 0);
    const coutRevient = a.transactions.reduce((s, t) => s + t.montantInvesti, 0);
    const pmp = quantiteTotal > 0 ? coutRevient / quantiteTotal : null;
    const latestValue = a.snapshots[0]?.value ?? undefined;
    const pvLatente = coutRevient > 0 && latestValue != null ? latestValue - coutRevient : null;
    const pvPct = coutRevient > 0 && pvLatente != null ? (pvLatente / coutRevient) * 100 : null;

    return {
      id: a.id,
      name: a.name,
      type: a.type,
      ticker: a.ticker ?? null,
      pricingMode: a.pricingMode,
      latestValue,
      latestDate: a.snapshots[0]?.date.toISOString() ?? undefined,
      quantiteTotal: quantiteTotal > 0 ? quantiteTotal : null,
      coutRevient: coutRevient > 0 ? coutRevient : null,
      pmp,
      pvLatente,
      pvPct,
    };
  }

  const piliers: PilierSummary[] = PILIERS_REELS.map((pilier) => {
    const agg = pilierAgg.get(pilier)!;
    const percentage = totalInvestissable > 0 ? (agg.currentValue / totalInvestissable) * 100 : 0;
    const targetKey = TARGET_MAP_KEY[pilier];
    const targetPercentage = targetKey != null ? allocationCible[targetKey] : 0;

    return {
      pilier,
      totalValue: agg.currentValue,
      percentage: Math.round(percentage * 10) / 10,
      targetPercentage,
      allocationGap: Math.round((percentage - targetPercentage) * 10) / 10,
      assets: agg.assets.map(mapAsset),
    };
  });

  // Résumé des actifs Compte courant (pilier LIQUIDITE) — pour affichage dans la liste
  const liquiditeSummary: PilierSummary | null =
    liquiditeAssets.length > 0
      ? {
          pilier: "LIQUIDITE",
          totalValue: liquidites,
          percentage: 0,     // non utilisé dans les graphiques
          targetPercentage: 0,
          allocationGap: 0,
          assets: liquiditeAssets.map(mapAsset),
        }
      : null;

  const monthlyChange = totalValue - totalPrevValue;

  return {
    totalValue,
    monthlyChange,
    monthlyChangePercent:
      totalPrevValue > 0
        ? Math.round((monthlyChange / totalPrevValue) * 1000) / 10
        : 0,
    piliers,
    lastUpdated: lastUpdated?.toISOString() ?? null,
    liquidites,
    liquiditeSummary,
  };
}

export type HistoryPeriod = "7d" | "1m" | "3m" | "6m" | "1y" | "all";

export interface HistoryPoint {
  date: string;
  totalValue: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/** Logique carry-forward partagée entre getPortfolioHistory et getPortfolioHistoryByRange */
async function buildHistoryFromRange(
  userId: string,
  startDate: Date | null,
  endDate: Date
): Promise<HistoryPoint[]> {
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshots = await prisma.snapshot.findMany({
    where: {
      asset: { userId },
      date: { gte: new Date(0), lte: endOfDay },
    },
    orderBy: { date: "asc" },
    select: { assetId: true, value: true, date: true },
  });

  if (snapshots.length === 0) return [];

  // Passe unique : carry-forward avant startDate + points épars dans la période
  const lastValueByAsset: Record<string, number> = {};
  const sparsePoints: Record<string, number> = {};
  let runningTotal = 0;
  let carryTotal = 0;

  for (const snap of snapshots) {
    const prev = lastValueByAsset[snap.assetId] ?? 0;
    runningTotal = runningTotal - prev + snap.value;
    lastValueByAsset[snap.assetId] = snap.value;

    if (startDate && snap.date < startDate) {
      // Avant la période — mise à jour du total carry-forward
      carryTotal = runningTotal;
    } else {
      // Dans la période — point épars
      sparsePoints[toLocalDateKey(snap.date)] = runningTotal;
    }
  }

  // Pour les plages de dates : remplissage journalier entre startDate et endDate.
  // Garantit que data[0] correspond toujours à startDate (corrige le badge)
  // et que chaque jour a un point (corrige le dot hover dans Recharts).
  if (startDate) {
    const result: HistoryPoint[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const endLocal = new Date(endDate);
    endLocal.setHours(0, 0, 0, 0);
    let lastKnown = carryTotal;

    while (cursor <= endLocal) {
      const key = toLocalDateKey(cursor);
      if (sparsePoints[key] !== undefined) lastKnown = sparsePoints[key];
      result.push({ date: key, totalValue: lastKnown });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  // Période "all" (startDate = null) : retourner les points épars
  return Object.entries(sparsePoints)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalValue]) => ({ date, totalValue }));
}

export async function getPortfolioHistory(
  userId: string,
  period: HistoryPeriod
): Promise<HistoryPoint[]> {
  const now = new Date();

  function startDateFor(p: HistoryPeriod): Date | null {
    const d = new Date(now);
    switch (p) {
      case "7d":  d.setDate(d.getDate() - 7); return d;
      case "1m":  d.setMonth(d.getMonth() - 1); return d;
      case "3m":  d.setMonth(d.getMonth() - 3); return d;
      case "6m":  d.setMonth(d.getMonth() - 6); return d;
      case "1y":  d.setFullYear(d.getFullYear() - 1); return d;
      case "all": return null;
    }
  }

  const startDate = startDateFor(period);
  return buildHistoryFromRange(userId, startDate, now);
}

/**
 * Performance brute du portefeuille sur 7 jours, en % (valeur de fin vs début).
 * Renvoie null si l'historique est insuffisant ou si la valeur de départ est nulle.
 * Utilisé par Pio pour chambrer l'utilisateur sur sa semaine.
 */
export async function getWeeklyPerformancePct(userId: string): Promise<number | null> {
  const history = await getPortfolioHistory(userId, "7d");
  if (history.length < 2) return null;
  const start = history[0].totalValue;
  const end = history[history.length - 1].totalValue;
  if (start <= 0) return null;
  return Math.round(((end - start) / start) * 1000) / 10;
}

export async function getPortfolioHistoryByRange(
  userId: string,
  range: DateRange
): Promise<HistoryPoint[]> {
  return buildHistoryFromRange(userId, range.startDate, range.endDate);
}

/**
 * Historique de valeur d'UN actif sur une plage, avec carry-forward.
 * `totalValue` représente ici la valeur de l'actif seul (réutilise HistoryPoint).
 */
export async function getAssetHistoryByRange(
  userId: string,
  assetId: string,
  range: DateRange
): Promise<HistoryPoint[]> {
  const { startDate, endDate } = range;
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const snapshots = await prisma.snapshot.findMany({
    where: {
      assetId,
      asset: { userId },
      date: { gte: new Date(0), lte: endOfDay },
    },
    orderBy: { date: "asc" },
    select: { value: true, date: true },
  });

  if (snapshots.length === 0) return [];

  // Valeur reportée avant la période + points épars dans la période
  const sparsePoints: Record<string, number> = {};
  let carryValue = 0;
  for (const snap of snapshots) {
    if (snap.date < startDate) {
      carryValue = snap.value;
    } else {
      sparsePoints[toLocalDateKey(snap.date)] = snap.value;
    }
  }

  // Remplissage journalier entre startDate et endDate
  const result: HistoryPoint[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const endLocal = new Date(endDate);
  endLocal.setHours(0, 0, 0, 0);
  let lastKnown = carryValue;
  while (cursor <= endLocal) {
    const key = toLocalDateKey(cursor);
    if (sparsePoints[key] !== undefined) lastKnown = sparsePoints[key];
    result.push({ date: key, totalValue: lastKnown });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export type DashboardPeriodKey = "day" | "week" | "month" | "year";

export interface PeriodDelta {
  /** Variation totale (apports + performance) en EUR */
  eur: number;
  /** Variation totale en % */
  pct: number;
  /** Apports nets de l'utilisateur sur la période (somme des montants investis) */
  apports: number;
  /** Performance pure : variation de valeur hors apports (= eur − apports) */
  performance: number;
  /** Performance pure rapportée à la valeur de référence en % */
  performancePct: number;
}

export type DashboardDeltas = Record<DashboardPeriodKey, PeriodDelta>;

const EMPTY_DELTA: PeriodDelta = {
  eur: 0,
  pct: 0,
  apports: 0,
  performance: 0,
  performancePct: 0,
};

const EMPTY_DELTAS: DashboardDeltas = {
  day: EMPTY_DELTA,
  week: EMPTY_DELTA,
  month: EMPTY_DELTA,
  year: EMPTY_DELTA,
};

/** Calcule la variation patrimoniale sur les 4 périodes pour le toggle du dashboard. */
export async function getDashboardDeltas(userId: string): Promise<DashboardDeltas> {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  const [history, transactions] = await Promise.all([
    buildHistoryFromRange(userId, oneYearAgo, now),
    prisma.transaction.findMany({
      where: {
        asset: { userId },
        date: { gte: oneYearAgo, lte: now },
      },
      select: { date: true, montantInvesti: true },
    }),
  ]);

  if (history.length === 0) return EMPTY_DELTAS;

  const total = history[history.length - 1].totalValue;

  function valueAt(target: Date): number {
    target.setHours(0, 0, 0, 0);
    const targetTs = target.getTime();
    let lastBefore = history[0].totalValue;
    for (const p of history) {
      if (new Date(p.date).getTime() <= targetTs) lastBefore = p.totalValue;
      else break;
    }
    return lastBefore;
  }

  function apportsSince(target: Date): number {
    const targetTs = target.getTime();
    return transactions.reduce(
      (sum, t) => (t.date.getTime() >= targetTs ? sum + t.montantInvesti : sum),
      0
    );
  }

  function delta(daysBack: number, useCalendar: "month" | "year" | null = null): PeriodDelta {
    const target = new Date(now);
    if (useCalendar === "month") target.setMonth(target.getMonth() - 1);
    else if (useCalendar === "year") target.setFullYear(target.getFullYear() - 1);
    else target.setDate(target.getDate() - daysBack);
    target.setHours(0, 0, 0, 0);
    const ref = valueAt(new Date(target));
    const eur = total - ref;
    const apports = apportsSince(target);
    const performance = eur - apports;
    // Base de performance : capital exposé sur la période = valeur au début + apports.
    // Quand ref = 0 (rien avant la période), on tombe naturellement sur les apports,
    // ce qui évite les divisions par zéro sur "1 an" pour un compte démarré récemment.
    const basis = ref + apports;
    const pct = ref > 0 ? (eur / ref) * 100 : 0;
    const performancePct =
      basis > 0
        ? (performance / basis) * 100
        : apports > 0
        ? (performance / apports) * 100
        : 0;
    return { eur, pct, apports, performance, performancePct };
  }

  return {
    day: delta(1),
    week: delta(7),
    month: delta(0, "month"),
    year: delta(0, "year"),
  };
}

function buildEmpty(): PortfolioSummary {
  return {
    totalValue: 0,
    monthlyChange: 0,
    monthlyChangePercent: 0,
    lastUpdated: null,
    liquidites: 0,
    liquiditeSummary: null,
    piliers: PILIERS_REELS.map((pilier) => ({
      pilier,
      totalValue: 0,
      percentage: 0,
      targetPercentage: 25,
      allocationGap: -25,
      assets: [],
    })),
  };
}
