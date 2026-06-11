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

export function PioChatWidget() {
  const { open, openChat, closeChat } = usePioChat();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingMode, setPendingMode] = useState<ChatMode>("chat");
  const [advisorMode, setAdvisorMode] = useState(false);
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

  // Focus de l'input à l'ouverture — desktop uniquement : sur mobile, l'autofocus
  // ouvre le clavier d'emblée et fait sauter le viewport iOS dès l'ouverture.
  useEffect(() => {
    if (open && window.matchMedia("(min-width: 768px)").matches) {
      inputRef.current?.focus();
    }
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

  // Verrouille le scroll de la page quand le chat est ouvert (plein écran sur mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Mobile : fige le chat sur le viewport VISUEL. À l'ouverture du clavier, iOS ne
  // réduit pas le viewport layout (100dvh) : il le décale vers le haut → le header
  // sortait de l'écran. On cale la hauteur sur visualViewport et on recale la page,
  // pour que seul le fil de messages défile.
  const [vvBox, setVvBox] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!vv || !isMobile) return;
    const sync = () => {
      // N'intervenir QUE clavier ouvert (viewport visuel nettement réduit).
      // Sinon (scroll du fil, barre Safari qui se replie…), tout recalage
      // scrollTo + translateY fait « trembler » le widget.
      const keyboardOpen = window.innerHeight - vv.height > 80;
      if (keyboardOpen) {
        setVvBox({ height: Math.round(vv.height), top: Math.round(vv.offsetTop) });
        window.scrollTo(0, 0);
      } else {
        setVvBox(null);
      }
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      setVvBox(null);
    };
  }, [open]);

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

  // Envoi — mode conseil (Opus) ou papote (Haiku) selon le toggle "Conseil"
  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void postMessage(text, advisorMode ? "advisor" : "chat");
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
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-gold/40 shadow-lg md:hidden"
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
          className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden md:inset-auto md:bottom-4 md:right-4 md:h-[min(600px,calc(100dvh-2rem))] md:w-[min(440px,calc(100vw-2rem))] md:rounded-2xl md:border md:border-border md:shadow-2xl"
          style={{
            backgroundColor: "hsl(var(--popover))",
            // Mobile, clavier ouvert : hauteur = viewport visuel, recalé sous la barre iOS
            ...(vvBox != null && {
              height: `${vvBox.height}px`,
              transform: `translateY(${vvBox.top}px)`,
            }),
          }}
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-3">
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
              onClick={() => setAdvisorMode((v) => !v)}
              role="switch"
              aria-checked={advisorMode}
              aria-label="Mode conseil"
              title={
                advisorMode
                  ? "Mode conseil activé (analyse Opus)"
                  : "Activer le mode conseil"
              }
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                advisorMode
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-border text-ink-muted hover:text-ink"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Conseil
            </button>
            <button
              onClick={closeChat}
              aria-label="Fermer"
              className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fil de discussion */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
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
          <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3">
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
                className="max-h-[140px] flex-1 resize-none overflow-y-auto bg-transparent text-base leading-snug text-ink outline-none placeholder:text-ink-dim sm:text-sm"
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
              {advisorMode
                ? "Mode conseil — analyse d'une IA, pas un conseil en investissement réglementé."
                : "Pio papote — ce n'est pas un conseil en investissement."}
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
