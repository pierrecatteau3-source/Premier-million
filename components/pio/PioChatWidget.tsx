"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { usePioChat } from "./PioChatProvider";
import { pickGreeting } from "@/lib/pio/greetings";

type Msg = { role: "user" | "assistant"; content: string };
type ChatMode = "chat" | "advisor";

// Message envoyé quand on clique sur "Analyse ma stratégie"
const ADVISOR_PROMPT =
  "Analyse ma stratégie : fais-moi une revue complète de mon portefeuille avec des recommandations concrètes.";

export function PioChatWidget() {
  const { open, openChat, closeChat } = usePioChat();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingMode, setPendingMode] = useState<ChatMode>("chat");
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetedRef = useRef(false);

  // Salutation : récupérée une seule fois à la première ouverture
  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;
    const hour = new Date().getHours();
    fetch(`/api/pio/greeting?h=${hour}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setGreeting(j?.data?.greeting ?? pickGreeting()))
      .catch(() => setGreeting(pickGreeting()));
  }, [open]);

  // Auto-scroll en bas
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, greeting, pending, open]);

  // Focus de l'input à l'ouverture
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  async function postMessage(text: string, mode: ChatMode) {
    if (!text || pending) return;
    setError("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setPending(true);
    setPendingMode(mode);
    try {
      const res = await fetch("/api/pio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20), mode }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data?.reply) {
        setError(json?.error ?? "Pio n'a pas répondu, réessaie.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: json.data.reply }]);
      }
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  // Envoi normal (papote) — lit le champ de saisie
  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void postMessage(text, "chat");
  }

  // Bouton "Analyse ma stratégie" — déclenche le mode conseil (Opus)
  function analyzeStrategy() {
    if (pending) return;
    void postMessage(ADVISOR_PROMPT, "advisor");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      {/* Launcher mobile uniquement — sur desktop, le chat s'ouvre via l'avatar de Pio dans la sidebar */}
      {!open && (
        <button
          onClick={openChat}
          aria-label="Ouvrir le chat avec Pio"
          className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-gold/40 shadow-lg md:hidden"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          <Image
            src="/character/pio-avatar.png"
            alt="Pio"
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat avec Pio"
          className="fixed bottom-4 right-4 z-50 flex h-[min(600px,calc(100vh-2rem))] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Image
              src="/character/pio-avatar.png"
              alt="Pio"
              width={36}
              height={36}
              className="shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold leading-none text-ink">Pio</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold">
                Niv. 4 · ton associé
              </div>
            </div>
            <button
              onClick={closeChat}
              aria-label="Fermer"
              className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fil de discussion */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {greeting === null ? (
              <PioBubble>
                <span className="inline-flex items-center gap-2 text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pio arrive…
                </span>
              </PioBubble>
            ) : (
              <PioBubble>
                <ChatMarkdown>{greeting}</ChatMarkdown>
              </PioBubble>
            )}

            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <PioBubble key={i}>
                  <ChatMarkdown>{m.content}</ChatMarkdown>
                </PioBubble>
              ) : (
                <UserBubble key={i}>{m.content}</UserBubble>
              )
            )}

            {pending && (
              <PioBubble>
                <span className="inline-flex items-center gap-2 text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                  {pendingMode === "advisor" ? "Pio analyse ta stratégie…" : "Pio écrit…"}
                </span>
              </PioBubble>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Saisie */}
          <div className="border-t border-border p-3">
            {/* Mode conseil — analyse stratégique ponctuelle (Opus) */}
            <button
              onClick={analyzeStrategy}
              disabled={pending}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 px-3 py-2 text-xs font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyse ma stratégie
            </button>
            <div
              className="flex items-end gap-2 rounded-xl border border-border px-3 py-2"
              style={{ backgroundColor: "hsl(var(--card))" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Écris à Pio…"
                className="max-h-[140px] flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-ink-dim"
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || pending}
                aria-label="Envoyer"
                className="shrink-0 rounded-lg p-1.5 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "var(--pm-gold)", color: "var(--pm-bg-deep)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 font-mono text-[9px] text-ink-dim">
              Pio papote — ce n&apos;est pas un conseil en investissement.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Ajuste la hauteur du textarea à son contenu (pour voir tout le message multi-lignes). */
function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

/** Rendu markdown compact pour les messages de Pio (gras, listes, liens…). */
function ChatMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-ink">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-gold underline underline-offset-2"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-surface px-1 py-0.5 text-[12px]">{children}</code>
        ),
        h1: ({ children }) => <p className="mb-1 font-semibold text-ink">{children}</p>,
        h2: ({ children }) => <p className="mb-1 font-semibold text-ink">{children}</p>,
        h3: ({ children }) => <p className="mb-1 font-semibold text-ink">{children}</p>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function PioBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border px-3 py-2 text-sm leading-snug text-ink-soft"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      {children}
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm leading-snug"
      style={{
        background: "linear-gradient(135deg, var(--pm-gold), var(--pm-gold-deep))",
        color: "var(--pm-bg-deep)",
      }}
    >
      {children}
    </div>
  );
}
