/**
 * Client Anthropic — SERVEUR UNIQUEMENT.
 * Ne jamais importer ce fichier dans un composant client ou dans le bundle navigateur.
 * La clé ANTHROPIC_API_KEY n'est disponible que côté serveur.
 */
import Anthropic from "@anthropic-ai/sdk";

// Singleton : réutilise le client entre les invocations Next.js (warm start)
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  // .trim() : évite un 401 "invalid x-api-key" si la clé a été collée avec
  // un espace ou un retour à la ligne parasite (cas fréquent sur Railway).
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY?.trim() });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}

// Modèle par défaut — Claude Sonnet (bon équilibre qualité/coût)
export const DEFAULT_MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 1500;

// Modèle optimisé pour les analyses — rapide, économique, suffisant pour analyse structurée
export const ANALYSIS_MODEL = "claude-haiku-4-5";

// Modèle du chat Pio — Haiku 4.5 pour l'instant (changera par la suite : une seule ligne à éditer)
export const CHAT_MODEL = "claude-haiku-4-5";

// Modèle du MODE CONSEIL ("Analyse ma stratégie") — Opus 4.8, raisonnement stratégique
export const ADVISOR_MODEL = "claude-opus-4-8";

// Réponses de Pio = courtes ; budget de sortie volontairement serré
const CHAT_MAX_OUTPUT_TOKENS = 700;

// Le mode conseil produit une revue structurée — budget plus large (~200-400 mots + thinking)
const ADVISOR_MAX_OUTPUT_TOKENS = 2500;

// Timeout chat plus court que les analyses — le chat doit rester réactif
const CHAT_TIMEOUT_MS = 30_000;

// Le mode conseil (Opus + thinking adaptatif) peut être plus lent — laisser de la marge
const ADVISOR_TIMEOUT_MS = 100_000;

// Token budget pour les analyses — ~900 mots, suffisant pour une analyse complète
export const ANALYSIS_MAX_OUTPUT_TOKENS = parseInt(
  process.env.ANTHROPIC_MAX_OUTPUT_TOKENS ?? "10000",
  10
);

// Timeout strict par appel Claude (120 secondes)
const CLAUDE_TIMEOUT_MS = 120_000;

/**
 * Appel standard (non-streaming) retournant le texte complet.
 * Utilisé pour les analyses marché mises en cache.
 */
export async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Réponse Claude inattendue (type non-text)");
  }

  return block.text;
}

/**
 * Appel Claude sécurisé pour les analyses marché.
 *
 * Sécurités intégrées :
 * - Modèle économique : claude-haiku-4-5-20251001
 * - Token budget : ANTHROPIC_MAX_OUTPUT_TOKENS (défaut 1200)
 * - Timeout strict : 120 secondes via AbortController
 * - Prompt système séparé du message utilisateur
 *
 * @returns `{ text, outputTokens }` — texte généré et nombre de tokens de sortie
 */
export async function callClaudeAnalysis(
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; outputTokens: number }> {
  // AbortController pour timeout strict de 30 secondes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, CLAUDE_TIMEOUT_MS);

  try {
    const message = await anthropic.messages.create(
      {
        model: ANALYSIS_MODEL,
        max_tokens: ANALYSIS_MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    const block = message.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Réponse Claude inattendue (type non-text)");
    }

    return {
      text: block.text,
      outputTokens: message.usage.output_tokens,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Appel Claude pour le chat Pio.
 *
 * - Modèle : CHAT_MODEL (Haiku 4.5)
 * - System en 2 blocs : persona (statique, marquée pour le cache) + contexte (volatil)
 * - Token budget serré + timeout court pour rester réactif
 *
 * @param persona  Custom instructions statiques (caractère de Pio)
 * @param context  Contexte dynamique (patrimoine, marché du jour, heure…)
 * @param messages Historique de la conversation (doit commencer par un message "user")
 */
export async function callPioChat(
  persona: string,
  context: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ text: string; outputTokens: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    // system en simple chaîne (persona + contexte), comme callClaudeAnalysis.
    // Pas de cache_control : la persona est sous le seuil de cache de Haiku (4096 tokens),
    // donc le marquer n'apporte rien et ajoutait une variable inutile.
    const message = await anthropic.messages.create(
      {
        model: CHAT_MODEL,
        max_tokens: CHAT_MAX_OUTPUT_TOKENS,
        system: `${persona}\n\n${context}`,
        messages,
      },
      { signal: controller.signal }
    );

    const block = message.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Réponse Claude inattendue (type non-text)");
    }

    return {
      text: block.text,
      outputTokens: message.usage.output_tokens,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Appel Claude pour le MODE CONSEIL de Pio ("Analyse ma stratégie").
 *
 * - Modèle : ADVISOR_MODEL (Opus 4.8)
 * - Thinking adaptatif : meilleur raisonnement stratégique (le modèle décide la profondeur)
 * - Budget + timeout plus larges que le papote
 *
 * @param persona  Custom instructions du mode conseil (PIO_ADVISOR_PERSONA)
 * @param context  Contexte enrichi (portefeuille détaillé, risque, projection…)
 * @param messages Historique de la conversation (doit commencer par un message "user")
 */
export async function callPioAdvisor(
  persona: string,
  context: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ text: string; outputTokens: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ADVISOR_TIMEOUT_MS);

  try {
    const message = await anthropic.messages.create(
      {
        model: ADVISOR_MODEL,
        max_tokens: ADVISOR_MAX_OUTPUT_TOKENS,
        // Thinking adaptatif : Opus 4.8 décide quand et combien raisonner.
        thinking: { type: "adaptive" },
        system: `${persona}\n\n${context}`,
        messages,
      },
      { signal: controller.signal }
    );

    // Avec le thinking adaptatif, content[0] peut être un bloc "thinking" :
    // on récupère explicitement le bloc texte plutôt que de supposer l'index 0.
    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Réponse Claude inattendue (aucun bloc texte)");
    }

    return {
      text: block.text,
      outputTokens: message.usage.output_tokens,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
