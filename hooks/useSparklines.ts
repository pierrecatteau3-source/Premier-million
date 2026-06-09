"use client";
import { useState, useEffect, useRef } from "react";
import type { SparklineMap } from "@/types/prices";

const CACHE_KEY = "pm_sparklines_v1";
const TTL = 10_800_000; // 3 h — un appel externe toutes les 3 h max

interface PriceRequest {
  ids: string[];
  mode: "crypto" | "equity";
}

interface CacheEntry {
  data: SparklineMap;
  fetchedAt: number;
  days: number;
}

/**
 * Récupère les séries de prix (mini-courbes) pour les actifs cotés.
 * Cache localStorage 3 h : on ne tape les API externes qu'une fois par fenêtre
 * de 3 h. On récupère toujours `days` jours puis le tableau tranche par fenêtre
 * (1J/3J/7J) côté client, sans nouvel appel.
 */
export function useSparklines(requests: PriceRequest[], days = 7): SparklineMap {
  const [data, setData] = useState<SparklineMap>({});
  const fetchingRef = useRef(false);

  useEffect(() => {
    const allIds = requests.flatMap((r) => r.ids);
    if (allIds.length === 0) {
      setData({});
      return;
    }

    let cached: CacheEntry | null = null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) cached = JSON.parse(raw) as CacheEntry;
    } catch {
      /* ignore */
    }

    const now = Date.now();
    const cacheValid =
      cached != null &&
      cached.days === days &&
      now - cached.fetchedAt < TTL &&
      allIds.every((id) => id in cached!.data);

    if (cacheValid && cached) {
      setData(cached.data);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    (async () => {
      try {
        const results: SparklineMap = {};
        for (const req of requests) {
          if (req.ids.length === 0) continue;
          const param =
            req.mode === "crypto"
              ? `ids=${req.ids.join(",")}`
              : `tickers=${req.ids.join(",")}`;
          const res = await fetch(
            `/api/prices/sparkline?${param}&mode=${req.mode}&days=${days}`
          );
          if (res.ok) {
            const json = (await res.json()) as { data: SparklineMap };
            Object.assign(results, json.data);
          }
        }
        if (Object.keys(results).length > 0) {
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: results, fetchedAt: Date.now(), days })
            );
          } catch {
            /* ignore */
          }
          setData(results);
        }
      } catch {
        /* keep empty */
      } finally {
        fetchingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, days]);

  return data;
}
