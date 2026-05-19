'use client';

import { useMemo } from 'react';
import type { PokemonSpecies } from '@/types/pokemon';
import { learnsetCache } from '@/lib/pokemon/learnset-cache';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { speciesToSpriteId, TYPE_COLORS } from '@/lib/sprites';
import { AlertTriangle, ShieldOff } from 'lucide-react';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

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

const OFFENSE_CHART: Record<string, Record<string, number>> = {};
for (const defType of ALL_TYPES) {
  const chart = TYPE_CHART[defType];
  if (!chart) continue;
  for (const [atkType, mult] of Object.entries(chart)) {
    if (!OFFENSE_CHART[atkType]) OFFENSE_CHART[atkType] = {};
    OFFENSE_CHART[atkType][defType] = mult;
  }
}

function getOffensiveMultiplier(moveType: string, defenderType: string): number {
  return OFFENSE_CHART[moveType]?.[defenderType] ?? 1;
}

// Abilities that grant a complete immunity to a single attacking type.
// Coverage view ignores conditional ability interactions (Iron Ball, Gravity, etc.).
const ABILITY_IMMUNITY: Record<string, string> = {
  Levitate: 'Ground',
  'Earth Eater': 'Ground',
  'Flash Fire': 'Fire',
  'Well-Baked Body': 'Fire',
  'Volt Absorb': 'Electric',
  'Lightning Rod': 'Electric',
  'Motor Drive': 'Electric',
  'Water Absorb': 'Water',
  'Storm Drain': 'Water',
  'Dry Skin': 'Water',
  'Sap Sipper': 'Grass',
  'Purifying Salt': 'Ghost',
};

function getDefensiveMultiplier(pokemonTypes: string[], attackingType: string, ability?: string): number {
  if (ability && ABILITY_IMMUNITY[ability] === attackingType) return 0;
  let multiplier = 1;
  for (const defType of pokemonTypes) {
    const chart = TYPE_CHART[defType];
    if (chart && chart[attackingType] !== undefined) multiplier *= chart[attackingType];
  }
  return multiplier;
}

function getMoveType(speciesId: string, moveName: string): string | null {
  if (!moveName) return null;
  const moves = learnsetCache.get(speciesId);
  if (!moves) return null;
  const moveId = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const found = moves.find(m => m.id === moveId || m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === moveId);
  if (!found || found.category === 'Status') return null;
  return found.type;
}

type DefenseStatus = 'weak' | 'resist' | 'immune' | 'neutral';
type OffenseStatus = 'stab-se' | 'se' | 'none';

interface DefenseCell { species: PokemonSpecies; status: DefenseStatus; mult: number }
interface OffenseCell { species: PokemonSpecies; status: OffenseStatus; moveType: string | null }

function TypeBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 'min-w-[52px] text-[9px] px-1.5 py-0.5' : 'min-w-[60px] text-[10px] px-2 py-0.5';
  return (
    <span
      className={`${w} text-center font-semibold uppercase tracking-wide rounded-full text-white shrink-0`}
      style={{ backgroundColor: TYPE_COLORS[type] || '#777' }}
    >
      {type}
    </span>
  );
}

function SpriteCell({ species, ringColor, dim = false, label }: { species: PokemonSpecies; ringColor: string | null; dim?: boolean; label?: string }) {
  return (
    <div
      className="relative shrink-0"
      title={label ? `${species.name} — ${label}` : species.name}
    >
      <div
        className={`rounded-full p-[2px] transition-opacity ${dim ? 'opacity-25' : ''}`}
        style={{ backgroundColor: ringColor ?? 'transparent' }}
      >
        <div className="bg-background rounded-full">
          <PokemonMiniSprite spriteId={speciesToSpriteId(species.name)} name={species.name} size={28} />
        </div>
      </div>
    </div>
  );
}

interface TypeCoverageProps {
  team: { species: PokemonSpecies; moves: string[]; ability?: string }[];
}

export function TypeCoverage({ team }: TypeCoverageProps) {
  const { defenseRows, offenseRows, problems } = useMemo(() => {
    const defenseRows = ALL_TYPES.map((atkType) => {
      const cells: DefenseCell[] = team.map(({ species, ability }) => {
        const mult = getDefensiveMultiplier(species.types, atkType, ability);
        const status: DefenseStatus =
          mult === 0 ? 'immune' : mult > 1 ? 'weak' : mult < 1 ? 'resist' : 'neutral';
        return { species, status, mult };
      });
      const weak = cells.filter(c => c.status === 'weak').length;
      const resist = cells.filter(c => c.status === 'resist').length;
      const immune = cells.filter(c => c.status === 'immune').length;
      return { type: atkType, cells, weak, resist, immune };
    });

    const offenseRows = ALL_TYPES.map((defType) => {
      const cells: OffenseCell[] = team.map(({ species, moves: moveNames }) => {
        let best: OffenseStatus = 'none';
        let bestMoveType: string | null = null;
        for (const moveName of moveNames) {
          const moveType = getMoveType(species.id, moveName);
          if (!moveType) continue;
          const mult = getOffensiveMultiplier(moveType, defType);
          if (mult > 1) {
            const isStab = species.types.includes(moveType);
            if (isStab) { best = 'stab-se'; bestMoveType = moveType; break; }
            best = 'se'; bestMoveType = moveType;
          }
        }
        return { species, status: best, moveType: bestMoveType };
      });
      const covered = cells.filter(c => c.status !== 'none').length;
      const stab = cells.filter(c => c.status === 'stab-se').length;
      return { type: defType, cells, covered, stab };
    });

    const dangers = defenseRows
      .filter(r => r.weak - r.resist - r.immune >= 2)
      .sort((a, b) => (b.weak - b.resist - b.immune) - (a.weak - a.resist - a.immune));
    const uncovered = offenseRows.filter(r => r.covered === 0);

    return { defenseRows, offenseRows, problems: { dangers, uncovered } };
  }, [team]);

  if (team.length === 0) return null;

  const defenseColor = (s: DefenseStatus) => {
    if (s === 'weak') return '#ef4444';
    if (s === 'immune') return '#a78bfa';
    if (s === 'resist') return '#60a5fa';
    return null;
  };
  const offenseColor = (s: OffenseStatus) => {
    if (s === 'stab-se') return '#d4a017';
    if (s === 'se') return '#60a5fa';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Problem summary at the top */}
      {(problems.dangers.length > 0 || problems.uncovered.length > 0) && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          {problems.dangers.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-red-600">Defensive holes:</span>
                {problems.dangers.map(d => (
                  <span key={d.type} className="inline-flex items-center gap-1">
                    <TypeBadge type={d.type} size="sm" />
                    <span className="text-red-500 font-mono tabular-nums">{d.weak}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {problems.uncovered.length > 0 && (
            <div className="flex items-start gap-2">
              <ShieldOff className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-amber-600">No SE coverage on:</span>
                {problems.uncovered.map(u => (
                  <TypeBadge key={u.type} type={u.type} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Defense + Offense grids — single column on small screens, side-by-side on lg+.
          @container makes this responsive to the Dialog width rather than the viewport,
          so it adapts cleanly to the wider modal. */}
      <div className="@container">
      <div className="grid grid-cols-1 @[820px]:grid-cols-2 gap-4">

      {/* Defense grid */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team Defense</h3>
          <span className="text-[10px] text-muted-foreground">attack ↓ · weak / resist / immune</span>
        </div>
        <div className="space-y-1">
          {defenseRows.map(({ type, cells, weak, resist, immune }) => (
            <div key={type} className="flex items-center gap-2 py-0.5">
              <TypeBadge type={type} />
              <div className="flex gap-1 flex-1">
                {cells.map((c, i) => (
                  <SpriteCell
                    key={i}
                    species={c.species}
                    ringColor={defenseColor(c.status)}
                    dim={c.status === 'neutral'}
                    label={c.status === 'weak' ? `weak (${c.mult}×)` : c.status === 'resist' ? `resist (${c.mult}×)` : c.status === 'immune' ? 'immune' : 'neutral'}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] tabular-nums shrink-0 w-[72px] justify-end">
                {weak > 0 && <span className="text-red-500 font-semibold">{weak}w</span>}
                {resist > 0 && <span className="text-blue-500">{resist}r</span>}
                {immune > 0 && <span className="text-violet-500">{immune}i</span>}
                {weak === 0 && resist === 0 && immune === 0 && <span className="text-muted-foreground/50">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offense grid */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Move Coverage</h3>
          <span className="text-[10px] text-muted-foreground">vs ↓ · STAB / non-STAB SE</span>
        </div>
        <div className="space-y-1">
          {offenseRows.map(({ type, cells, covered, stab }) => (
            <div key={type} className="flex items-center gap-2 py-0.5">
              <TypeBadge type={type} />
              <div className="flex gap-1 flex-1">
                {cells.map((c, i) => (
                  <SpriteCell
                    key={i}
                    species={c.species}
                    ringColor={offenseColor(c.status)}
                    dim={c.status === 'none'}
                    label={c.status === 'stab-se' ? `STAB ${c.moveType}` : c.status === 'se' ? `${c.moveType} SE` : 'no SE move'}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] tabular-nums shrink-0 w-[72px] justify-end">
                {stab > 0 && <span className="font-semibold" style={{ color: '#d4a017' }}>{stab}★</span>}
                {covered - stab > 0 && <span className="text-blue-500">{covered - stab}</span>}
                {covered === 0 && <span className="text-muted-foreground/50">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>{/* close grid */}
      </div>{/* close @container */}

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        <span className="text-red-400">Red ring</span> = weak ·
        <span className="text-blue-400 ml-1">Blue ring</span> = resist / SE move ·
        <span className="text-violet-400 ml-1">Purple ring</span> = immune ·
        <span className="ml-1" style={{ color: '#d4a017' }}>Gold ring</span> = STAB SE
      </p>
    </div>
  );
}
