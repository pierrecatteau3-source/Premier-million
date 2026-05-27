"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { PriceMap } from "@/types/prices";

const CACHE_KEY = "pm_prices_v3";
const TTL = 86_400_000; // 24h
const REFRESH_THRESHOLD = 43_200_000; // 12h

interface CacheEntry {
  data: PriceMap;
  fetchedAt: number;
}

interface PriceRequest {
  ids: string[];
  mode: "crypto" | "equity";
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(data: PriceMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function usePrices(requests: PriceRequest[]): {
  prices: PriceMap;
  loading: boolean;
  updatedAt: Date | null;
  refresh: () => void;
} {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const fetchingRef = useRef(false);

  const doFetch = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const results: PriceMap = {};
      for (const req of requests) {
        if (req.ids.length === 0) continue;
        const param = req.mode === "crypto" ? `ids=${req.ids.join(",")}` : `tickers=${req.ids.join(",")}`;
        const res = await fetch(`/api/prices?${param}&mode=${req.mode}`);
        if (res.ok) {
          const json = await res.json() as { data: PriceMap };
          Object.assign(results, json.data);
        }
      }
      if (Object.keys(results).length > 0) {
        writeCache(results);
        setPrices(results);
        setUpdatedAt(new Date());
      }
    } catch { /* keep cache */ } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  useEffect(() => {
    const allRequestedIds = requests.flatMap((r) => r.ids);
    const cached = readCache();
    const now = Date.now();
    const cacheValid =
      cached &&
      now - cached.fetchedAt < TTL &&
      allRequestedIds.every((id) => id in cached.data);

    if (cacheValid && cached) {
      setPrices(cached.data);
      setUpdatedAt(new Date(cached.fetchedAt));
      if (now - cached.fetchedAt > REFRESH_THRESHOLD) {
        doFetch();
      }
    } else {
      doFetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const refresh = useCallback(() => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    doFetch(true);
  }, [doFetch]);

  return { prices, loading, updatedAt, refresh };
}
