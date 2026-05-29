"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconDashboard,
  IconWallet,
  IconShield,
  IconAnalyse,
  IconGlobe,
  IconTarget,
  IconSparkles,
  IconTrophy,
  IconHistory,
  BrandMark,
  type IconProps,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.ReactNode;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Capital",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
      { href: "/portefeuille", label: "Portefeuille", Icon: IconWallet },
      { href: "/risque", label: "Risque & atouts", Icon: IconShield },
    ],
  },
  {
    group: "Analyse",
    items: [
      { href: "/analyse", label: "Analyse", Icon: IconAnalyse },
      { href: "/vision-marche", label: "Vision marché", Icon: IconGlobe },
      { href: "/profil", label: "Profil & stratégie", Icon: IconTarget },
    ],
  },
  {
    group: "Perso",
    items: [
      { href: "/personnage", label: "Mon associé", Icon: IconSparkles },
      { href: "/succes", label: "Succès", Icon: IconTrophy },
      { href: "/historique", label: "Historique", Icon: IconHistory },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col gap-8 border-r border-border bg-surface-deep px-6 pb-6 pt-7">
      {/* Brand */}
      <div className="flex items-center gap-3.5">
        <div
          className="grid h-11 w-11 -rotate-[4deg] place-items-center rounded-md"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, #f5d57a, #e0b450 50%, #a07a30 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(224,180,80,0.18)",
          }}
        >
          <BrandMark size={26} />
        </div>
        <div className="font-display text-[17px] font-bold leading-none tracking-tight text-ink">
          Premier
          <span className="mt-[3px] block text-[15px] italic text-gold">Million</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="mt-3.5 px-0 pb-1 pt-2 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-gold-deep first:mt-0">
              {group}
            </div>
            {items.map(({ href, label, Icon }) => {
              const active =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-sm px-2.5 py-2.5 text-[13.5px] font-medium tracking-[-0.005em] transition-all duration-150",
                    active
                      ? "font-semibold text-gold-bright"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  )}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(224,180,80,0.16), rgba(224,180,80,0.04))",
                        }
                      : undefined
                  }
                >
                  {active && (
                    <span className="absolute -left-6 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-[3px] bg-gold" />
                  )}
                  <span
                    className={cn(
                      "grid h-[18px] w-[18px] shrink-0 place-items-center transition-colors",
                      active
                        ? "text-gold-bright"
                        : "text-ink-dim group-hover:text-gold"
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Pio peek */}
      <div
        className="mt-auto flex items-center gap-3 rounded-lg border border-border p-4"
        style={{
          background: "linear-gradient(180deg, var(--pm-surface), transparent)",
        }}
      >
        <Image
          src="/character/pio-avatar.png"
          alt="Pio"
          width={40}
          height={40}
          className="shrink-0 rounded-full object-cover"
        />
        <div className="font-display text-[12px] leading-tight tracking-[-0.01em] text-ink-soft">
          <span className="mb-1 block font-mono text-[9px] uppercase not-italic tracking-[0.16em] text-gold">
            Pio · niv. 4
          </span>
          Tranquille, on a le temps.
        </div>
      </div>
    </aside>
  );
}
