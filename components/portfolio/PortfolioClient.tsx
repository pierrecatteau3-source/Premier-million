"use client";

import { useMemo } from "react";
import { usePrices } from "@/hooks/usePrices";
import { AssetManager } from "@/components/portfolio/AssetManager";
import type { PilierSummary, PilierAsset } from "@/types";
import type { PriceMap } from "@/types/prices";

interface Props {
  piliers: PilierSummary[];
}

/** Injects live prices into pilier assets and recomputes totalValue per pilier */
function applyLivePrices(piliers: PilierSummary[], priceMap: PriceMap): PilierSummary[] {
  return piliers.map((pilier) => {
    const assetsWithLive: PilierAsset[] = pilier.assets.map((asset) => {
      const isLive =
        (asset.pricingMode === "live_equity" || asset.pricingMode === "live_crypto") &&
        asset.ticker != null &&
        priceMap[asset.ticker]?.price != null;

      if (isLive && asset.quantiteTotal != null && asset.quantiteTotal > 0) {
        const livePrice = priceMap[asset.ticker!]!.price as number;
        const valeurLive = asset.quantiteTotal * livePrice;
        const coutRevient = asset.coutRevient ?? 0;
        const pvLatente = coutRevient > 0 ? valeurLive - coutRevient : asset.pvLatente ?? null;
        const pvPct =
          coutRevient > 0 && pvLatente != null ? (pvLatente / coutRevient) * 100 : asset.pvPct ?? null;

        return {
          ...asset,
          latestValue: valeurLive,
          pvLatente,
          pvPct,
        };
      }
      return asset;
    });

    const totalValue = assetsWithLive.reduce((sum, a) => sum + (a.latestValue ?? 0), 0);
    return { ...pilier, assets: assetsWithLive, totalValue };
  });
}

export function PortfolioClient({ piliers }: Props) {
  // Build the price requests from the flat list of assets
  const requests = useMemo(() => {
    const equityTickers: string[] = [];
    const cryptoIds: string[] = [];

    for (const pilier of piliers) {
      for (const asset of pilier.assets) {
        if (!asset.ticker) continue;
        const ticker = asset.ticker.trim();
        if (!ticker) continue;

        if (asset.pricingMode === "live_equity") {
          equityTickers.push(ticker);
        } else if (asset.pricingMode === "live_crypto") {
          cryptoIds.push(ticker);
        }
      }
    }

    const result = [];
    if (equityTickers.length > 0) {
      result.push({ ids: equityTickers, mode: "equity" as const });
    }
    if (cryptoIds.length > 0) {
      result.push({ ids: cryptoIds, mode: "crypto" as const });
    }
    return result;
  }, [piliers]);

  const { prices } = usePrices(requests);

  const piliersWithLive = useMemo(
    () => applyLivePrices(piliers, prices),
    [piliers, prices]
  );

  return <AssetManager piliers={piliersWithLive} priceMap={prices} />;
}
