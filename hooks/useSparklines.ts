"use client";
import { useState, useEffect, useRef } from "react";
import type { SparklineMap } from "@/types/prices";

// v3 : la validité du cache exige désormais des séries NON vides (cf. plus bas).
// Le bump de clé purge d'office les caches v2 empoisonnés par des séries vides.
const CACHE_KEY = "pm_sparklines_v3";
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

function hasPoints(series: unknown): series is { length: number } {
  return Array.isArray(series) && series.length >= 2;
}

/**
 * Récupère les séries de prix (mini-courbes) pour les actifs cotés.
 *
 * Cache localStorage 3 h, mais **anti-empoisonnement** : une série vide (échec
 * Yahoo/CoinGecko transitoire) n'est jamais considérée comme « en cache » — on
 * la re-tente au prochain rendu. Le cache 3 h vit sur les séries pleines. Côté
 * serveur, la route a son propre `revalidate` 3 h : re-fetcher une série vide ne
 * tape donc pas l'API externe tant qu'elle est en cache Next.
 *
 * On récupère toujours `days` jours puis la colonne tranche par fenêtre
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
    const cacheFresh =
      cached != null && cached.days === days && now - cached.fetchedAt < TTL;
    const cachedData: SparklineMap = cacheFresh && cached ? cached.data : {};

    // Le cache n'est pleinement valide que si CHAQUE id y a une série non vide.
    // Un id absent ou avec une série vide ([]) force un re-fetch (sans repartir
    // de zéro : on garde les séries déjà bonnes).
    const allFresh = allIds.every((id) => hasPoints(cachedData[id]));

    // Affiche tout de suite ce qu'on a (même partiel/périmé) pour éviter le flash.
    if (Object.keys(cachedData).length > 0) setData(cachedData);

    if (allFresh) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    (async () => {
      try {
        const fresh: SparklineMap = {};
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
            Object.assign(fresh, json.data);
          }
        }

        // Fusion anti-régression : on n'écrase une série existante que par une
        // série fraîche NON vide. Une série fraîche vide ne supprime pas une
        // bonne série déjà en cache.
        const merged: SparklineMap = { ...cachedData };
        for (const [id, series] of Object.entries(fresh)) {
          if (hasPoints(series) || !hasPoints(merged[id])) merged[id] = series;
        }

        if (Object.keys(merged).length > 0) {
          // On ne persiste que si au moins une série est pleine — sinon on évite
          // d'écrire un cache 100 % vide qui n'apporte rien.
          const anyFull = Object.values(merged).some(hasPoints);
          if (anyFull) {
            try {
              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ data: merged, fetchedAt: Date.now(), days })
              );
            } catch {
              /* ignore */
            }
          }
          setData(merged);
        }
      } catch {
        /* keep whatever we already showed */
      } finally {
        fetchingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, days]);

  return data;
}
