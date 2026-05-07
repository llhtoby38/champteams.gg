/**
 * Compute defensive type matchups for a Pokemon given its types.
 * Returns arrays of types grouped by effectiveness multiplier.
 */

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

// defender type → attacking type → multiplier
const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal: { Fighting: 2, Ghost: 0 },
  Fire: { Fire: 0.5, Water: 2, Grass: 0.5, Ice: 0.5, Ground: 2, Bug: 0.5, Rock: 2, Steel: 0.5, Fairy: 0.5 },
  Water: { Fire: 0.5, Water: 0.5, Electric: 2, Grass: 2, Ice: 0.5, Steel: 0.5 },
  Electric: { Electric: 0.5, Ground: 2, Flying: 0.5, Steel: 0.5 },
  Grass: { Fire: 2, Water: 0.5, Electric: 0.5, Grass: 0.5, Ice: 2, Poison: 2, Ground: 0.5, Flying: 2, Bug: 2 },
  Ice: { Fire: 2, Ice: 0.5, Fighting: 2, Rock: 2, Steel: 2 },
  Fighting: { Flying: 2, Psychic: 2, Bug: 0.5, Rock: 0.5, Dark: 0.5, Fairy: 2 },
  Poison: { Fighting: 0.5, Poison: 0.5, Ground: 2, Psychic: 2, Bug: 0.5, Grass: 0.5, Fairy: 0.5 },
  Ground: { Water: 2, Electric: 0, Grass: 2, Ice: 2, Poison: 0.5, Rock: 0.5 },
  Flying: { Electric: 2, Grass: 0.5, Ice: 2, Fighting: 0.5, Ground: 0, Bug: 0.5, Rock: 2 },
  Psychic: { Fighting: 0.5, Psychic: 0.5, Bug: 2, Ghost: 2, Dark: 2 },
  Bug: { Fire: 2, Grass: 0.5, Fighting: 0.5, Ground: 0.5, Flying: 2, Rock: 2 },
  Rock: { Normal: 0.5, Fire: 0.5, Water: 2, Grass: 2, Fighting: 2, Poison: 0.5, Ground: 2, Flying: 0.5, Steel: 2 },
  Ghost: { Normal: 0, Fighting: 0, Poison: 0.5, Bug: 0.5, Ghost: 2, Dark: 2 },
  Dragon: { Fire: 0.5, Water: 0.5, Electric: 0.5, Grass: 0.5, Ice: 2, Dragon: 2, Fairy: 2 },
  Dark: { Fighting: 2, Psychic: 0, Bug: 2, Ghost: 0.5, Dark: 0.5, Fairy: 2 },
  Steel: { Normal: 0.5, Fire: 2, Grass: 0.5, Ice: 0.5, Fighting: 2, Poison: 0, Ground: 2, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 0.5, Dragon: 0.5, Steel: 0.5, Fairy: 0.5 },
  Fairy: { Fighting: 0.5, Poison: 2, Bug: 0.5, Dragon: 0, Dark: 0.5, Steel: 2 },
};

export interface TypeMatchups {
  x4: string[];   // 4x weak
  x2: string[];   // 2x weak
  x1: string[];   // neutral (omitted in compact display)
  half: string[];  // 0.5x resist
  quarter: string[]; // 0.25x resist
  immune: string[];  // 0x immune
}

export function getTypeMatchups(types: string[]): TypeMatchups {
  const result: TypeMatchups = { x4: [], x2: [], x1: [], half: [], quarter: [], immune: [] };

  for (const atkType of ALL_TYPES) {
    let mult = 1;
    for (const defType of types) {
      const chart = TYPE_CHART[defType];
      if (chart && chart[atkType] !== undefined) {
        mult *= chart[atkType];
      }
    }
    if (mult === 0) result.immune.push(atkType);
    else if (mult >= 4) result.x4.push(atkType);
    else if (mult >= 2) result.x2.push(atkType);
    else if (mult <= 0.25) result.quarter.push(atkType);
    else if (mult <= 0.5) result.half.push(atkType);
    else result.x1.push(atkType);
  }

  return result;
}
