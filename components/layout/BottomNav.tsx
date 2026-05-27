"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BarChart2,
  UserCircle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portefeuille", label: "Portefeuille", icon: Briefcase },
  { href: "/analyse", label: "Analyse", icon: BarChart2 },
  { href: "/succes", label: "Succès", icon: Trophy },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center shadow-[0_-1px_8px_rgba(0,0,0,0.06)] border-t border-border bg-background md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[9px] font-medium transition-colors active:scale-95 transition-transform",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-transform",
                isActive && "scale-110"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
