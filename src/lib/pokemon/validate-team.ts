import type { PokemonSet } from '@/types/pokemon';

export interface TeamViolation {
  pokemonName: string;
  slotIndex: number;
  type: 'item' | 'move';
  value: string; // the illegal item or move name
}

/**
 * Validate a team's items and moves against the format's allowed lists.
 * Returns an array of violations (empty = legal).
 */
export async function validateTeam(
  slots: { species: string; item?: string; moves?: string[] }[],
  formatId: string,
): Promise<TeamViolation[]> {
  // "All Pokemon" format has no item/move restrictions
  if (formatId === 'champions-all') return [];

  const violations: TeamViolation[] = [];

  // Fetch allowed items (VGC-relevant = Champions legal)
  const itemsRes = await fetch('/api/items?vgc=true&limit=1000');
  const allowedItems: { name: string }[] = await itemsRes.json();
  const allowedItemNames = new Set(allowedItems.map(i => i.name.toLowerCase()));

  // Check each Pokemon
  const moveChecks: Promise<void>[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot?.species) continue;

    // Check item
    if (slot.item && !allowedItemNames.has(slot.item.toLowerCase())) {
      violations.push({
        pokemonName: slot.species,
        slotIndex: i,
        type: 'item',
        value: slot.item,
      });
    }

    // Check moves against learnset
    if (slot.moves && slot.moves.some(m => m)) {
      const speciesId = slot.species.toLowerCase().replace(/[^a-z0-9]/g, '');
      moveChecks.push(
        fetch(`/api/pokemon/${speciesId}/learnset`)
          .then(r => r.json())
          .then((learnset: { name: string }[]) => {
            // Skip validation if learnset data is missing (e.g., Champions Pokemon)
            if (!learnset || learnset.length === 0) return;
            const legalMoves = new Set(learnset.map(m => m.name.toLowerCase()));
            for (const move of slot.moves || []) {
              if (move && !legalMoves.has(move.toLowerCase())) {
                violations.push({
                  pokemonName: slot.species,
                  slotIndex: i,
                  type: 'move',
                  value: move,
                });
              }
            }
          })
          .catch(() => {}), // skip on network error
      );
    }
  }

  await Promise.all(moveChecks);
  return violations;
}
