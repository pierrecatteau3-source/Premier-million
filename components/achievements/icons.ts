import {
  Footprints,
  ShoppingCart,
  PiggyBank,
  Shield,
  UserCheck,
  Target,
  RefreshCcw,
  Layers,
  TrendingUp,
  BarChart2,
  Award,
  Star,
  Flag,
  Trophy,
  Zap,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  ShoppingCart,
  PiggyBank,
  Shield,
  UserCheck,
  Target,
  RefreshCcw,
  Layers,
  TrendingUp,
  BarChart2,
  Award,
  Star,
  Flag,
  Trophy,
  Zap,
  BookOpen,
};

export const TIER_GRADIENT: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-500 to-slate-300",
  gold: "from-yellow-500 to-amber-300",
  diamond: "from-violet-500 to-fuchsia-400",
};

export const TIER_GLOW: Record<string, string> = {
  bronze: "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  silver: "drop-shadow-[0_0_8px_rgba(148,163,184,0.6)]",
  gold: "drop-shadow-[0_0_10px_rgba(234,179,8,0.7)]",
  diamond: "drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]",
};

export const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  diamond: "Diamant",
};
