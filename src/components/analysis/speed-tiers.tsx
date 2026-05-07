'use client';

import { useState, useMemo, useEffect } from 'react';
import { calcStat, getNatureMod } from '@/lib/pokemon/stats';
import { TYPE_COLORS } from '@/lib/sprites';
import type { TeamSlotData } from '@/hooks/use-team';
import type { CalcConditions } from '@/types/calc';
import { Wind, RotateCcw, CloudRain } from 'lucide-react';

interface SpeedTiersProps {
  team: NonNullable<TeamSlotData>[];
  /** Shared battle conditions from the calc panel — syncs Trick Room, Tailwind, Weather */
  conditions?: CalcConditions;
}

interface SpeedEntry {
  name: string;
  speed: number;
  types: string[];
  isTeamMember: boolean;
  condition?: string;
}

const SPEED_ITEMS: Record<string, number> = {
  'Choice Scarf': 1.5,
  'Iron Ball': 0.5,
  'Macho Brace': 0.5,
  'Power Anklet': 0.5, 'Power Band': 0.5, 'Power Belt': 0.5,
  'Power Bracer': 0.5, 'Power Lens': 0.5, 'Power Weight': 0.5,
};

type Weather = '' | 'Sun' | 'Rain' | 'Sand' | 'Snow';

const WEATHER_SPEED_ABILITIES: Record<string, Weather> = {
  'Swift Swim': 'Rain',
  'Chlorophyll': 'Sun',
  'Sand Rush': 'Sand',
  'Slush Rush': 'Snow',
};

/**
 * Comprehensive speed tier reference from Pokemon Champions community analysis.
 * Covers max-invested, boosted (Scarf/DD/Tailwind), and uninvested benchmarks.
 */
const SPEED_TIERS: { name: string; baseSpe: number; types: string[]; investment: 'max' | 'none' | 'min'; boost?: string }[] = [
  // === Boosted speeds (weather abilities, Scarf, Dragon Dance, Tailwind) ===
  { name: 'Excadrill (Sand Rush)', baseSpe: 88, types: ['Ground', 'Steel'], investment: 'max', boost: 'x2' },
  { name: 'Venusaur (Chlorophyll)', baseSpe: 80, types: ['Grass', 'Poison'], investment: 'max', boost: 'x2' },
  { name: 'Basculegion (Swift Swim)', baseSpe: 78, types: ['Water', 'Ghost'], investment: 'max', boost: 'x2' },
  { name: 'Pelipper (Tailwind)', baseSpe: 65, types: ['Water', 'Flying'], investment: 'max', boost: 'x2' },
  { name: 'Gengar (Scarf)', baseSpe: 110, types: ['Ghost', 'Poison'], investment: 'max', boost: 'x1.5' },
  { name: 'Arcanine-H (Scarf)', baseSpe: 95, types: ['Fire', 'Rock'], investment: 'max', boost: 'x1.5' },
  { name: 'Charizard-X (DD)', baseSpe: 100, types: ['Fire', 'Dragon'], investment: 'max', boost: 'x1.5' },
  { name: 'Volcarona (QD)', baseSpe: 100, types: ['Bug', 'Fire'], investment: 'max', boost: 'x1.5' },
  { name: 'Primarina (Scarf)', baseSpe: 60, types: ['Water', 'Fairy'], investment: 'max', boost: 'x1.5' },

  // === Max speed invested ===
  { name: 'Dragapult', baseSpe: 142, types: ['Dragon', 'Ghost'], investment: 'max' },
  { name: 'Talonflame', baseSpe: 126, types: ['Fire', 'Flying'], investment: 'max' },
  { name: 'Weavile', baseSpe: 125, types: ['Dark', 'Ice'], investment: 'max' },
  { name: 'Greninja', baseSpe: 122, types: ['Water', 'Dark'], investment: 'max' },
  { name: 'Sneasler', baseSpe: 120, types: ['Fighting', 'Poison'], investment: 'max' },
  { name: 'Whimsicott', baseSpe: 116, types: ['Grass', 'Fairy'], investment: 'max' },
  { name: 'Maushold', baseSpe: 111, types: ['Normal'], investment: 'max' },
  { name: 'Froslass', baseSpe: 110, types: ['Ice', 'Ghost'], investment: 'max' },
  { name: 'Gengar', baseSpe: 110, types: ['Ghost', 'Poison'], investment: 'max' },
  { name: 'Garchomp', baseSpe: 102, types: ['Dragon', 'Ground'], investment: 'max' },
  { name: 'Charizard', baseSpe: 100, types: ['Fire', 'Flying'], investment: 'max' },
  { name: 'Volcarona', baseSpe: 100, types: ['Bug', 'Fire'], investment: 'max' },
  { name: 'Hydreigon', baseSpe: 98, types: ['Dark', 'Dragon'], investment: 'max' },
  { name: 'Arcanine-Hisui', baseSpe: 95, types: ['Fire', 'Rock'], investment: 'max' },
  { name: 'Lucario', baseSpe: 90, types: ['Fighting', 'Steel'], investment: 'max' },
  { name: 'Excadrill', baseSpe: 88, types: ['Ground', 'Steel'], investment: 'max' },
  { name: 'Kommo-o', baseSpe: 85, types: ['Dragon', 'Fighting'], investment: 'max' },
  { name: 'Archaludon', baseSpe: 85, types: ['Steel', 'Dragon'], investment: 'max' },
  { name: 'Dragonite', baseSpe: 80, types: ['Dragon', 'Flying'], investment: 'max' },
  { name: 'Basculegion', baseSpe: 78, types: ['Water', 'Ghost'], investment: 'max' },

  // === No investment (common bulky Pokemon) ===
  { name: 'Rotom-Wash', baseSpe: 86, types: ['Electric', 'Water'], investment: 'none' },
  { name: 'Gardevoir', baseSpe: 80, types: ['Psychic', 'Fairy'], investment: 'none' },
  { name: 'Meganium', baseSpe: 80, types: ['Grass'], investment: 'none' },
  { name: 'Pelipper', baseSpe: 65, types: ['Water', 'Flying'], investment: 'none' },
  { name: 'Tyranitar', baseSpe: 61, types: ['Rock', 'Dark'], investment: 'none' },
  { name: 'Incineroar', baseSpe: 60, types: ['Fire', 'Dark'], investment: 'none' },
  { name: 'Primarina', baseSpe: 60, types: ['Water', 'Fairy'], investment: 'none' },
  { name: 'Sylveon', baseSpe: 60, types: ['Fairy'], investment: 'none' },
  { name: 'Aegislash', baseSpe: 60, types: ['Steel', 'Ghost'], investment: 'none' },
  { name: 'Farigiraf', baseSpe: 60, types: ['Normal', 'Psychic'], investment: 'none' },
  { name: 'Kingambit', baseSpe: 50, types: ['Dark', 'Steel'], investment: 'none' },

  // === Trick Room benchmarks (min speed) ===
  { name: 'Hatterene', baseSpe: 29, types: ['Psychic', 'Fairy'], investment: 'min' },
  { name: 'Sinistcha', baseSpe: 23, types: ['Grass', 'Ghost'], investment: 'min' },
  { name: 'Torkoal', baseSpe: 20, types: ['Fire'], investment: 'min' },
];

function calcBenchmarkSpeed(tier: typeof SPEED_TIERS[number]): number {
  let speed: number;
  if (tier.investment === 'max') {
    speed = calcStat('spe', tier.baseSpe, 32, { plus: 'spe', minus: null });
  } else if (tier.investment === 'min') {
    speed = calcStat('spe', tier.baseSpe, 0, { plus: null, minus: 'spe' });
  } else {
    speed = calcStat('spe', tier.baseSpe, 0, { plus: null, minus: null });
  }
  // Apply noted boost
  if (tier.boost === 'x2') speed = Math.floor(speed * 2);
  else if (tier.boost === 'x1.5') speed = Math.floor(speed * 1.5);
  return speed;
}

export function SpeedTiers({ team, conditions }: SpeedTiersProps) {
  const [tailwind, setTailwind] = useState(false);
  const [trickRoom, setTrickRoom] = useState(false);
  const [weather, setWeather] = useState<Weather>('');

  // Sync from shared battle conditions when provided
  useEffect(() => {
    if (!conditions) return;
    setTrickRoom(conditions.isTrickRoom);
    if (conditions.attackerSide?.isTailwind) setTailwind(true);
    if (conditions.weather) setWeather(conditions.weather as Weather);
  }, [conditions?.isTrickRoom, conditions?.attackerSide?.isTailwind, conditions?.weather]); // eslint-disable-line react-hooks/exhaustive-deps

  const entries = useMemo(() => {
    const result: SpeedEntry[] = [];

    // Add team members with actual speed (SP + nature + item + weather ability)
    for (const slot of team) {
      const nature = getNatureMod(slot.set.nature);
      let speed = calcStat('spe', slot.species.baseStats.spe, slot.set.evs.spe, nature);

      // Apply item speed modifier
      const itemMult = SPEED_ITEMS[slot.set.item] ?? 1;
      if (itemMult !== 1) speed = Math.floor(speed * itemMult);

      // Apply weather-based ability speed doubling
      const abilityWeather = WEATHER_SPEED_ABILITIES[slot.set.ability];
      const hasWeatherBoost = weather !== '' && abilityWeather === weather;
      if (hasWeatherBoost) speed = Math.floor(speed * 2);

      // Apply tailwind toggle
      if (tailwind) speed = Math.floor(speed * 2);

      const condition = [
        slot.set.item && SPEED_ITEMS[slot.set.item] ? slot.set.item : null,
        hasWeatherBoost ? `${slot.set.ability}` : null,
        tailwind ? 'Tailwind' : null,
      ].filter(Boolean).join(' + ') || undefined;

      result.push({
        name: slot.species.name,
        speed,
        types: slot.species.types,
        isTeamMember: true,
        condition,
      });
    }

    // Add meta reference benchmarks
    for (const tier of SPEED_TIERS) {
      const speed = calcBenchmarkSpeed(tier);
      let label: string;
      if (tier.boost) {
        label = tier.name.includes('(') ? tier.name.match(/\(([^)]+)\)/)?.[1] || tier.boost : tier.boost;
      } else if (tier.investment === 'max') {
        label = 'Max';
      } else if (tier.investment === 'min') {
        label = 'Min';
      } else {
        label = '0 EV';
      }

      const displayName = tier.name.replace(/\s*\([^)]*\)\s*$/, '');

      result.push({
        name: displayName,
        speed,
        types: tier.types,
        isTeamMember: false,
        condition: label,
      });
    }

    // Sort: normal = fastest first, Trick Room = slowest first
    if (trickRoom) {
      result.sort((a, b) => a.speed - b.speed);
    } else {
      result.sort((a, b) => b.speed - a.speed);
    }

    return result;
  }, [team, tailwind, trickRoom, weather]);

  if (team.length === 0) return null;

  const maxSpeed = Math.max(...entries.map((e) => e.speed));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Speed Tiers</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTailwind(v => !v)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
              tailwind ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            <Wind className="h-3 w-3" /> Tailwind
          </button>
          <button
            onClick={() => setTrickRoom(v => !v)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
              trickRoom ? 'bg-pink-600 text-white border-pink-600' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            <RotateCcw className="h-3 w-3" /> Trick Room
          </button>
          <button
            onClick={() => setWeather(w => w === '' ? 'Rain' : w === 'Rain' ? 'Sun' : w === 'Sun' ? 'Sand' : w === 'Sand' ? 'Snow' : '')}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
              weather ? 'bg-cyan-600 text-white border-cyan-600' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            <CloudRain className="h-3 w-3" /> {weather || 'Weather'}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {trickRoom
          ? 'Trick Room active — slowest Pokemon move first. Your team shown with actual items.'
          : `Your team (with items${weather ? ` + ${weather}` : ''}) vs. common speed benchmarks. Toggle Tailwind/Weather to apply boosts.`}
      </p>
      <div className="space-y-0.5">
        {entries.map((entry, i) => (
          <div
            key={`${entry.name}-${entry.condition || 'team'}-${i}`}
            className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
              entry.isTeamMember ? 'bg-primary/5 font-semibold' : 'text-muted-foreground'
            }`}
          >
            <span className="w-8 text-right font-mono tabular-nums">{entry.speed}</span>
            <div
              className="h-2.5 rounded"
              style={{
                width: `${(entry.speed / maxSpeed) * 100}%`,
                minWidth: '4px',
                backgroundColor: entry.isTeamMember
                  ? TYPE_COLORS[entry.types[0]] || '#666'
                  : '#d1d5db',
              }}
            />
            <span className="shrink-0">
              {entry.name}
              {entry.condition && (
                <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                  ({entry.condition})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
