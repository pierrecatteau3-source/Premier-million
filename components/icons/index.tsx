import type { CSSProperties } from "react";

/**
 * Bibliothèque d'icônes cartoon — DA « bâtisseur de trésor ».
 * Pictos expressifs (pas de lettres comme symbole). Les icônes de trait
 * héritent de `currentColor` ; les pictos multicolores ont leurs couleurs en dur.
 */

export type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

type StrokeIconProps = IconProps & { vb?: number };

function I({
  children,
  size = 24,
  vb = 24,
  className,
  style,
}: StrokeIconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

/* ---------- NAV ICONS ---------- */
export const IconDashboard = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </I>
);
export const IconWallet = (p: IconProps) => (
  <I {...p}>
    <path d="M3 7c0-1.1.9-2 2-2h13a2 2 0 012 2v2" />
    <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2v-7H6a2 2 0 01-2-2 2 2 0 012-2h14" />
    <circle cx="17" cy="14" r="1.2" fill="currentColor" />
  </I>
);
export const IconShield = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </I>
);
export const IconAnalyse = (p: IconProps) => (
  <I {...p}>
    <path d="M4 19V5" />
    <path d="M20 19H4" />
    <path d="M7 15l3-4 3 3 4-6" />
    <circle cx="17" cy="8" r="1" fill="currentColor" />
  </I>
);
export const IconGlobe = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
  </I>
);
export const IconTarget = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </I>
);
export const IconSparkles = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3l1.5 4 4 1.5-4 1.5L12 14l-1.5-4-4-1.5 4-1.5z" />
    <path d="M19 14l.8 2 2 .8-2 .8L19 20l-.8-2-2-.8 2-.8z" />
  </I>
);
export const IconTrophy = (p: IconProps) => (
  <I {...p}>
    <path d="M8 4h8v5a4 4 0 11-8 0V4z" />
    <path d="M5 5H3v2a3 3 0 003 3" />
    <path d="M19 5h2v2a3 3 0 01-3 3" />
    <path d="M10 14h4v3h-4z" />
    <path d="M7 20h10" />
    <path d="M9 17l-.5 3M15 17l.5 3" />
  </I>
);
export const IconHistory = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </I>
);

/* ---------- PILLAR ICONS (32x32, multicolore) ---------- */
export const IconPEA = ({ size = 32, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <ellipse cx="16" cy="18" rx="11" ry="8" fill="#e0b450" />
    <ellipse cx="16" cy="18" rx="11" ry="8" stroke="#7a3e26" strokeWidth="1.4" />
    <circle cx="10" cy="16" r="1" fill="#3a1a0d" />
    <path d="M5 16 L2 14 L2 18 Z" fill="#e0b450" stroke="#7a3e26" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="14" y="10.5" width="4" height="2" rx="0.5" fill="#3a1a0d" />
    <path d="M22 13 L24 11 L24 14" stroke="#7a3e26" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="11" y1="24.5" x2="11" y2="26.5" stroke="#7a3e26" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="21" y1="24.5" x2="21" y2="26.5" stroke="#7a3e26" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const IconCrypto = ({ size = 32, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <circle cx="16" cy="16" r="11" fill="#b8643e" stroke="#7a3e26" strokeWidth="1.4" />
    <circle cx="16" cy="16" r="8" fill="none" stroke="#3a1a0d" strokeWidth="0.8" strokeDasharray="2 1.5" />
    <path d="M13 11 L13 21 M13 11 L17 11 Q19 11 19 13 Q19 15 17 15 L13 15 M13 15 L18 15 Q20 15 20 17.5 Q20 21 17 21 L13 21" stroke="#3a1a0d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="15" y1="9" x2="15" y2="11" stroke="#3a1a0d" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="17" y1="9" x2="17" y2="11" stroke="#3a1a0d" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="15" y1="21" x2="15" y2="23" stroke="#3a1a0d" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="17" y1="21" x2="17" y2="23" stroke="#3a1a0d" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const IconImmo = ({ size = 32, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <path d="M4 14 L16 5 L28 14 L28 26 Q28 27 27 27 L5 27 Q4 27 4 26 Z" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M3 14 L16 4 L29 14" stroke="#5a8b3e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="13" y="19" width="6" height="8" fill="#3a1a0d" />
    <rect x="7" y="16" width="4" height="4" fill="#3a1a0d" />
    <rect x="21" y="16" width="4" height="4" fill="#3a1a0d" />
  </svg>
);
export const IconAutre = ({ size = 32, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <rect x="5" y="14" width="22" height="13" rx="1.5" fill="#5a4a3e" stroke="#3a2e26" strokeWidth="1.4" />
    <path d="M5 14 Q5 8 16 8 Q27 8 27 14" fill="#7a5a4e" stroke="#3a2e26" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="14" y="17" width="4" height="6" rx="1" fill="#e0b450" stroke="#7a3e26" strokeWidth="1.2" />
    <circle cx="16" cy="20" r="0.6" fill="#3a1a0d" />
    <line x1="9" y1="14" x2="9" y2="27" stroke="#3a2e26" strokeWidth="0.8" />
    <line x1="23" y1="14" x2="23" y2="27" stroke="#3a2e26" strokeWidth="0.8" />
    <line x1="5" y1="20" x2="27" y2="20" stroke="#3a2e26" strokeWidth="0.8" />
  </svg>
);

/* ---------- ASSET LOGOS (24x24, multicolore) ---------- */
export const IconBricks = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="4" width="9" height="6" rx="0.5" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.2" />
    <rect x="13" y="4" width="9" height="6" rx="0.5" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.2" />
    <rect x="7" y="11" width="10" height="6" rx="0.5" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.2" />
    <rect x="2" y="18" width="6" height="4" rx="0.5" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.2" />
    <rect x="10" y="18" width="12" height="4" rx="0.5" fill="#94c870" stroke="#5a8b3e" strokeWidth="1.2" />
  </svg>
);
export const IconWorld = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="9" fill="#e0b450" stroke="#a07a30" strokeWidth="1.4" />
    <path d="M3 12h18" stroke="#a07a30" strokeWidth="1.2" />
    <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#a07a30" strokeWidth="1.2" fill="none" />
    <path d="M5 8.5 Q12 6 19 8.5" stroke="#a07a30" strokeWidth="1" fill="none" />
    <path d="M5 15.5 Q12 18 19 15.5" stroke="#a07a30" strokeWidth="1" fill="none" />
  </svg>
);
export const IconNasdaq = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#9b6cd9" stroke="#5e3f8a" strokeWidth="1.2" />
    <path d="M6 16 L9 12 L12 14 L18 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 7 L18 7 L18 11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
export const IconSP500 = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#cc3344" stroke="#7a2030" strokeWidth="1.2" />
    <path d="M12 5 L13.5 10 L18.5 10 L14.5 13 L16 18 L12 15 L8 18 L9.5 13 L5.5 10 L10.5 10 Z" fill="#fff" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
  </svg>
);
export const IconThales = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#3a4a8a" stroke="#1f2a55" strokeWidth="1.2" />
    <path d="M6 14 Q6 8 12 8 Q18 8 18 14 L18 17 L6 17 Z" fill="#e0b450" stroke="#a07a30" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M12 4 L12 8 M9 4 L15 4" stroke="#cc3344" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 12 L9 17 M12 12 L12 17 M15 12 L15 17" stroke="#a07a30" strokeWidth="0.8" />
  </svg>
);
export const IconETH = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#5a5a78" stroke="#2e2e44" strokeWidth="1.2" />
    <path d="M12 5 L17 12 L12 14 L7 12 Z" fill="#fff" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M12 14 L17 12 L12 19 L7 12 Z" fill="#d0d0e0" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
  </svg>
);
export const IconSOL = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#1a1a3a" stroke="#0a0a2a" strokeWidth="1.2" />
    <path d="M6 8 L16 8 L18 6 L8 6 Z" fill="#a3e8d0" stroke="#a3e8d0" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M6 13 L16 13 L18 11 L8 11 Z" fill="#9b6cd9" stroke="#9b6cd9" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M6 18 L16 18 L18 16 L8 16 Z" fill="#cc3398" stroke="#cc3398" strokeWidth="0.5" strokeLinejoin="round" />
  </svg>
);
export const IconPOL = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#8247e5" stroke="#5e2fb0" strokeWidth="1.2" />
    <path d="M9 8 L9 14 L12 16 L15 14 L15 8 L12 6 Z" fill="#fff" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round" />
    <path d="M7 10 L7 14 L9 15 L9 11 Z" fill="#d0c8ff" stroke="#fff" strokeWidth="0.5" />
    <path d="M15 11 L17 10 L17 14 L15 15 Z" fill="#d0c8ff" stroke="#fff" strokeWidth="0.5" />
  </svg>
);
export const IconLINK = ({ size = 24, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#2a5ad6" stroke="#1a3a8a" strokeWidth="1.2" />
    <path d="M12 5 L18 8.5 L18 15.5 L12 19 L6 15.5 L6 8.5 Z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

/* ---------- ACHIEVEMENT ICONS (monochrome currentColor) ---------- */
export const AchMilestone = (p: IconProps) => (
  <I {...p}>
    <path d="M5 21V4" />
    <path d="M5 4l11 1.5L13 9l3 4-11 1.5" />
  </I>
);
export const AchPiggy = (p: IconProps) => (
  <I {...p}>
    <ellipse cx="12" cy="13" rx="8" ry="6" />
    <circle cx="9" cy="11" r="0.6" fill="currentColor" />
    <rect x="11" y="8" width="3" height="1.2" rx="0.3" fill="currentColor" />
    <path d="M4 11 L2 9.5 L2 12.5 Z" fill="currentColor" />
    <path d="M17 10 L19 8 L19 11" fill="none" />
    <line x1="8" y1="19" x2="8" y2="21" />
    <line x1="16" y1="19" x2="16" y2="21" />
  </I>
);
export const AchCoinStack = (p: IconProps) => (
  <I {...p}>
    <ellipse cx="12" cy="6" rx="6" ry="2" />
    <path d="M6 6v3c0 1.1 2.7 2 6 2s6-.9 6-2V6" />
    <path d="M6 10v3c0 1.1 2.7 2 6 2s6-.9 6-2v-3" />
    <path d="M6 14v3c0 1.1 2.7 2 6 2s6-.9 6-2v-3" />
  </I>
);
export const AchChest = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="10" width="18" height="11" rx="1" />
    <path d="M3 10c0-3 3-5 9-5s9 2 9 5" />
    <rect x="10" y="13" width="4" height="5" rx="0.5" fill="currentColor" />
    <line x1="3" y1="14" x2="21" y2="14" />
  </I>
);
export const AchMedal = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="14" r="6" />
    <path d="M9 8L7 3h10l-2 5" />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </I>
);
export const AchRunner = (p: IconProps) => (
  <I {...p}>
    <circle cx="14" cy="4.5" r="1.5" fill="currentColor" />
    <path d="M10 11l3-2 2 4-2 2 3 5" />
    <path d="M7 14l3 1 3-3" />
    <path d="M16 13l2-1" />
  </I>
);
export const AchCalendar = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="16" rx="1.5" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </I>
);
export const AchHammer = (p: IconProps) => (
  <I {...p}>
    <path d="M14 6l4-4 4 4-4 4z" fill="currentColor" stroke="currentColor" />
    <path d="M14 6l-9 9-3 6 6-3 9-9" />
  </I>
);
export const AchCoffee = (p: IconProps) => (
  <I {...p}>
    <path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" />
    <path d="M17 10h2a2 2 0 010 4h-2" />
    <path d="M8 3v2M11 3v2M14 3v2" />
  </I>
);
export const AchHandshake = (p: IconProps) => (
  <I {...p}>
    <path d="M11 16l-3 3a2 2 0 01-3-3l5-5" />
    <path d="M13 8l3-3a2 2 0 013 3l-5 5" />
    <path d="M11 8l5 5 3-3-5-5z" fill="currentColor" />
    <path d="M5 13l5 5 3-3-5-5z" fill="currentColor" />
  </I>
);
export const AchBitcoin = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 8v8M9 8h4a2 2 0 010 4h-4M9 12h5a2 2 0 010 4H9" />
    <line x1="11" y1="6" x2="11" y2="8" />
    <line x1="13" y1="6" x2="13" y2="8" />
    <line x1="11" y1="16" x2="11" y2="18" />
    <line x1="13" y1="16" x2="13" y2="18" />
  </I>
);
export const AchHouse = (p: IconProps) => (
  <I {...p}>
    <path d="M4 12 L12 5 L20 12 L20 20 L4 20 Z" />
    <path d="M3 12 L12 4 L21 12" />
    <rect x="10" y="14" width="4" height="6" fill="currentColor" />
  </I>
);
export const AchFlag = (p: IconProps) => (
  <I {...p}>
    <path d="M5 22V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </I>
);
export const AchSeed = (p: IconProps) => (
  <I {...p}>
    <path d="M12 22V12" />
    <path d="M12 12c-4 0-7-3-7-7 4 0 7 3 7 7z" fill="currentColor" />
    <path d="M12 12c4 0 7-3 7-7-4 0-7 3-7 7z" fill="currentColor" />
  </I>
);
export const AchCrown = (p: IconProps) => (
  <I {...p}>
    <path d="M3 9l3 9h12l3-9-5 4-4-7-4 7z" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="3" cy="9" r="1" fill="currentColor" />
    <circle cx="21" cy="9" r="1" fill="currentColor" />
  </I>
);
export const AchAxe = (p: IconProps) => (
  <I {...p}>
    <path d="M3 21l11-11" />
    <path d="M14 4l6 6c-2 2-5 2-7 0l-1-1c-2-2-2-5 0-7z" fill="currentColor" />
  </I>
);
export const AchExchange = (p: IconProps) => (
  <I {...p}>
    <path d="M4 8h13l-3-3" />
    <path d="M20 16H7l3 3" />
  </I>
);
export const AchEye = (p: IconProps) => (
  <I {...p}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);
export const AchTurtle = (p: IconProps) => (
  <I {...p}>
    <ellipse cx="12" cy="14" rx="7" ry="5" />
    <path d="M9 14l3-3 3 3M8 14l-2-1M16 14l2-1" />
    <circle cx="18.5" cy="12" r="1.5" />
    <line x1="6" y1="18" x2="5" y2="20" />
    <line x1="18" y1="18" x2="19" y2="20" />
  </I>
);
export const AchRabbit = (p: IconProps) => (
  <I {...p}>
    <ellipse cx="12" cy="16" rx="5" ry="4" />
    <ellipse cx="9" cy="7" rx="1.5" ry="4" />
    <ellipse cx="15" cy="7" rx="1.5" ry="4" />
    <circle cx="10" cy="15" r="0.5" fill="currentColor" />
    <circle cx="14" cy="15" r="0.5" fill="currentColor" />
  </I>
);
export const AchRooster = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="9" r="4" />
    <path d="M8 11c-2 2-2 5 0 8h8c2-3 2-6 0-8" />
    <path d="M14 5l2-2M12 4V2M16 7l2-1" />
    <path d="M11 9l-1 1M13 9l1 1" />
  </I>
);
export const AchMoonOrBust = (p: IconProps) => (
  <I {...p}>
    <circle cx="14" cy="10" r="6" fill="none" />
    <path d="M14 4a6 6 0 100 12 5 5 0 010-12z" fill="currentColor" />
    <path d="M5 19l3-3M7 20l-1-1" />
  </I>
);
export const AchCake = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="11" width="18" height="9" rx="1" />
    <path d="M3 15h18" />
    <line x1="8" y1="5" x2="8" y2="11" />
    <line x1="12" y1="3" x2="12" y2="11" />
    <line x1="16" y1="5" x2="16" y2="11" />
    <path d="M7 4l1 1 1-1M11 2l1 1 1-1M15 4l1 1 1-1" />
  </I>
);
export const AchClock = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </I>
);
export const AchAirplane = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12l4 2 6-7 4 1-3 8 2 4-3 1-3-5-4 1-1-3z" fill="currentColor" />
  </I>
);
export const AchID = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M5 17c.5-2 2-3 4-3s3.5 1 4 3" />
    <line x1="15" y1="9" x2="19" y2="9" />
    <line x1="15" y1="12" x2="19" y2="12" />
    <line x1="15" y1="15" x2="18" y2="15" />
  </I>
);
export const AchShieldEuro = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6l8-3z" />
    <path d="M14 14a3 3 0 11-1-5" />
    <line x1="8" y1="11" x2="13" y2="11" />
    <line x1="8" y1="13" x2="13" y2="13" />
  </I>
);
export const AchSnowflake = (p: IconProps) => (
  <I {...p}>
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </I>
);
export const AchBank = (p: IconProps) => (
  <I {...p}>
    <path d="M3 10L12 4l9 6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="6" y1="10" x2="6" y2="18" />
    <line x1="10" y1="10" x2="10" y2="18" />
    <line x1="14" y1="10" x2="14" y2="18" />
    <line x1="18" y1="10" x2="18" y2="18" />
    <line x1="3" y1="18" x2="21" y2="18" />
    <line x1="3" y1="21" x2="21" y2="21" />
  </I>
);
export const AchDividend = (p: IconProps) => (
  <I {...p}>
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    <circle cx="12" cy="12" r="4" />
    <path d="M10 12h4M12 10l2 2-2 2" />
  </I>
);
export const AchFruitBasket = (p: IconProps) => (
  <I {...p}>
    <path d="M4 11h16l-2 9H6z" />
    <circle cx="9" cy="9" r="2.5" fill="currentColor" />
    <circle cx="14" cy="8" r="2" fill="currentColor" />
    <path d="M9 9l1-3M14 8l-1-3" />
  </I>
);
export const AchMusketeers = (p: IconProps) => (
  <I {...p}>
    <line x1="3" y1="21" x2="11" y2="13" />
    <line x1="9" y1="21" x2="17" y2="13" />
    <line x1="15" y1="21" x2="21" y2="15" />
    <circle cx="3" cy="21" r="1.5" fill="currentColor" />
    <circle cx="9" cy="21" r="1.5" fill="currentColor" />
    <circle cx="15" cy="21" r="1.5" fill="currentColor" />
  </I>
);
export const AchPenny = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </I>
);
export const AchDayTrader = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="13" rx="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <path d="M7 13l2-2 2 2 3-4 3 3" />
    <circle cx="6" cy="7" r="0.5" fill="currentColor" />
    <circle cx="8" cy="7" r="0.5" fill="currentColor" />
  </I>
);
export const AchLedger = (p: IconProps) => (
  <I {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <line x1="8" y1="3" x2="8" y2="21" />
    <line x1="11" y1="8" x2="18" y2="8" />
    <line x1="11" y1="12" x2="18" y2="12" />
    <line x1="11" y1="16" x2="15" y2="16" />
  </I>
);
export const AchBat = (p: IconProps) => (
  <I {...p}>
    <path d="M12 6c-4-3-9-2-9 4 0 4 4 6 9 11 5-5 9-7 9-11 0-6-5-7-9-4z" fill="currentColor" />
  </I>
);
export const AchKey = (p: IconProps) => (
  <I {...p}>
    <circle cx="7" cy="14" r="3" />
    <path d="M10 14h11l-2 2M16 14v3" />
  </I>
);
export const AchPendu = (p: IconProps) => (
  <I {...p}>
    <path d="M5 21V5h10" />
    <line x1="11" y1="5" x2="11" y2="9" />
    <circle cx="11" cy="11" r="2" />
    <line x1="11" y1="13" x2="11" y2="17" />
    <line x1="11" y1="17" x2="9" y2="20" />
    <line x1="11" y1="17" x2="13" y2="20" />
    <line x1="11" y1="14" x2="9" y2="16" />
    <line x1="11" y1="14" x2="13" y2="16" />
    <line x1="10.3" y1="10.5" x2="10.8" y2="11" />
    <line x1="10.8" y1="10.5" x2="10.3" y2="11" />
    <line x1="11.2" y1="10.5" x2="11.7" y2="11" />
    <line x1="11.7" y1="10.5" x2="11.2" y2="11" />
  </I>
);

/* ---------- AVATAR PIO (placeholder Memoji — à remplacer par l'art final) ---------- */
export function AvatarPio({ size = 140, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} style={style}>
      <circle cx="70" cy="70" r="64" fill="#3a1c1d" />
      <circle cx="70" cy="70" r="64" stroke="#e0b450" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
      <path d="M30 130 Q30 95 70 95 Q110 95 110 130 Z" fill="#e0b450" />
      <path d="M55 95 L55 105 Q55 110 70 110 Q85 110 85 105 L85 95" fill="#f0c878" />
      <rect x="62" y="80" width="16" height="14" fill="#f0c878" />
      <circle cx="70" cy="62" r="28" fill="#f0c878" />
      <path d="M44 50 Q44 30 70 30 Q96 30 96 50 Q96 55 92 56 L92 48 Q90 38 78 38 L62 38 Q50 38 48 48 L48 56 Q44 55 44 50 Z" fill="#3a1c1d" />
      <path d="M48 56 Q56 52 70 52 Q84 52 92 56" stroke="#3a1c1d" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="62" r="2.5" fill="#1a0a0a" />
      <circle cx="80" cy="62" r="2.5" fill="#1a0a0a" />
      <circle cx="61" cy="61" r="0.8" fill="#fff" />
      <circle cx="81" cy="61" r="0.8" fill="#fff" />
      <path d="M55 56 Q60 54 65 56" stroke="#3a1c1d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M75 56 Q80 54 85 56" stroke="#3a1c1d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M62 72 Q70 78 78 72" stroke="#3a1c1d" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="54" cy="70" rx="3" ry="2" fill="#d68658" opacity="0.4" />
      <ellipse cx="86" cy="70" rx="3" ry="2" fill="#d68658" opacity="0.4" />
      <circle cx="70" cy="102" r="4" fill="#e0b450" stroke="#a07a30" strokeWidth="0.8" />
    </svg>
  );
}
export function AvatarMini({ size = 40, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} style={style}>
      <circle cx="20" cy="20" r="19" fill="#3a1c1d" />
      <circle cx="20" cy="20" r="19" stroke="#e0b450" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="20" cy="18" r="10" fill="#f0c878" />
      <path d="M11 15 Q11 8 20 8 Q29 8 29 15 L29 18 Q28 16 25 15 L15 15 Q12 16 11 18 Z" fill="#3a1c1d" />
      <circle cx="17" cy="19" r="0.9" fill="#1a0a0a" />
      <circle cx="23" cy="19" r="0.9" fill="#1a0a0a" />
      <path d="M17 23 Q20 25 23 23" stroke="#3a1c1d" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M8 38 Q8 30 20 30 Q32 30 32 38 Z" fill="#e0b450" />
    </svg>
  );
}

/* ---------- DECO ---------- */
export function CoinStackDeco({ size = 80, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} style={style}>
      <ellipse cx="40" cy="60" rx="22" ry="6" fill="#a07a30" />
      <rect x="18" y="48" width="44" height="12" fill="#e0b450" />
      <ellipse cx="40" cy="48" rx="22" ry="6" fill="#f5d57a" />
      <ellipse cx="40" cy="48" rx="22" ry="6" fill="none" stroke="#a07a30" strokeWidth="0.8" />
      <ellipse cx="40" cy="40" rx="18" ry="5" fill="#a07a30" />
      <rect x="22" y="30" width="36" height="10" fill="#e0b450" />
      <ellipse cx="40" cy="30" rx="18" ry="5" fill="#f5d57a" />
      <ellipse cx="40" cy="30" rx="18" ry="5" fill="none" stroke="#a07a30" strokeWidth="0.8" />
      <ellipse cx="40" cy="24" rx="14" ry="4" fill="#a07a30" />
      <rect x="26" y="16" width="28" height="8" fill="#e0b450" />
      <ellipse cx="40" cy="16" rx="14" ry="4" fill="#f5d57a" />
      <ellipse cx="40" cy="16" rx="14" ry="4" fill="none" stroke="#a07a30" strokeWidth="0.8" />
    </svg>
  );
}
export function SkaterChibi({ size = 36, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} style={style}>
      <ellipse cx="18" cy="32" rx="11" ry="1.5" fill="#3a1c1d" opacity="0.4" />
      <rect x="6" y="28" width="24" height="3" rx="1.5" fill="#3a1c1d" />
      <circle cx="10" cy="32" r="1.5" fill="#e0b450" stroke="#a07a30" strokeWidth="0.5" />
      <circle cx="26" cy="32" r="1.5" fill="#e0b450" stroke="#a07a30" strokeWidth="0.5" />
      <path d="M14 28 L13 22 M22 28 L23 22" stroke="#e0b450" strokeWidth="3" strokeLinecap="round" />
      <rect x="13" y="14" width="10" height="10" rx="2" fill="#e0b450" />
      <path d="M13 16 L8 19 M23 16 L28 14" stroke="#e0b450" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="9" r="5" fill="#f0c878" />
      <path d="M13 8 Q13 4 18 4 Q23 4 23 8 L23 9 Q22 7 20 7 L16 7 Q14 7 13 9 Z" fill="#3a1c1d" />
      <circle cx="16" cy="9.5" r="0.6" fill="#1a0a0a" />
      <circle cx="20" cy="9.5" r="0.6" fill="#1a0a0a" />
      <path d="M16 11.5 Q18 13 20 11.5" stroke="#3a1c1d" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
export function BrandMark({ size = 26, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" className={className} style={style}>
      <text x="13" y="20" fontSize="20" fill="#3a1c1d" textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="800" letterSpacing="-0.05em">
        €
      </text>
    </svg>
  );
}
