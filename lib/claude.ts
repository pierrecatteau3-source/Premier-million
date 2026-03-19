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
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}

// Modèle par défaut — Claude Sonnet (bon équilibre qualité/coût)
export const DEFAULT_MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 1500;

// Modèle optimisé pour les analyses — rapide, économique, suffisant pour analyse structurée
export const ANALYSIS_MODEL = "claude-haiku-4-5-20251001";

// Token budget pour les analyses — ~900 mots, suffisant pour une analyse complète
export const ANALYSIS_MAX_OUTPUT_TOKENS = parseInt(
  process.env.ANTHROPIC_MAX_OUTPUT_TOKENS ?? "1200",
  10
);

// Timeout strict par appel Claude (30 secondes)
const CLAUDE_TIMEOUT_MS = 30_000;

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
 * - Timeout strict : 30 secondes via AbortController
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
