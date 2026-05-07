import { useState, useEffect } from 'react';

interface UsageEntry {
  name: string;
  percent: number;
}

interface SpreadEntry {
  nature: string;
  evs: Record<string, number>;
  percent: number;
}

export interface UsageData {
  pokemonId: string;
  formatId: string;
  month: string;
  usagePercent: number;
  moves: UsageEntry[];
  items: UsageEntry[];
  abilities: UsageEntry[];
  spreads: SpreadEntry[];
  teammates: UsageEntry[];
}

const cache = new Map<string, UsageData | null>();

export function useUsageStats(pokemonName: string | undefined): UsageData | null {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    if (!pokemonName) {
      setData(null);
      return;
    }

    const id = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cache.has(id)) {
      setData(cache.get(id) ?? null);
      return;
    }

    fetch(`/api/usage?pokemon=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        cache.set(id, d);
        setData(d);
      })
      .catch(() => {
        cache.set(id, null);
        setData(null);
      });
  }, [pokemonName]);

  return data;
}

/**
 * Get the usage % for a specific move/item/ability.
 * Returns undefined if no usage data available.
 */
export function getUsagePercent(
  data: UsageData | null,
  category: 'moves' | 'items' | 'abilities',
  name: string,
): number | undefined {
  if (!data) return undefined;
  const entry = data[category].find(
    e => e.name.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  return entry?.percent;
}
