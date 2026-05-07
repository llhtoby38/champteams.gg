'use client';

import { useEffect, useState } from 'react';
import type { MetaThreat } from '@/types/calc';

const CACHE_KEY = 'poketeam_default_meta_threats_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches server s-maxage

export interface DefaultMetaThreats {
  version: string;
  threats: MetaThreat[];
}

interface CachedEntry extends DefaultMetaThreats {
  fetchedAt: number;
}

/**
 * Loads the canonical default meta threat list (tiers S–B, ordered) from
 * `/api/default-meta-threats`, with a localStorage cache to avoid hammering
 * the endpoint on every page load. If a fresh cache exists, uses it
 * immediately and skips the network; otherwise fetches and updates the cache.
 *
 * HTTP-level CDN caching handles cross-user reuse; this client cache handles
 * the within-user repeat-visit case.
 */
export function useDefaultMetaThreats(): DefaultMetaThreats | null {
  const [data, setData] = useState<DefaultMetaThreats | null>(() => readCache());

  useEffect(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      // Fresh — no refetch needed.
      return;
    }

    let cancelled = false;
    fetch('/api/default-meta-threats')
      .then(r => r.json())
      .then((resp: DefaultMetaThreats) => {
        if (cancelled || !resp?.threats) return;
        writeCache(resp);
        setData(resp);
      })
      .catch(() => { /* fall back to stale cache / null */ });
    return () => { cancelled = true; };
  }, []);

  return data;
}

function readCache(): CachedEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (!parsed?.version || !Array.isArray(parsed.threats)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: DefaultMetaThreats) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CachedEntry = { ...data, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* quota — ignore */ }
}
