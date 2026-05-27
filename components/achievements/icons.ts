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
  bronze: "from-amber-800 to-amber-600",
  silver: "from-slate-400 to-slate-200",
  gold: "from-amber-500 to-yellow-300",
  diamond: "from-sky-400 to-cyan-200",
};

export const TIER_GLOW: Record<string, string> = {
  bronze: "drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]",
  silver: "drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]",
  gold: "drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]",
  diamond: "drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]",
};

export const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  diamond: "Diamant",
};
