import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { callPioChat } from "@/lib/claude";
import {
  getPortfolioSummary,
  getWeeklyPerformancePct,
} from "@/lib/services/portfolio.service";
import { fetchMarketSnapshot } from "@/lib/services/market-data.service";
import { PIO_PERSONA, buildPioContext } from "@/lib/pio/persona";
import { formatMarketContext } from "@/lib/pio/greetings";

// Le chat peut attendre un appel Claude — laisser de la marge
export const maxDuration = 60;

const PILIER_LABELS: Record<string, string> = {
  PEA: "PEA", CRYPTO: "Crypto", IMMO: "Immobilier", AUTRE: "Autre",
};

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

// POST /api/pio/chat — répond à un message en restant dans le personnage de Pio
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { userId } = session;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Pio fait une pause (clé API non configurée)." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  // La conversation envoyée à Claude doit commencer par un message "user"
  const firstUser = parsed.data.messages.findIndex((m) => m.role === "user");
  if (firstUser === -1) {
    return NextResponse.json({ error: "Dis d'abord quelque chose à Pio." }, { status: 400 });
  }
  const messages = parsed.data.messages.slice(firstUser);

  try {
    const [portfolio, user, market, weeklyPerfPct] = await Promise.all([
      getPortfolioSummary(userId).catch(() => null),
      prisma.user.findUnique({ where: { id: userId }, select: { objectif: true } }),
      fetchMarketSnapshot().catch(() => null),
      getWeeklyPerformancePct(userId).catch(() => null),
    ]);

    const objectifEur = user?.objectif ?? 1_000_000;
    const patrimoineEur = portfolio?.totalValue ?? null;
    const progressPct =
      patrimoineEur != null && objectifEur > 0 ? (patrimoineEur / objectifEur) * 100 : null;

    const allocation = (portfolio?.piliers ?? [])
      .filter((p) => p.totalValue > 0)
      .map((p) => ({ label: PILIER_LABELS[p.pilier] ?? p.pilier, pct: p.percentage }));

    const nowLabel = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(new Date());

    const context = buildPioContext({
      nowLabel,
      patrimoineEur,
      objectifEur,
      progressPct,
      weeklyPerfPct,
      allocation,
      marketLine: formatMarketContext(market),
    });

    const { text } = await callPioChat(PIO_PERSONA, context, messages);

    return NextResponse.json({ data: { reply: text } });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const name = err instanceof Error ? err.name : "Error";
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const isTimeout =
      message.includes("abort") || message.toLowerCase().includes("timeout");
    console.error(`[Pio] error status=${status ?? "n/a"} name=${name} msg="${message}"`);

    // ⚠️ Diagnostic temporaire : on remonte l'erreur réelle pour debug (à re-masquer ensuite).
    return NextResponse.json(
      {
        error: isTimeout
          ? "Pio a mis trop de temps à répondre, réessaie."
          : `Pio a un souci${status ? ` (HTTP ${status})` : ""} : ${message}`,
      },
      { status: 502 }
    );
  }
}
