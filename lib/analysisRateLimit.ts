/**
 * Rate limiter global pour les appels Claude — serveur uniquement.
 *
 * Maintient un compteur en mémoire (Map) réinitialisé à minuit UTC.
 * Compatible avec les warm starts Next.js (singleton via globalThis).
 *
 * Deux niveaux de contrôle :
 *  1. Par utilisateur  — max 1 appel API toutes les 24h (garanti par le cache DB 30j en amont)
 *  2. Global          — max ANTHROPIC_MAX_CALLS_PER_DAY appels/jour toutes analyses confondues
 */

interface RateLimitStore {
  /** Compteur global d'appels API sur la journée courante */
  dailyCount: number;
  /** Date UTC (YYYY-MM-DD) correspondant au compteur actuel */
  currentDay: string;
}

const globalForRateLimit = globalThis as unknown as {
  _analysisRateLimit: RateLimitStore | undefined;
};

function getStore(): RateLimitStore {
  if (!globalForRateLimit._analysisRateLimit) {
    globalForRateLimit._analysisRateLimit = {
      dailyCount: 0,
      currentDay: todayUTC(),
    };
  }
  return globalForRateLimit._analysisRateLimit;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Réinitialise le compteur si le jour a changé (UTC). */
function maybeReset(store: RateLimitStore): void {
  const today = todayUTC();
  if (store.currentDay !== today) {
    store.dailyCount = 0;
    store.currentDay = today;
  }
}

/**
 * Vérifie si la limite globale quotidienne est atteinte.
 * @returns `{ allowed: true }` ou `{ allowed: false, remaining: 0 }`
 */
export function checkGlobalDailyLimit(): { allowed: boolean; remaining: number } {
  const maxCalls = parseInt(process.env.ANTHROPIC_MAX_CALLS_PER_DAY ?? "10", 10);
  const store = getStore();
  maybeReset(store);

  const remaining = Math.max(0, maxCalls - store.dailyCount);
  return { allowed: store.dailyCount < maxCalls, remaining };
}

/**
 * Incrémente le compteur global.
 * À appeler juste avant le vrai appel Claude (après tous les guards).
 */
export function incrementGlobalCounter(): void {
  const store = getStore();
  maybeReset(store);
  store.dailyCount += 1;
}

/**
 * Retourne le compteur actuel (pour les logs).
 */
export function getGlobalCount(): number {
  const store = getStore();
  maybeReset(store);
  return store.dailyCount;
}
