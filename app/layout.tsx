import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premier Million",
  description: "Suivi de patrimoine vers le premier million d'euros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        <NextTopLoader color="#8b5cf6" showSpinner={false} />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
