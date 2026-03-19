import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { callClaudeAnalysis } from "@/lib/claude";
import {
  buildEnrichedAnalysisPrompt,
  buildMarketVisionPrompt,
} from "@/lib/prompts/market-analysis";
import { getPortfolioSummary } from "@/lib/services/portfolio.service";
import {
  checkGlobalDailyLimit,
  incrementGlobalCounter,
  getGlobalCount,
} from "@/lib/analysisRateLimit";
import { HORIZON } from "@/types";
import type { Horizon } from "@/types";

// ── Constantes ────────────────────────────────────────────────────────────────

/** Cache de 30 jours — durée de fraîcheur d'une analyse */
const CACHE_DAYS = 30;

/** Types d'analyse supportés */
const ANALYSIS_TYPES = ["PORTFOLIO", "MARKET"] as const;
type AnalysisType = (typeof ANALYSIS_TYPES)[number];

/** Si false → kill switch d'urgence, retourne le cache sans appel API */
function isClaudeEnabled(): boolean {
  return process.env.ANTHROPIC_ANALYSES_ENABLED !== "false";
}

// ── Validation ────────────────────────────────────────────────────────────────

const triggerSchema = z.object({
  horizon: z.enum(["YEAR_1", "YEAR_3", "YEAR_5", "YEAR_10"]),
  /** "PORTFOLIO" = analyse portefeuille personnalisée | "MARKET" = vision marché tech */
  type: z.enum(["PORTFOLIO", "MARKET"]).optional().default("PORTFOLIO"),
  /** Si true, force la régénération même si l'analyse a moins de 30 jours */
  force: z.boolean().optional().default(false),
});

// ── Sérialisation ─────────────────────────────────────────────────────────────

function serializeAnalysis(a: {
  id: string;
  userId: string;
  horizon: string;
  type: string;
  content: string;
  createdAt: Date;
}) {
  return {
    id: a.id,
    userId: a.userId,
    horizon: a.horizon,
    type: a.type,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
  };
}

// ── POST /api/analysis ────────────────────────────────────────────────────────
// Déclenche une analyse (vérifie le cache 30j d'abord)

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  // 1. Vérification de la clé API
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée — ajoutez-la dans .env" },
      { status: 503 }
    );
  }

  // 2. Parsing du body
  const body = await req.json().catch(() => null);
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const horizon = parsed.data.horizon as Horizon;
  const analysisType = parsed.data.type as AnalysisType;
  const forceRegenerate = parsed.data.force === true;

  // ── Vérification du cache 30 jours ─────────────────────────────────────────
  const cacheLimit = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);

  const cached = await prisma.analysis.findFirst({
    where: {
      userId,
      horizon,
      type: analysisType,
      createdAt: { gte: cacheLimit },
    },
    orderBy: { createdAt: "desc" },
  });

  // Si l'analyse est fraîche ET qu'on ne force pas la régénération → retourner le cache
  if (cached && !forceRegenerate) {
    console.log(
      `[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} tokens_used=0 cached=true`
    );
    return NextResponse.json({
      data: {
        analysis: serializeAnalysis(cached),
        cached: true,
      },
    });
  }

  // ── Kill switch d'urgence ──────────────────────────────────────────────────
  if (!isClaudeEnabled()) {
    // Retourner l'analyse la plus récente en base (même expirée) si disponible
    const fallback = await prisma.analysis.findFirst({
      where: { userId, horizon, type: analysisType },
      orderBy: { createdAt: "desc" },
    });

    if (fallback) {
      console.log(
        `[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} tokens_used=0 cached=true kill_switch=true`
      );
      return NextResponse.json({
        data: {
          analysis: serializeAnalysis(fallback),
          cached: true,
        },
      });
    }

    return NextResponse.json(
      { error: "Les analyses Claude sont temporairement désactivées. Réessayez plus tard." },
      { status: 503 }
    );
  }

  // ── Rate limit utilisateur — max 1 appel API toutes les 24h ───────────────
  // Note : le cache 30j couvre déjà la majorité des cas, mais cette vérification
  // protège en cas de force=true répété sur des analyses < 24h.
  const userLast24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCall = await prisma.analysis.findFirst({
    where: {
      userId,
      horizon,
      type: analysisType,
      createdAt: { gte: userLast24h },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentCall) {
    // L'utilisateur a déjà déclenché un appel API pour cet horizon+type dans les 24h
    console.log(
      `[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} tokens_used=0 cached=true rate_limit_user=true`
    );
    return NextResponse.json({
      data: {
        analysis: serializeAnalysis(recentCall),
        cached: true,
      },
    });
  }

  // ── Rate limit global — max ANTHROPIC_MAX_CALLS_PER_DAY appels/jour ────────
  const { allowed, remaining } = checkGlobalDailyLimit();
  if (!allowed) {
    console.log(
      `[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} tokens_used=0 cached=false rate_limit_global=true`
    );
    return NextResponse.json(
      {
        error: `Limite quotidienne d'appels API atteinte (${process.env.ANTHROPIC_MAX_CALLS_PER_DAY ?? "10"}/jour). Réessayez demain.`,
      },
      { status: 429 }
    );
  }

  // ── Appel Claude API ──────────────────────────────────────────────────────
  try {
    // Récupération parallèle du portefeuille et du profil utilisateur complet
    const [portfolio, user] = await Promise.all([
      getPortfolioSummary(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          objectif: true,
          ageActuel: true,
          ageCible: true,
          epargneMensuelle: true,
          risqueMaxPerte: true,
          niveauConnaissance: true,
          allocationCible: true,
        },
      }),
    ]);

    const allocationCible = (user?.allocationCible ?? {
      pea: 25, crypto: 25, immo: 25, autre: 25,
    }) as { pea: number; crypto: number; immo: number; autre: number };

    // Mappage piliers → format enrichi
    const PILIER_LABELS: Record<string, string> = {
      PEA: "PEA (actions)",
      CRYPTO: "Crypto",
      IMMO: "Immobilier",
      AUTRE: "Autre (épargne)",
    };

    const piliers = portfolio.piliers.map((p) => ({
      name: PILIER_LABELS[p.pilier] ?? p.pilier,
      totalValue: p.totalValue,
      percentage: p.percentage,
      targetPercentage: p.targetPercentage,
    }));

    // Mappage actifs → format enrichi (tous piliers)
    const assets = portfolio.piliers.flatMap((p) =>
      p.assets.map((a) => ({
        name: a.name,
        pilier: PILIER_LABELS[p.pilier] ?? p.pilier,
        latestValue: a.latestValue,
        coutRevient: a.coutRevient ?? null,
        pmp: a.pmp ?? null,
        pvLatente: a.pvLatente ?? null,
      }))
    );

    const userProfile = {
      objectif: user?.objectif ?? 1_000_000,
      ageActuel: user?.ageActuel ?? null,
      ageCible: user?.ageCible ?? null,
      epargneMensuelle: user?.epargneMensuelle ?? null,
      risqueMaxPerte: user?.risqueMaxPerte ?? null,
      niveauConnaissance: user?.niveauConnaissance ?? null,
      allocationCible,
    };

    const portfolioCtx = {
      totalValue: portfolio.totalValue,
      piliers,
      assets,
    };

    // Construction du prompt selon le type d'analyse
    const { systemPrompt, userMessage } =
      analysisType === "MARKET"
        ? buildMarketVisionPrompt(horizon, userProfile, portfolioCtx)
        : buildEnrichedAnalysisPrompt(horizon, userProfile, portfolioCtx);

    // Incrémenter le compteur AVANT l'appel (protège contre les appels parallèles)
    incrementGlobalCounter();

    // Appel Claude avec timeout 30s + token budget
    const { text: content, outputTokens } = await callClaudeAnalysis(
      systemPrompt,
      userMessage
    );

    // Sauvegarde en base avec le type
    const analysis = await prisma.analysis.create({
      data: { userId, horizon, type: analysisType, content },
    });

    // Log structuré
    console.log(
      `[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} tokens_used=${outputTokens} cached=false global_count=${getGlobalCount()} remaining_today=${remaining - 1}`
    );

    return NextResponse.json({
      data: {
        analysis: serializeAnalysis(analysis),
        cached: false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";

    // Ne pas exposer les détails de l'erreur (potentiellement sensibles)
    const isTimeout = message.includes("abort") || message.toLowerCase().includes("timeout");
    const clientMessage = isTimeout
      ? "L'analyse a pris trop de temps (timeout 30s). Réessayez dans quelques instants."
      : "Erreur lors de la génération de l'analyse. Réessayez dans quelques instants.";

    console.error(`[Analysis] userId=${userId} type=${analysisType} horizon=${horizon} error="${message}"`);

    return NextResponse.json(
      { error: clientMessage },
      { status: 502 }
    );
  }
}

void HORIZON;
