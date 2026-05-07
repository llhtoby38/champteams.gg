import type { PokemonSet } from '@/types/pokemon';

/**
 * Export a single Pokemon set to Showdown paste format.
 * Champions stores stat points (0-32) in the evs field.
 * Showdown Champions format uses "EVs:" label for stat points.
 */
export function exportSetToShowdown(set: PokemonSet): string {
  const lines: string[] = [];

  let line1 = set.nickname ? `${set.nickname} (${set.species})` : set.species;
  if (set.item) line1 += ` @ ${set.item}`;
  lines.push(line1);

  if (set.ability) lines.push(`Ability: ${set.ability}`);
  lines.push(`Level: ${set.level}`);

  // Stat Points exported as "EVs:" for Showdown compatibility
  const evParts: string[] = [];
  const statNames: Record<string, string> = {
    hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
  };
  for (const [key, label] of Object.entries(statNames)) {
    const val = set.evs[key as keyof typeof set.evs];
    if (val > 0) evParts.push(`${val} ${label}`);
  }
  if (evParts.length > 0) lines.push(`EVs: ${evParts.join(' / ')}`);

  if (set.nature) lines.push(`${set.nature} Nature`);

  // IVs omitted — Champions has no IVs (always 31)

  for (const move of set.moves) {
    if (move) lines.push(`- ${move}`);
  }

  return lines.join('\n');
}

export function exportTeamToShowdown(sets: PokemonSet[]): string {
  return sets.map(exportSetToShowdown).join('\n\n');
}

/**
 * Parse a Showdown paste format into PokemonSet objects.
 * Auto-detects old EVs (>32 per stat or total >66) and converts to SP.
 */
export function importTeamFromShowdown(text: string): Partial<PokemonSet>[] {
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks.map((block) => {
    const lines = block.trim().split('\n');
    const set: Partial<PokemonSet> = {
      moves: ['', '', '', ''],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: 50,
    };

    const statMap: Record<string, string> = {
      HP: 'hp', Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe',
    };

    let moveIndex = 0;
    for (const line of lines) {
      const trimmed = line.trim();

      if (!set.species) {
        const itemMatch = trimmed.match(/^(.+?)(?:\s*@\s*(.+))?$/);
        if (itemMatch) {
          let nameBlock = itemMatch[1].trim();
          set.item = itemMatch[2]?.trim() || '';
          // Strip gender marker (M) or (F) from end
          nameBlock = nameBlock.replace(/\s*\([MF]\)\s*$/, '').trim();
          const nickMatch = nameBlock.match(/^(.+?)\s*\(([^)]+)\)/);
          if (nickMatch) {
            set.nickname = nickMatch[1].trim();
            let sp = nickMatch[2].trim();
            // Strip gender marker that may be inside species parens
            sp = sp.replace(/\s*\([MF]\)\s*$/, '').trim();
            set.species = sp;
          } else {
            set.species = nameBlock;
          }
          // Normalize species name: strip form suffixes not in our DB
          if (set.species) {
            set.species = set.species
              .replace(/-Totem$/i, '')         // Totem forms
              .replace(/-Starter$/i, '')       // Pikachu-Starter
              .trim();
          }
        }
        continue;
      }

      if (trimmed.startsWith('Ability:')) {
        set.ability = trimmed.replace('Ability:', '').trim();
      } else if (trimmed.startsWith('Level:')) {
        set.level = parseInt(trimmed.replace('Level:', '').trim(), 10);
      } else if (trimmed.startsWith('EVs:')) {
        const parts = trimmed.replace('EVs:', '').trim().split('/');
        for (const part of parts) {
          const match = part.trim().match(/^(\d+)\s+(\w+)/);
          if (match && statMap[match[2]]) {
            (set.evs as unknown as Record<string, number>)[statMap[match[2]]] = parseInt(match[1], 10);
          }
        }
      } else if (trimmed.startsWith('IVs:')) {
        // Ignore IVs in Champions — always 31
      } else if (trimmed.endsWith('Nature')) {
        set.nature = trimmed.replace('Nature', '').trim();
      } else if (trimmed.startsWith('-')) {
        const move = trimmed.replace(/^-\s*/, '').trim();
        if (moveIndex < 4 && set.moves) {
          set.moves[moveIndex] = move;
          moveIndex++;
        }
      }
    }

    // Auto-detect old EVs and convert to SP
    if (set.evs) {
      const evs = set.evs as unknown as Record<string, number>;
      const maxSingle = Math.max(...Object.values(evs));
      const total = Object.values(evs).reduce((a, b) => a + b, 0);
      if (maxSingle > 32 || total > 66) {
        // Old EV format — convert to SP
        const convert = (ev: number) => Math.min(Math.round(ev / 8), 32);
        set.evs = {
          hp: convert(evs.hp || 0), atk: convert(evs.atk || 0), def: convert(evs.def || 0),
          spa: convert(evs.spa || 0), spd: convert(evs.spd || 0), spe: convert(evs.spe || 0),
        };
        // Clamp total
        let newTotal = Object.values(set.evs).reduce((a, b) => a + b, 0);
        if (newTotal > 66) {
          const stats = Object.entries(set.evs)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => a - b);
          let excess = newTotal - 66;
          for (const [stat] of stats) {
            if (excess <= 0) break;
            const reduce = Math.min((set.evs as unknown as Record<string, number>)[stat], excess);
            (set.evs as unknown as Record<string, number>)[stat] -= reduce;
            excess -= reduce;
          }
        }
      }
    }

    return set;
  });
}
