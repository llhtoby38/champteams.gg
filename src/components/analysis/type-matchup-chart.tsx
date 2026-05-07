'use client';

import { TYPE_COLORS } from '@/lib/sprites';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

// Offensive chart: ATTACKER[DEFENDER] = multiplier
const OFFENSIVE: Record<string, Record<string, number>> = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy:    { Fire: 0.5, Poison: 0.5, Fighting: 2, Dragon: 2, Dark: 2, Steel: 0.5 },
};

function getMultiplier(attacker: string, defender: string): number {
  return OFFENSIVE[attacker]?.[defender] ?? 1;
}

function CellContent({ mult }: { mult: number }) {
  if (mult === 0) return <span className="font-bold text-[10px]">0</span>;
  if (mult === 0.5) return <span className="text-[10px]">&frac12;</span>;
  if (mult === 2) return <span className="font-bold text-[10px]">2</span>;
  return null; // 1x = empty
}

function cellBg(mult: number): string {
  if (mult === 0) return 'bg-gray-800 dark:bg-gray-600 text-gray-300';
  if (mult === 0.5) return 'bg-red-200 text-red-800';
  if (mult === 2) return 'bg-green-200 text-green-800';
  return '';
}

function TypeLabel({ type, vertical }: { type: string; vertical?: boolean }) {
  const abbr = type.slice(0, 3).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center text-[9px] font-bold text-white rounded-sm ${vertical ? 'w-6 h-5' : 'w-8 h-5'}`}
      style={{ backgroundColor: TYPE_COLORS[type] || '#999' }}
      title={type}
    >
      {abbr}
    </div>
  );
}

export function TypeMatchupChart() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground text-center">
        Rows = Attacker &nbsp;·&nbsp; Columns = Defender
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto" style={{ fontSize: 0 }}>
          <thead>
            <tr>
              {/* Top-left corner */}
              <th className="p-0.5">
                <div className="w-8 h-5 flex items-center justify-center text-[8px] text-muted-foreground">
                  ATK↓
                </div>
              </th>
              {ALL_TYPES.map(type => (
                <th key={type} className="p-0.5">
                  <TypeLabel type={type} vertical />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_TYPES.map(attacker => (
              <tr key={attacker}>
                <td className="p-0.5">
                  <TypeLabel type={attacker} />
                </td>
                {ALL_TYPES.map(defender => {
                  const mult = getMultiplier(attacker, defender);
                  return (
                    <td key={defender} className="p-0.5">
                      <div className={`w-6 h-5 flex items-center justify-center rounded-sm ${cellBg(mult)}`}>
                        <CellContent mult={mult} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-200" /> 2x (super effective)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-200" /> &frac12;x (not very effective)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-800 dark:bg-gray-600" /> 0x (immune)
        </span>
      </div>
    </div>
  );
}
