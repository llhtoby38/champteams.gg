'use client';

import { useState } from 'react';
import { X, Plus, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0', Electric: '#F7D02C',
  Grass: '#7AC74C', Ice: '#96D9D6', Fighting: '#C22E28', Poison: '#A33EA1',
  Ground: '#E2BF65', Flying: '#A98FF3', Psychic: '#F95587', Bug: '#A6B91A',
  Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC', Dark: '#705746',
  Steel: '#B7B7CE', Fairy: '#D685AD',
};

const STAT_NAMES: Record<string, string> = {
  hp: 'HP', atk: 'Att', def: 'Def', spa: 'Sp.A', spd: 'Sp.D', spe: 'Spe',
};

// Type effectiveness chart (simplified — weaknesses/resistances)
const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal: { Fighting: 2, Ghost: 0 },
  Fire: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Ice: 0.5, Bug: 0.5, Steel: 0.5, Fairy: 0.5 },
  Water: { Electric: 2, Grass: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
  Electric: { Ground: 2, Electric: 0.5, Flying: 0.5, Steel: 0.5 },
  Grass: { Fire: 2, Ice: 2, Poison: 2, Flying: 2, Bug: 2, Water: 0.5, Electric: 0.5, Grass: 0.5, Ground: 0.5 },
  Ice: { Fire: 2, Fighting: 2, Rock: 2, Steel: 2, Ice: 0.5 },
  Fighting: { Flying: 2, Psychic: 2, Fairy: 2, Bug: 0.5, Rock: 0.5, Dark: 0.5 },
  Poison: { Ground: 2, Psychic: 2, Grass: 0.5, Fighting: 0.5, Poison: 0.5, Bug: 0.5, Fairy: 0.5 },
  Ground: { Water: 2, Grass: 2, Ice: 2, Electric: 0, Poison: 0.5, Rock: 0.5 },
  Flying: { Electric: 2, Ice: 2, Rock: 2, Ground: 0, Grass: 0.5, Fighting: 0.5, Bug: 0.5 },
  Psychic: { Bug: 2, Ghost: 2, Dark: 2, Fighting: 0.5, Psychic: 0.5 },
  Bug: { Fire: 2, Flying: 2, Rock: 2, Grass: 0.5, Fighting: 0.5, Ground: 0.5 },
  Rock: { Water: 2, Grass: 2, Fighting: 2, Ground: 2, Steel: 2, Normal: 0.5, Fire: 0.5, Poison: 0.5, Flying: 0.5 },
  Ghost: { Ghost: 2, Dark: 2, Normal: 0, Fighting: 0, Poison: 0.5, Bug: 0.5 },
  Dragon: { Ice: 2, Dragon: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Grass: 0.5 },
  Dark: { Fighting: 2, Bug: 2, Fairy: 2, Psychic: 0, Ghost: 0.5, Dark: 0.5 },
  Steel: { Fire: 2, Fighting: 2, Ground: 2, Poison: 0, Normal: 0.5, Grass: 0.5, Ice: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 0.5, Dragon: 0.5, Steel: 0.5, Fairy: 0.5 },
  Fairy: { Poison: 2, Steel: 2, Dragon: 0, Fighting: 0.5, Bug: 0.5, Dark: 0.5 },
};

function getMatchups(types: string[]) {
  const multipliers: Record<string, number> = {};
  const allTypes = Object.keys(TYPE_CHART);
  for (const attackType of allTypes) {
    let mult = 1;
    for (const defType of types) {
      const chart = TYPE_CHART[defType];
      if (chart && chart[attackType] !== undefined) {
        mult *= chart[attackType];
      }
    }
    if (mult !== 1) multipliers[attackType] = mult;
  }
  const x4 = Object.entries(multipliers).filter(([, v]) => v >= 4).map(([k]) => k);
  const x2 = Object.entries(multipliers).filter(([, v]) => v === 2).map(([k]) => k);
  const half = Object.entries(multipliers).filter(([, v]) => v === 0.5).map(([k]) => k);
  const quarter = Object.entries(multipliers).filter(([, v]) => v === 0.25).map(([k]) => k);
  const immune = Object.entries(multipliers).filter(([, v]) => v === 0).map(([k]) => k);
  return { x4, x2, half, quarter, immune };
}

interface PokemonData {
  id: string;
  name: string;
  types: string[];
  spriteId: string;
  baseStats?: Record<string, number>;
  metaScore: number;
  tournamentUsage: number | null;
  winRate: number | null;
  moves?: { name: string; percent: number; type?: string | null; category?: string | null }[] | null;
  items?: { name: string; percent: number }[] | null;
  usageAbilities?: { name: string; percent: number }[] | null;
  spreads?: { nature: string; evs: string; percent: number }[] | null;
}

interface Props {
  pokemon: PokemonData;
  onClose: () => void;
  onAddToBuilder?: (spreadIndex: number) => void;
  onAddToMetaThreats?: (spreadIndex: number) => void;
}

export function PokemonDetailPopup({ pokemon: p, onClose, onAddToBuilder, onAddToMetaThreats }: Props) {
  const [selectedSpread, setSelectedSpread] = useState(0);
  const matchups = getMatchups(p.types);
  const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const topSpread = p.spreads?.[selectedSpread];

  // Parse nature boosts
  const NATURE_BOOSTS: Record<string, { plus: string | null; minus: string | null }> = {
    Adamant: { plus: 'atk', minus: 'spa' }, Jolly: { plus: 'spe', minus: 'spa' },
    Modest: { plus: 'spa', minus: 'atk' }, Timid: { plus: 'spe', minus: 'atk' },
    Bold: { plus: 'def', minus: 'atk' }, Impish: { plus: 'def', minus: 'spa' },
    Calm: { plus: 'spd', minus: 'atk' }, Careful: { plus: 'spd', minus: 'spa' },
    Brave: { plus: 'atk', minus: 'spe' }, Quiet: { plus: 'spa', minus: 'spe' },
    Relaxed: { plus: 'def', minus: 'spe' }, Sassy: { plus: 'spd', minus: 'spe' },
    Naive: { plus: 'spe', minus: 'spd' }, Hasty: { plus: 'spe', minus: 'def' },
    Lonely: { plus: 'atk', minus: 'def' }, Mild: { plus: 'spa', minus: 'def' },
    Naughty: { plus: 'atk', minus: 'spd' }, Rash: { plus: 'spa', minus: 'spd' },
    Gentle: { plus: 'spd', minus: 'def' }, Lax: { plus: 'def', minus: 'spd' },
  };
  const nature = NATURE_BOOSTS[topSpread?.nature || ''] || { plus: null, minus: null };

  // Parse EVs from spread string
  function parseEvs(evStr?: string): Record<string, number> {
    if (!evStr) return {};
    const result: Record<string, number> = {};
    const map: Record<string, string> = { HP: 'hp', Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe' };
    for (const part of evStr.split('/').map(s => s.trim())) {
      const m = part.match(/(\d+)\s+(\w+)/);
      if (m) { const stat = map[m[2]]; if (stat) result[stat] = parseInt(m[1]); }
    }
    return result;
  }

  const evs = parseEvs(topSpread?.evs);

  // Calc Lv50 stat
  function calcStat(stat: string, base: number, ev: number): number {
    const iv = 31;
    if (stat === 'hp') return base === 1 ? 1 : Math.floor((2 * base + iv + Math.floor(ev / 4)) * 50 / 100) + 50 + 10;
    let val = Math.floor((2 * base + iv + Math.floor(ev / 4)) * 50 / 100) + 5;
    if (nature.plus === stat) val = Math.floor(val * 1.1);
    if (nature.minus === stat) val = Math.floor(val * 0.9);
    return val;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <img
            src={`https://play.pokemonshowdown.com/sprites/ani/${p.spriteId}.gif`}
            alt={p.name}
            className="w-16 h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://play.pokemonshowdown.com/sprites/dex/${p.spriteId}.png`;
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{p.name}</h2>
            <div className="flex gap-1 mt-0.5">
              {p.types.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-[1px] rounded text-white font-medium" style={{ background: TYPE_COLORS[t] || '#6b7280' }}>{t}</span>
              ))}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
              <span>Usage: {p.tournamentUsage?.toFixed(1)}%</span>
              <span>WR: {p.winRate?.toFixed(1)}%</span>
              <span className="font-bold text-foreground">Score: {p.metaScore.toFixed(1)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Top Set */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-muted-foreground">Item:</span> <span className="font-medium">{p.items?.[0]?.name || '—'}</span></div>
            <div><span className="text-muted-foreground">Ability:</span> <span className="font-medium">{p.usageAbilities?.[0]?.name || '—'}</span></div>
          </div>

          {/* Spread Selector */}
          {p.spreads && p.spreads.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Spread</div>
              <div className="flex gap-1 flex-wrap">
                {p.spreads.slice(0, 5).map((sp, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSpread(i)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      selectedSpread === i
                        ? 'border-[#d4a017] bg-[#d4a017]/10 text-[#d4a017] font-medium'
                        : 'border-border hover:border-[#d4a017]/50'
                    }`}
                  >
                    {sp.nature} ({sp.percent}%)
                  </button>
                ))}
              </div>
              {topSpread && (
                <div className="text-[10px] text-muted-foreground mt-1">{topSpread.evs}</div>
              )}
            </div>
          )}

          {/* Stats Table */}
          {p.baseStats && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Stats (Lv. 50)</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[9px] text-muted-foreground">
                    <th className="text-left w-10">Stat</th>
                    <th className="text-right w-8">Base</th>
                    <th className="text-right w-8">EV</th>
                    <th className="text-right w-10">Lv50</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => {
                    const base = p.baseStats?.[s] ?? 0;
                    const ev = evs[s] || 0;
                    const final = calcStat(s, base, ev);
                    const isPlus = nature.plus === s;
                    const isMinus = nature.minus === s;
                    return (
                      <tr key={s} className={isPlus ? 'text-red-500' : isMinus ? 'text-blue-500' : ''}>
                        <td className="font-medium">{STAT_NAMES[s]}{isPlus ? '+' : isMinus ? '-' : ''}</td>
                        <td className="text-right tabular-nums">{base}</td>
                        <td className="text-right tabular-nums">{ev}</td>
                        <td className="text-right tabular-nums font-semibold">{final}</td>
                        <td className="pl-1.5">
                          <div className="h-1.5 bg-muted rounded overflow-hidden">
                            <div className="h-full rounded" style={{
                              width: `${Math.min((final / (s === 'hp' ? 255 : 200)) * 100, 100)}%`,
                              backgroundColor: isPlus ? '#ef4444' : isMinus ? '#3b82f6' : '#9ca3af',
                            }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Moves */}
          {p.moves && p.moves.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Top Moves</div>
              <div className="space-y-1">
                {p.moves.slice(0, 6).map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1">
                    <span className="text-[11px] font-medium flex-1">{m.name}</span>
                    {m.type && <img src={`https://play.pokemonshowdown.com/sprites/types/${m.type}.png`} alt={m.type} width={32} height={14} className="shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    {m.category && <img src={`https://play.pokemonshowdown.com/sprites/categories/${m.category}.png`} alt={m.category} width={32} height={14} className="shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span className="text-[10px] font-mono text-muted-foreground">{m.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items & Abilities */}
          <div className="grid grid-cols-2 gap-3">
            {p.items && p.items.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Items</div>
                <div className="text-[11px] space-y-0.5">
                  {p.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {p.usageAbilities && p.usageAbilities.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Abilities</div>
                <div className="text-[11px] space-y-0.5">
                  {p.usageAbilities.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground">{a.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Type Matchups */}
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Type Matchups</div>
            <div className="space-y-1">
              {matchups.x4.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-red-500 font-bold w-6">4x</span>
                  {matchups.x4.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={32} height={14} />)}
                </div>
              )}
              {matchups.x2.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-red-400 w-6">2x</span>
                  {matchups.x2.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={32} height={14} />)}
                </div>
              )}
              {matchups.half.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-green-500 w-6">½x</span>
                  {matchups.half.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={32} height={14} />)}
                </div>
              )}
              {matchups.quarter.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-green-600 font-bold w-6">¼x</span>
                  {matchups.quarter.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={32} height={14} />)}
                </div>
              )}
              {matchups.immune.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-blue-400 font-bold w-6">0x</span>
                  {matchups.immune.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={32} height={14} />)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {onAddToBuilder && (
              <Button size="sm" className="flex-1 gap-1.5 bg-[#d4a017] hover:bg-[#b8891a] text-black" onClick={() => onAddToBuilder(selectedSpread)}>
                <Plus className="w-3.5 h-3.5" /> Add to Builder
              </Button>
            )}
            {onAddToMetaThreats && (
              <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onAddToMetaThreats(selectedSpread)}>
                <Shield className="w-3.5 h-3.5" /> Add to Meta Threats
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
