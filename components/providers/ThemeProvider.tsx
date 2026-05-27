"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * MVP : dark uniquement. enableSystem=false pour ne pas être impacté par
 * la préférence OS de l'utilisateur. forcedTheme="dark" empêche tout switch
 * accidentel jusqu'à ce qu'on ajoute un toggle (pas prévu en MVP).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
