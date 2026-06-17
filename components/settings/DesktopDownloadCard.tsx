"use client";

import { Download, Monitor } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Lien de téléchargement de l'app bureau Windows.
 * Pointe toujours sur le dernier installeur publié dans les GitHub Releases
 * (asset `Premier-Million-Setup.exe`). Repo public → téléchargement libre.
 */
const DOWNLOAD_URL =
  "https://github.com/pierrecatteau3-source/Premier-million/releases/latest/download/Premier-Million-Setup.exe";

export function DesktopDownloadCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Monitor className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold">App bureau Windows</h2>
          <p className="text-xs text-muted-foreground">
            Installe Premier Million comme une vraie application Windows. Elle se
            connecte à la même version en ligne — tes données sont identiques.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default", size: "lg" }))}
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger pour Windows
        </a>
        <span className="text-xs text-muted-foreground">.exe · ~78&nbsp;Mo</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Au 1<sup>er</sup> lancement, Windows peut afficher « Windows a protégé
        votre PC » (application non signée) : clique{" "}
        <span className="font-medium text-foreground">
          Informations complémentaires
        </span>{" "}
        puis{" "}
        <span className="font-medium text-foreground">Exécuter quand même</span>.
      </p>
    </div>
  );
}
