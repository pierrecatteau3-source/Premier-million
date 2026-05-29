import {
  IconETH,
  IconSOL,
  IconPOL,
  IconLINK,
  IconNasdaq,
  IconSP500,
  IconThales,
  IconWorld,
  IconBricks,
  IconPEA,
  IconCrypto,
  IconImmo,
  IconAutre,
  type IconProps,
} from "@/components/icons";
import type { Pilier } from "@/types";

type Logo = (p: IconProps) => React.ReactNode;

const KEYWORD_LOGOS: Array<[RegExp, Logo]> = [
  [/eth|ethereum/i, IconETH],
  [/\bsol\b|solana/i, IconSOL],
  [/\bpol\b|polygon|matic/i, IconPOL],
  [/link|chainlink/i, IconLINK],
  [/nasdaq/i, IconNasdaq],
  [/s&p|sp ?500|\b500\b/i, IconSP500],
  [/thales|ho\.pa/i, IconThales],
  [/world|monde|paasi|msci|acwi|amundi/i, IconWorld],
  [/bricks|scpi|pierre/i, IconBricks],
];

const PILIER_FALLBACK: Record<Pilier, Logo> = {
  PEA: IconPEA,
  CRYPTO: IconCrypto,
  IMMO: IconImmo,
  AUTRE: IconAutre,
  LIQUIDITE: IconAutre,
};

/** Choisit un picto cartoon pour un actif (mot-clé sur nom/ticker, sinon pilier). */
export function getAssetLogo(
  name: string,
  ticker: string | null | undefined,
  pilier: Pilier
): Logo {
  const haystack = `${name} ${ticker ?? ""}`;
  for (const [re, logo] of KEYWORD_LOGOS) {
    if (re.test(haystack)) return logo;
  }
  return PILIER_FALLBACK[pilier] ?? IconAutre;
}

export function AssetLogo({
  name,
  ticker,
  pilier,
  size = 22,
}: {
  name: string;
  ticker: string | null | undefined;
  pilier: Pilier;
  size?: number;
}) {
  const Logo = getAssetLogo(name, ticker, pilier);
  return <Logo size={size} />;
}
