"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Send, X } from "lucide-react";
import { usePioChat } from "./PioChatProvider";
import { pickGreeting } from "@/lib/pio/greetings";

type Msg = { role: "user" | "assistant"; content: string };

export function PioChatWidget() {
  const { open, openChat, closeChat } = usePioChat();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
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

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setError("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/pio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
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
          className="fixed bottom-4 right-4 z-50 flex h-[min(560px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
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
              <PioBubble>{greeting}</PioBubble>
            )}

            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <PioBubble key={i}>{m.content}</PioBubble>
              ) : (
                <UserBubble key={i}>{m.content}</UserBubble>
              )
            )}

            {pending && (
              <PioBubble>
                <span className="inline-flex items-center gap-2 text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pio écrit…
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
            <div
              className="flex items-end gap-2 rounded-xl border border-border px-3 py-2"
              style={{ backgroundColor: "hsl(var(--card))" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Écris à Pio…"
                className="max-h-24 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
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
