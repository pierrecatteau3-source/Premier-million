import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import NextTopLoader from "nextjs-toploader";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premier Million",
  description: "Suivi de patrimoine vers le premier million d'euros",
};

// viewportFit "cover" : l'app s'étend sous l'encoche/barre gestuelle iOS ;
// les éléments fixed gèrent leur retrait via env(safe-area-inset-*).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14110d", // --pm-bg (expresso quasi-noir)
  // Android : le viewport layout se réduit quand le clavier s'ouvre (100dvh suit).
  // iOS l'ignore — géré via visualViewport dans PioChatWidget.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${bricolage.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <NextTopLoader color="#e0b450" showSpinner={false} height={2} />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
