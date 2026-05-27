"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  BarChart2,
  UserCircle,
  TrendingUp,
  History,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/portefeuille",
    label: "Portefeuille",
    icon: Briefcase,
  },
  {
    href: "/risque",
    label: "Risque & Atouts",
    icon: ShieldCheck,
  },
  {
    href: "/analyse",
    label: "Analyse",
    icon: BarChart2,
  },
  {
    href: "/vision-marche",
    label: "Vision Marché",
    icon: Globe,
  },
  {
    href: "/profil",
    label: "Profil investisseur & Stratégie",
    icon: UserCircle,
  },
  {
    href: "/succes",
    label: "Succès",
    icon: Trophy,
  },
  {
    href: "/historique",
    label: "Historique",
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-1.5 shadow-gold">
          <TrendingUp className="h-[18px] w-[18px] text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none">Premier Million</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Suivi de patrimoine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3 py-4 space-y-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "light" ? (
              <Moon className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <Sun className="h-[18px] w-[18px] shrink-0" />
            )}
            <span>{theme === "light" ? "Mode sombre" : "Mode clair"}</span>
          </button>
        )}
        <div className="rounded-xl bg-muted px-3 py-3">
          <p className="text-xs text-muted-foreground mb-1">Objectif</p>
          <p className="text-sm font-bold tabular-nums">1 000 000 €</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(280 90% 65%), hsl(320 75% 60%))",
                width: "0%",
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">0 % atteint</p>
        </div>
      </div>
    </aside>
  );
}
