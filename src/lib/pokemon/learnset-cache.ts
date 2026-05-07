import type { Move } from '@/types/pokemon';

// Module-level cache — survives component remounts for the lifetime of the page
export const learnsetCache = new Map<string, Move[]>();
export let itemsCached: { id: string; name: string; description?: string | null }[] | null = null;
export function setItemsCache(data: { id: string; name: string; description?: string | null }[]) {
  itemsCached = data;
}

export async function fetchLearnset(speciesId: string): Promise<Move[]> {
  if (learnsetCache.has(speciesId)) return learnsetCache.get(speciesId)!;
  const res = await fetch(`/api/pokemon/${speciesId}/learnset`);
  const data: Move[] = await res.json();
  learnsetCache.set(speciesId, data);
  return data;
}

/** Fire-and-forget prefetch — call this as soon as species IDs are known */
export function prefetchLearnsets(speciesIds: string[]): void {
  speciesIds.forEach((id) => {
    if (id && !learnsetCache.has(id)) {
      fetchLearnset(id).catch(() => {});
    }
  });
}
