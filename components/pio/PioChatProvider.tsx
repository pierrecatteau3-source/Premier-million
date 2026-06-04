"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface PioChatContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const PioChatContext = createContext<PioChatContextValue | null>(null);

export function PioChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => setOpen((o) => !o), []);

  return (
    <PioChatContext.Provider value={{ open, openChat, closeChat, toggleChat }}>
      {children}
    </PioChatContext.Provider>
  );
}

export function usePioChat() {
  const ctx = useContext(PioChatContext);
  if (!ctx) {
    throw new Error("usePioChat doit être utilisé dans un <PioChatProvider>");
  }
  return ctx;
}
