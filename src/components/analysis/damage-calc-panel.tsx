'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import type { MetaThreat, CalcConditions } from '@/types/calc';
import { DEFAULT_CALC_CONDITIONS } from '@/types/calc';
import type { TeamSlotData } from '@/hooks/use-team';
import type { StatsTable } from '@/types/pokemon';
import { STAT_NAMES } from '@/types/pokemon';
import { calcStat, getNatureMod, MAX_STAT_SP, MAX_TOTAL_SP } from '@/lib/pokemon/stats';
import { calculateBulkDamage } from '@/lib/calc/damage-client';
import { TYPE_COLORS, speciesToSpriteId } from '@/lib/sprites';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { CalcConditionsDialog } from './calc-conditions-dialog';
import { Settings2, Swords, Shield, Gauge, SlidersHorizontal, Filter, Search, X, Minus, Plus, Pencil } from 'lucide-react';
import { getTypeMatchups } from '@/lib/pokemon/type-weakness';

interface CalcResult { move: string; minPercent: number; maxPercent: number; }

interface DamageCalcPanelProps {
  selectedSlot: NonNullable<TeamSlotData> | null;
  /** Override species for mega form calcs */
  displaySpeciesName?: string;
  /** Full species data for mega form (has correct base stats) */
  displaySpecies?: { baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } } | null;
  metaThreats: MetaThreat[];
  onEditThreats: () => void;
  /** Update a single threat (used by inline SP editing in popup) */
  onUpdateThreat?: (id: string, patch: Partial<MetaThreat>) => void;
  /** Open the full threat editor focused on a specific threat */
  onOpenThreatInEditor?: (id: string) => void;
  /** Lifted conditions state — if provided, uses external state instead of local */
  conditions?: CalcConditions;
  onConditionsChange?: (c: CalcConditions) => void;
}

type CalcMode = 'offensive' | 'defensive' | 'speed';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

export function DamageCalcPanel({ selectedSlot, displaySpeciesName, displaySpecies, metaThreats, onEditThreats, onUpdateThreat, onOpenThreatInEditor, conditions: externalConditions, onConditionsChange }: DamageCalcPanelProps) {
  // Results are tagged with the calcKey that produced them, so a re-render with
  // a new selectedSlot (before the microtask resolves) doesn't show old moves
  // attached to the new species header.
  const [offResults, setOffResults] = useState<{ key: string; data: { threat: string; results: CalcResult[] }[] }>({ key: '', data: [] });
  const [defResults, setDefResults] = useState<{ key: string; data: { threat: string; results: CalcResult[] }[] }>({ key: '', data: [] });
  const [loading, setLoading] = useState(false);
  const offRunRef = useRef(0);
  const defRunRef = useRef(0);
  const [mode, setMode] = useState<CalcMode>('offensive');
  const [localConditions, setLocalConditions] = useState<CalcConditions>({ ...DEFAULT_CALC_CONDITIONS });
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const conditions = externalConditions ?? localConditions;
  const setConditions = onConditionsChange ?? setLocalConditions;

  // Filter state (search + types + mega-only) for meta threat display
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showMegasOnly, setShowMegasOnly] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter popup on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [filterOpen]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes(new Set());
    setShowMegasOnly(false);
  };
  const activeFilterCount = (searchQuery.trim() ? 1 : 0) + selectedTypes.size + (showMegasOnly ? 1 : 0);

  // Filtered meta threats — filter only at display time, calcs still run on full list
  const filteredThreats = useMemo(() => {
    if (activeFilterCount === 0) return metaThreats;
    const q = searchQuery.trim().toLowerCase();
    return metaThreats.filter(t => {
      if (q && !t.species.toLowerCase().includes(q)) return false;
      if (showMegasOnly && !/-Mega(-[XYZ])?$/i.test(t.species)) return false;
      if (selectedTypes.size > 0) {
        const cached = threatDataCache.get(t.species);
        // Strict: if type data is missing or no overlap with selected types, hide.
        // Letting cache misses pass through caused "more matches than expected".
        if (!cached || !cached.types.some(tp => selectedTypes.has(tp))) return false;
      }
      return true;
    });
  }, [metaThreats, searchQuery, selectedTypes, showMegasOnly, activeFilterCount]);

  const visibleThreatSet = useMemo(() => new Set(filteredThreats.map(t => t.species)), [filteredThreats]);

  const speciesName = displaySpeciesName || selectedSlot?.species.name || '';

  // Stable serialized key that changes whenever any calc-relevant input changes.
  // This avoids stale object-reference comparisons in useEffect deps.
  const calcKey = useMemo(() => {
    if (!selectedSlot) return '';
    const { set } = selectedSlot;
    return JSON.stringify({
      species: speciesName,
      moves: set.moves,
      evs: set.evs,
      ivs: set.ivs,
      nature: set.nature,
      item: set.item,
      ability: set.ability,
      conditions,
      threats: metaThreats.map(t => `${t.species}|${t.item}|${t.nature}|${JSON.stringify(t.evs)}|${t.moves.join(',')}`),
    });
  }, [selectedSlot, speciesName, conditions, metaThreats]);

  // Offensive calcs — runs client-side, no API call
  useEffect(() => {
    if (!selectedSlot || !speciesName) { setOffResults({ key: calcKey, data: [] }); return; }
    const { set } = selectedSlot;
    const activeMoves = set.moves.filter(Boolean);
    if (activeMoves.length === 0) { setOffResults({ key: calcKey, data: [] }); return; }

    const myRun = ++offRunRef.current;
    setLoading(true);
    // Run calcs in a microtask to avoid blocking the UI
    Promise.resolve().then(() => {
      if (myRun !== offRunRef.current) return;
      const fieldOpts = {
        gameType: 'Doubles' as const,
        weather: conditions.weather || undefined,
        terrain: conditions.terrain || undefined,
        attackerSide: conditions.attackerSide,
        defenderSide: conditions.defenderSide,
      };

      const results = metaThreats.map((threat) => {
        try {
          const data = calculateBulkDamage(
            { species: speciesName, ability: set.ability, item: set.item, nature: set.nature, evs: set.evs, boosts: conditions.attackerBoosts, status: conditions.attackerStatus || undefined },
            { species: threat.species, item: threat.item, nature: threat.nature, evs: threat.evs, ability: threat.ability, boosts: conditions.defenderBoosts, status: conditions.defenderStatus || undefined },
            activeMoves,
            fieldOpts,
          );
          return { threat: threat.species, results: data.map(d => ({ move: d.move, minPercent: d.minPercent, maxPercent: d.maxPercent })) };
        } catch { return { threat: threat.species, results: [] }; }
      });

      setOffResults({ key: calcKey, data: results });
      setLoading(false);
    });
  }, [calcKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Defensive calcs (threat attacks us) — runs client-side
  useEffect(() => {
    if (!selectedSlot || !speciesName) { setDefResults({ key: calcKey, data: [] }); return; }
    const { set } = selectedSlot;

    const myRun = ++defRunRef.current;
    setLoading(true);
    Promise.resolve().then(() => {
      if (myRun !== defRunRef.current) return;
      const results = metaThreats.map((threat) => {
        const threatMoves = threat.moves.filter(Boolean);
        if (threatMoves.length === 0) return { threat: threat.species, results: [] };
        try {
          const data = calculateBulkDamage(
            { species: threat.species, item: threat.item, nature: threat.nature, evs: threat.evs, ability: threat.ability, boosts: conditions.defenderBoosts, status: conditions.defenderStatus || undefined },
            { species: speciesName, ability: set.ability, item: set.item, nature: set.nature, evs: set.evs, boosts: conditions.attackerBoosts, status: conditions.attackerStatus || undefined },
            threatMoves,
            {
              gameType: 'Doubles',
              weather: conditions.weather || undefined,
              terrain: conditions.terrain || undefined,
              attackerSide: conditions.defenderSide,
              defenderSide: conditions.attackerSide,
            },
          );
          return { threat: threat.species, results: data.map(d => ({ move: d.move, minPercent: d.minPercent, maxPercent: d.maxPercent })) };
        } catch { return { threat: threat.species, results: [] }; }
      });

      setDefResults({ key: calcKey, data: results });
      setLoading(false);
    });
  }, [calcKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only show results that came from the *current* calcKey. When the user
  // switches slots, offResults still holds the previous slot's data until the
  // microtask runs; gating on key prevents stale move labels from rendering
  // under the new species.
  const visibleOffResults = useMemo(
    () => offResults.key === calcKey ? offResults.data.filter(r => visibleThreatSet.has(r.threat)) : [],
    [offResults, calcKey, visibleThreatSet],
  );
  const visibleDefResults = useMemo(
    () => defResults.key === calcKey ? defResults.data.filter(r => visibleThreatSet.has(r.threat)) : [],
    [defResults, calcKey, visibleThreatSet],
  );

  const hasActiveConditions = conditions.weather !== '' || conditions.terrain !== '' ||
    Object.keys(conditions.attackerBoosts).length > 0 || conditions.attackerStatus !== '' ||
    Object.values(conditions.attackerSide).some(Boolean) ||
    Object.keys(conditions.defenderBoosts).length > 0 || conditions.defenderStatus !== '' ||
    Object.values(conditions.defenderSide).some(Boolean);

  if (!selectedSlot) {
    return null;
  }

  return (
    <div className="@container">
      {/* Header + Mode tabs — sticky, owns its own padding so top-0 = true container top */}
      <div className="sticky top-0 z-10 px-3 pt-2 pb-2 space-y-1.5 border-b bg-background">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold truncate">{speciesName} vs Meta</h3>
          <div className="flex items-center gap-2 shrink-0">
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className={`text-xs flex items-center gap-1 hover:text-foreground ${activeFilterCount > 0 ? 'text-[#d4a017] font-medium' : 'text-muted-foreground'}`}
              >
                <Filter className="h-3.5 w-3.5" /> Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {filterOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-30 bg-popover border rounded-lg shadow-xl p-3 w-[min(320px,calc(100vw-1.5rem))] space-y-2.5">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search threats…"
                      autoFocus
                      className="w-full h-8 pl-8 pr-7 text-xs border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5" aria-label="Clear search">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {/* Type chips */}
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Types</div>
                    <div className="flex flex-wrap gap-1">
                      {ALL_TYPES.map(type => {
                        const active = selectedTypes.has(type);
                        return (
                          <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide transition-all ${active ? 'text-white shadow-sm scale-105' : 'text-white/70 opacity-40 hover:opacity-75'}`}
                            style={{ backgroundColor: TYPE_COLORS[type] || '#777' }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Mega toggle + clear */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t">
                    <button
                      onClick={() => setShowMegasOnly(v => !v)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${showMegasOnly ? 'bg-purple-600 text-white border-purple-600' : 'bg-background text-muted-foreground border-border hover:border-purple-400'}`}
                    >
                      Megas only
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{filteredThreats.length}/{metaThreats.length}</span>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-[11px] text-destructive hover:underline flex items-center gap-0.5">
                          <X className="h-3 w-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setConditionsOpen(true)} className={`text-xs flex items-center gap-1 hover:text-foreground ${hasActiveConditions ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Conditions{hasActiveConditions ? ' *' : ''}
            </button>
            <button onClick={onEditThreats} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Settings2 className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode('offensive')}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${mode === 'offensive' ? 'bg-green-600 text-white border-green-600' : 'border-border hover:bg-accent'}`}>
            <Swords className="h-3 w-3" /> Offensive
          </button>
          <button onClick={() => setMode('defensive')}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${mode === 'defensive' ? 'bg-red-600 text-white border-red-600' : 'border-border hover:bg-accent'}`}>
            <Shield className="h-3 w-3" /> Defensive
          </button>
          <button onClick={() => setMode('speed')}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${mode === 'speed' ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:bg-accent'}`}>
            <Gauge className="h-3 w-3" /> Speed
          </button>
        </div>
      </div>

      {/* Active conditions summary */}
      {hasActiveConditions && (
        <div className="px-3 pt-1.5 pb-1">
          <div className="flex flex-wrap gap-1">
            {conditions.weather && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{conditions.weather}</span>}
            {conditions.terrain && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">{conditions.terrain} Terrain</span>}
            {conditions.attackerStatus && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">You: {conditions.attackerStatus}</span>}
            {conditions.defenderStatus && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Foe: {conditions.defenderStatus}</span>}
            {Object.entries(conditions.attackerBoosts).map(([k, v]) => v !== 0 && (
              <span key={`ab-${k}`} className={`text-[9px] px-1.5 py-0.5 rounded ${(v as number) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                You: {k} {(v as number) > 0 ? '+' : ''}{v as number}
              </span>
            ))}
            {Object.entries(conditions.defenderBoosts).map(([k, v]) => v !== 0 && (
              <span key={`db-${k}`} className={`text-[9px] px-1.5 py-0.5 rounded ${(v as number) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Foe: {k} {(v as number) > 0 ? '+' : ''}{v as number}
              </span>
            ))}
            {conditions.attackerSide.isHelpingHand && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Helping Hand</span>}
            {conditions.attackerSide.isReflect && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Your Reflect</span>}
            {conditions.attackerSide.isLightScreen && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Your L.Screen</span>}
            {conditions.attackerSide.isAuroraVeil && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">Your A.Veil</span>}
            {conditions.defenderSide.isReflect && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Foe Reflect</span>}
            {conditions.defenderSide.isLightScreen && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Foe L.Screen</span>}
            {conditions.defenderSide.isAuroraVeil && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">Foe A.Veil</span>}
          </div>
        </div>
      )}

      {/* Content based on mode */}
      <div className="px-3 pt-2 pb-3">
        {activeFilterCount > 0 && filteredThreats.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No threats match your filters.{' '}
            <button onClick={clearFilters} className="text-[#d4a017] hover:underline">Clear</button>
          </div>
        ) : mode === 'speed' ? (
          <SpeedView selectedSlot={selectedSlot} speciesName={speciesName} displaySpecies={displaySpecies} metaThreats={filteredThreats} conditions={conditions} onUpdateThreat={onUpdateThreat} onOpenThreatInEditor={onOpenThreatInEditor} />
        ) : (
          <DamageView
            mode={mode}
            results={mode === 'offensive' ? visibleOffResults : visibleDefResults}
            loading={loading}
            metaThreats={filteredThreats}
            activeMoves={selectedSlot.set.moves.filter(Boolean)}
            onUpdateThreat={onUpdateThreat}
            onOpenThreatInEditor={onOpenThreatInEditor}
          />
        )}
      </div>

      <CalcConditionsDialog
        open={conditionsOpen}
        onOpenChange={setConditionsOpen}
        conditions={conditions}
        onChange={setConditions}
      />
    </div>
  );
}

// ── Base stats + types cache for meta threats ─────────────────────────────
const threatDataCache = new Map<string, { baseStats: StatsTable; types: string[] }>();

function useThreatBaseStats(threats: MetaThreat[]) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unknown = threats.filter(t => t.species && !threatDataCache.has(t.species));
    if (unknown.length === 0) return;
    Promise.all(unknown.map(async (t) => {
      try {
        const res = await fetch(`/api/pokemon?q=${encodeURIComponent(t.species)}&limit=1`);
        const data = await res.json();
        if (data[0]?.baseStats) {
          threatDataCache.set(t.species, { baseStats: data[0].baseStats, types: data[0].types || [] });
        }
      } catch { /* ignore */ }
    })).then(() => setTick(t => t + 1));
  }, [threats]);
}

// ── Stat popup shown on hover/long-press ──────────────────────────────────

function ThreatStatPopup({ threat, baseStats, types, onUpdate, onOpenInEditor }: {
  threat: MetaThreat;
  baseStats: StatsTable | null;
  types: string[];
  onUpdate?: (id: string, patch: Partial<MetaThreat>) => void;
  onOpenInEditor?: (id: string) => void;
}) {
  const matchups = types.length > 0 ? getTypeMatchups(types) : null;
  const nature = getNatureMod(threat.nature);
  const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as (keyof StatsTable)[];
  const editable = Boolean(onUpdate);

  const totalSp = stats.reduce((acc, s) => acc + (threat.evs[s] ?? 0), 0);
  const remainingSp = MAX_TOTAL_SP - totalSp;

  const setSp = (s: keyof StatsTable, next: number) => {
    if (!onUpdate) return;
    const current = threat.evs[s] ?? 0;
    const perStatClamped = Math.max(0, Math.min(MAX_STAT_SP, next));
    const otherTotal = totalSp - current;
    const totalClamped = Math.max(0, Math.min(MAX_TOTAL_SP - otherTotal, perStatClamped));
    if (totalClamped === current) return;
    onUpdate(threat.id, { evs: { ...threat.evs, [s]: totalClamped } });
  };

  return (
    <div className="p-2 space-y-1.5 min-w-[220px]">
      <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1">
        <span className="text-[11px] font-semibold truncate">{threat.species}</span>
        {onOpenInEditor && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenInEditor(threat.id); }}
            className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded border hover:bg-accent shrink-0"
            title="Open in meta threat editor"
          >
            <Pencil className="h-2.5 w-2.5" /> Edit
          </button>
        )}
      </div>
      {threat.item && <div className="text-[9px] text-muted-foreground">Item: {threat.item}</div>}
      {threat.ability && <div className="text-[9px] text-muted-foreground">Ability: {threat.ability}</div>}
      <div className="text-[9px] text-muted-foreground flex items-center justify-between">
        <span>Nature: {threat.nature}</span>
        {editable && (
          <span className={remainingSp < 0 ? 'text-red-500' : remainingSp === 0 ? 'text-amber-600' : ''}>
            SP {totalSp}/{MAX_TOTAL_SP}
          </span>
        )}
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium w-10">Stat</th>
            <th className="text-right font-medium w-8">Base</th>
            <th className="text-center font-medium">SP</th>
            <th className="text-right font-medium w-8">Lv50</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => {
            const base = baseStats?.[s] ?? 0;
            const sp = threat.evs[s] ?? 0;
            const final = baseStats ? calcStat(s, base, sp, nature) : 0;
            const isPlus = nature.plus === s;
            const isMinus = nature.minus === s;
            const maxBar = s === 'hp' ? 255 : 200;
            const canInc = sp < MAX_STAT_SP && remainingSp > 0;
            const canDec = sp > 0;
            return (
              <tr key={s} className={isPlus ? 'text-red-500' : isMinus ? 'text-blue-500' : ''}>
                <td className="font-medium py-0.5">{STAT_NAMES[s].slice(0, 3)}{isPlus ? '+' : isMinus ? '-' : ''}</td>
                <td className="text-right tabular-nums">{base || '—'}</td>
                <td className="py-0.5">
                  {editable ? (
                    <div
                      className="flex items-center justify-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSp(s, sp - 4); }}
                        disabled={!canDec}
                        className="h-6 w-6 sm:h-4 sm:w-4 flex items-center justify-center rounded border text-[10px] hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent touch-manipulation"
                        aria-label={`Decrease ${STAT_NAMES[s]} SP`}
                      ><Minus className="h-3 w-3 sm:h-2.5 sm:w-2.5" /></button>
                      <input
                        type="number"
                        min={0}
                        max={MAX_STAT_SP}
                        value={sp}
                        onChange={(e) => setSp(s, parseInt(e.target.value, 10) || 0)}
                        className="w-8 h-6 sm:w-7 sm:h-4 text-center tabular-nums bg-transparent border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSp(s, sp + 4); }}
                        disabled={!canInc}
                        className="h-6 w-6 sm:h-4 sm:w-4 flex items-center justify-center rounded border text-[10px] hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent touch-manipulation"
                        aria-label={`Increase ${STAT_NAMES[s]} SP`}
                      ><Plus className="h-3 w-3 sm:h-2.5 sm:w-2.5" /></button>
                    </div>
                  ) : (
                    <div className="text-right tabular-nums">{sp}</div>
                  )}
                </td>
                <td className="text-right tabular-nums font-semibold">{baseStats ? final : '—'}</td>
                <td className="pl-1.5">
                  <div className="h-1.5 bg-muted rounded overflow-hidden w-full">
                    <div className="h-full rounded" style={{
                      width: `${baseStats ? Math.min((final / maxBar) * 100, 100) : 0}%`,
                      backgroundColor: isPlus ? '#ef4444' : isMinus ? '#3b82f6' : '#9ca3af',
                    }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {threat.moves.filter(Boolean).length > 0 && (
        <div className="border-t pt-1 mt-1">
          <div className="text-[9px] text-muted-foreground mb-0.5">Moves</div>
          <div className="text-[10px] space-y-0.5">
            {threat.moves.filter(Boolean).map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        </div>
      )}
      {matchups && (matchups.x4.length > 0 || matchups.x2.length > 0 || matchups.immune.length > 0) && (
        <div className="border-t pt-1 mt-1 space-y-0.5">
          {matchups.x4.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-red-500 font-semibold w-7 shrink-0">4x</span>
              {matchups.x4.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={28} height={12} />)}
            </div>
          )}
          {matchups.x2.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-red-400 w-7 shrink-0">2x</span>
              {matchups.x2.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={28} height={12} />)}
            </div>
          )}
          {matchups.half.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-green-500 w-7 shrink-0">½x</span>
              {matchups.half.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={28} height={12} />)}
            </div>
          )}
          {matchups.quarter.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-green-600 font-semibold w-7 shrink-0">¼x</span>
              {matchups.quarter.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={28} height={12} />)}
            </div>
          )}
          {matchups.immune.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-blue-400 font-semibold w-7 shrink-0">0x</span>
              {matchups.immune.map(t => <img key={t} src={`https://play.pokemonshowdown.com/sprites/types/${t}.png`} alt={t} width={28} height={12} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThreatSpriteWithPopup({ threat, size, onUpdate, onOpenInEditor }: {
  threat: MetaThreat;
  size: number;
  onUpdate?: (id: string, patch: Partial<MetaThreat>) => void;
  onOpenInEditor?: (id: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactingRef = useRef(false);
  const cached = threatDataCache.get(threat.species);
  const baseStats = cached?.baseStats ?? null;
  const types = cached?.types ?? [];

  const clearClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);
  const hasFocusInside = useCallback(() => {
    const active = document.activeElement;
    return !!(active && popupRef.current?.contains(active));
  }, []);
  const scheduleClose = useCallback(() => {
    clearClose();
    if (interactingRef.current || hasFocusInside()) return;
    closeTimer.current = setTimeout(() => {
      if (interactingRef.current || hasFocusInside()) return;
      setShow(false);
    }, 180);
  }, [clearClose, hasFocusInside]);
  const openPopup = useCallback(() => { clearClose(); setShow(true); }, [clearClose]);
  const closePopup = useCallback(() => {
    clearClose();
    setShow(false);
    interactingRef.current = false;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, [clearClose]);

  // Reposition the desktop popup after mount / on scroll / on resize, clamping to viewport.
  useLayoutEffect(() => {
    if (!show || isMobile) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const update = () => {
      const popup = popupRef.current;
      const rect = anchor.getBoundingClientRect();
      const pw = popup?.offsetWidth ?? 240;
      const ph = popup?.offsetHeight ?? 280;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const GAP = 8;
      const MARGIN = 8;

      let top = rect.top - ph - GAP;
      if (top < MARGIN) top = rect.bottom + GAP;
      top = Math.max(MARGIN, Math.min(top, vh - ph - MARGIN));

      const centerX = rect.left + rect.width / 2;
      let left = centerX - pw / 2;
      left = Math.max(MARGIN, Math.min(left, vw - pw - MARGIN));

      setPos({ top, left });
    };

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [show, isMobile, threat.evs, threat.item, threat.ability, threat.nature]);

  // Close on outside click (mobile bottom sheet uses its own overlay)
  useEffect(() => {
    if (!show || isMobile) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      closePopup();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [show, isMobile, closePopup]);

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={() => { setIsMobile(false); openPopup(); }}
        onMouseLeave={scheduleClose}
        onClick={(e) => { e.stopPropagation(); setIsMobile(false); openPopup(); }}
        onTouchStart={() => {
          setIsMobile(true);
          longPressTimer.current = setTimeout(() => setShow(true), 300);
        }}
        onTouchEnd={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        onTouchCancel={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        onTouchMove={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        className="cursor-pointer shrink-0"
      >
        <PokemonMiniSprite spriteId={speciesToSpriteId(threat.species)} name={threat.species} size={size} />
      </div>
      {/* Desktop: positioned tooltip, interactive */}
      {show && !isMobile && (
        <div
          ref={popupRef}
          onMouseEnter={clearClose}
          onMouseLeave={() => {
            if (!hasFocusInside()) interactingRef.current = false;
            scheduleClose();
          }}
          onFocusCapture={() => { interactingRef.current = true; clearClose(); }}
          onBlurCapture={(e) => {
            const next = e.relatedTarget as Node | null;
            if (next && popupRef.current?.contains(next)) return;
            interactingRef.current = false;
          }}
          onPointerDownCapture={() => { interactingRef.current = true; clearClose(); }}
          className="fixed z-[100] bg-popover border rounded-lg shadow-xl hidden sm:block"
          style={{
            top: pos.top,
            left: pos.left,
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 16px)',
            overflowY: 'auto',
          }}
        >
          <ThreatStatPopup
            threat={threat}
            baseStats={baseStats}
            types={types}
            onUpdate={onUpdate}
            onOpenInEditor={onOpenInEditor ? (id) => { closePopup(); onOpenInEditor(id); } : undefined}
          />
        </div>
      )}
      {/* Mobile: centered bottom sheet overlay */}
      {show && isMobile && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:hidden"
          onClick={closePopup}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full bg-popover border-t rounded-t-xl shadow-xl max-h-[80vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-popover border-b px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold">{threat.species}</span>
              <button
                onClick={closePopup}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent"
                aria-label="Close"
              ><X className="h-3 w-3" /> Close</button>
            </div>
            <ThreatStatPopup
              threat={threat}
              baseStats={baseStats}
              types={types}
              onUpdate={onUpdate}
              onOpenInEditor={onOpenInEditor ? (id) => { closePopup(); onOpenInEditor(id); } : undefined}
            />
          </div>
        </div>
      )}
    </>
  );
}

function DamageView({ mode, results, loading, metaThreats, activeMoves, onUpdateThreat, onOpenThreatInEditor }: {
  mode: 'offensive' | 'defensive'; results: { threat: string; results: CalcResult[] }[];
  loading: boolean; metaThreats: MetaThreat[]; activeMoves: string[];
  onUpdateThreat?: (id: string, patch: Partial<MetaThreat>) => void;
  onOpenThreatInEditor?: (id: string) => void;
}) {
  useThreatBaseStats(metaThreats);

  if (mode === 'offensive' && activeMoves.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-4">Add moves to see offensive calcs</div>;
  }

  return (
    <div className="relative grid grid-cols-1 gap-2 @[500px]:grid-cols-2 @[820px]:grid-cols-3">
      {loading && results.length === 0 && (
        <div className="col-span-full text-xs text-muted-foreground text-center py-4">Calculating...</div>
      )}
      {loading && results.length > 0 && (
        <div className="absolute top-1 right-1 text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded pointer-events-none">Recalculating…</div>
      )}
      {/*
        Iterate over metaThreats (stable identity) rather than results so the
        threat cards — and the hover popup mounted inside ThreatSpriteWithPopup —
        stay mounted across recalc cycles. Editing a threat's stats invalidates
        the calc key, which used to wipe results to [] and unmount the popup
        mid-keystroke. Now the card persists; only its bars swap.
      */}
      {metaThreats.map(threat => {
        const result = results.find(r => r.threat === threat.species);
        const valid = result?.results.filter(r => r.maxPercent > 0) ?? [];
        if (result && valid.length === 0) return null;
        return (
          <div key={threat.id} className="border rounded-lg p-2 text-xs">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ThreatSpriteWithPopup threat={threat} size={24} onUpdate={onUpdateThreat} onOpenInEditor={onOpenThreatInEditor} />
              <span className="font-medium text-[11px]">{threat.species}</span>
              {threat.role && (
                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {threat.role}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {valid.length > 0 ? valid.map((r, i) => {
                const barColor = mode === 'defensive'
                  ? (r.maxPercent >= 100 ? '#ef4444' : r.maxPercent >= 50 ? '#f59e0b' : '#d1d5db')
                  : (r.maxPercent >= 100 ? '#22c55e' : r.maxPercent >= 50 ? '#f59e0b' : '#d1d5db');
                const textColor = mode === 'defensive'
                  ? (r.maxPercent >= 100 ? 'text-red-600' : r.maxPercent >= 50 ? 'text-amber-600' : 'text-muted-foreground')
                  : (r.maxPercent >= 100 ? 'text-green-600' : r.maxPercent >= 50 ? 'text-amber-600' : 'text-muted-foreground');
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-20 truncate text-[10px]">{r.move}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${Math.min(r.maxPercent, 100)}%`, backgroundColor: barColor }} />
                    </div>
                    <span className={`w-16 text-right font-mono text-[10px] ${textColor}`}>
                      {r.minPercent.toFixed(0)}-{r.maxPercent.toFixed(0)}%
                    </span>
                  </div>
                );
              }) : (
                <div className="text-[10px] text-muted-foreground italic">Calculating…</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SPEED_ITEMS: Record<string, number> = {
  'Choice Scarf': 1.5,
  'Iron Ball': 0.5,
  'Macho Brace': 0.5,
  'Power Anklet': 0.5, 'Power Band': 0.5, 'Power Belt': 0.5,
  'Power Bracer': 0.5, 'Power Lens': 0.5, 'Power Weight': 0.5,
};

const WEATHER_SPEED_ABILITIES: Record<string, string> = {
  'Swift Swim': 'Rain',
  'Chlorophyll': 'Sun',
  'Sand Rush': 'Sand',
  'Slush Rush': 'Snow',
};

function applySpeedModifiers(baseSpeed: number, item: string, boostStage: number, status: string, tailwind: boolean, ability?: string, weather?: string): number {
  let speed = baseSpeed;
  const itemMult = SPEED_ITEMS[item] ?? 1;
  if (itemMult !== 1) speed = Math.floor(speed * itemMult);
  // Weather-based ability speed doubling
  if (ability && weather && WEATHER_SPEED_ABILITIES[ability] === weather) {
    speed = Math.floor(speed * 2);
  }
  if (boostStage > 0) speed = Math.floor(speed * (2 + boostStage) / 2);
  else if (boostStage < 0) speed = Math.floor(speed * 2 / (2 - boostStage));
  if (status === 'par') speed = Math.floor(speed * 0.5);
  if (tailwind) speed = Math.floor(speed * 2);
  return speed;
}

// Cache for base speed stats fetched from API
const baseSpeedCache = new Map<string, number>();

function SpeedView({ selectedSlot, speciesName, displaySpecies, metaThreats, conditions, onUpdateThreat, onOpenThreatInEditor }: {
  selectedSlot: NonNullable<TeamSlotData>; speciesName: string;
  displaySpecies?: { baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } } | null;
  metaThreats: MetaThreat[];
  conditions: CalcConditions;
  onUpdateThreat?: (id: string, patch: Partial<MetaThreat>) => void;
  onOpenThreatInEditor?: (id: string) => void;
}) {
  useThreatBaseStats(metaThreats);
  const { set, species } = selectedSlot;
  const nature = getNatureMod(set.nature);
  const baseSpe = displaySpecies?.baseStats.spe ?? species.baseStats.spe;
  const rawSpeed = calcStat('spe', baseSpe, set.evs.spe, nature);
  const mySpeed = applySpeedModifiers(rawSpeed, set.item, (conditions.attackerBoosts.spe as number) || 0, conditions.attackerStatus, conditions.attackerSide.isTailwind, set.ability, conditions.weather);

  // Fetch base speeds for threats not in cache
  const [, setTick] = useState(0);
  useEffect(() => {
    const unknown = metaThreats.filter(t => t.species && !KNOWN_BASE_SPEEDS[t.species] && !baseSpeedCache.has(t.species));
    if (unknown.length === 0) return;
    Promise.all(unknown.map(async (t) => {
      const id = t.species.toLowerCase().replace(/[^a-z0-9]/g, '');
      try {
        const res = await fetch(`/api/pokemon?q=${encodeURIComponent(t.species)}&limit=1`);
        const data = await res.json();
        if (data[0]?.baseStats?.spe != null) {
          baseSpeedCache.set(t.species, data[0].baseStats.spe);
        }
      } catch { /* ignore */ }
    })).then(() => setTick(t => t + 1)); // trigger re-render
  }, [metaThreats]);

  const entries: { name: string; speed: number; isMe: boolean; item?: string; color?: string; threat?: MetaThreat }[] = [];
  entries.push({ name: speciesName, speed: mySpeed, isMe: true });

  // Derive speeds from meta threats
  for (const threat of metaThreats) {
    if (!threat.species) continue;
    const threatNature = getNatureMod(threat.nature);
    const threatSpeSp = threat.evs.spe ?? 0;
    const knownBaseSpe = KNOWN_BASE_SPEEDS[threat.species] ?? baseSpeedCache.get(threat.species) ?? 80;
    const threatSpeed = calcStat('spe', knownBaseSpe, threatSpeSp, threatNature);
    const finalSpeed = applySpeedModifiers(threatSpeed, threat.item, (conditions.defenderBoosts.spe as number) || 0, conditions.defenderStatus, conditions.defenderSide.isTailwind, threat.ability, conditions.weather);
    entries.push({ name: threat.species, speed: finalSpeed, isMe: false, item: threat.item, threat });
  }

  // Trick Room: slowest first; normal: fastest first
  if (conditions.isTrickRoom) {
    entries.sort((a, b) => a.speed - b.speed);
  } else {
    entries.sort((a, b) => b.speed - a.speed);
  }
  const maxSpeed = Math.max(...entries.map(e => e.speed));

  return (
    <div className="grid grid-cols-1 @[500px]:grid-cols-2 @[820px]:grid-cols-3 gap-x-3 gap-y-0.5">
      {entries.map((entry) => (
        <div key={entry.isMe ? '__me__' : (entry.threat?.id ?? entry.name)}
          className={`flex items-center gap-1.5 text-[10px] py-1 px-1.5 rounded ${entry.isMe ? 'bg-primary/10 font-bold text-sm' : ''}`}>
          <span className="w-7 text-right font-mono tabular-nums">{entry.speed}</span>
          <div className="h-2 rounded flex-1" style={{
            width: `${(entry.speed / maxSpeed) * 100}%`,
            backgroundColor: entry.isMe ? '#d4a017' : '#d1d5db',
            opacity: entry.isMe ? 1 : 0.5,
          }} />
          <div className="flex items-center gap-1 shrink-0">
            {entry.threat ? (
              <ThreatSpriteWithPopup threat={entry.threat} size={20} onUpdate={onUpdateThreat} onOpenInEditor={onOpenThreatInEditor} />
            ) : (
              <PokemonMiniSprite spriteId={entry.name.toLowerCase().replace(/[^a-z0-9-]/g, '')} name={entry.name} size={20} />
            )}
            <span>{entry.name}</span>
            {entry.item && SPEED_ITEMS[entry.item] && <span className="text-muted-foreground font-normal text-[9px]">({entry.item})</span>}
            {entry.isMe && <span className="text-[#d4a017]">← You</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Base speed stats for meta-relevant Pokemon. Used to calculate speeds from meta threat sets. */
const KNOWN_BASE_SPEEDS: Record<string, number> = {
  'Incineroar': 60, 'Sneasler': 120, 'Garchomp': 102, 'Kingambit': 50,
  'Sinistcha': 23, 'Charizard': 100, 'Whimsicott': 116, 'Basculegion': 78,
  'Archaludon': 85, 'Pelipper': 65, 'Rotom-Wash': 86, 'Rotom': 86,
  'Gardevoir': 80, 'Maushold': 111, 'Tyranitar': 61, 'Excadrill': 88,
  'Froslass': 110, 'Gengar': 110, 'Dragonite': 80, 'Arcanine-Hisui': 95,
  'Floette': 52, 'Hydreigon': 98, 'Primarina': 60, 'Farigiraf': 60,
  'Kommo-o': 85, 'Meganium': 80, 'Sylveon': 60, 'Torkoal': 20,
  'Dragapult': 142, 'Volcarona': 100, 'Scizor': 65, 'Corviknight': 67,
  'Hatterene': 29, 'Mimikyu': 96, 'Arcanine': 95, 'Slowking': 30,
  'Venusaur': 80, 'Greninja': 122, 'Talonflame': 126, 'Lucario': 90,
  'Weavile': 125, 'Blastoise': 78, 'Aegislash': 60, 'Aegislash-Blade': 60,
  'Palafin-Hero': 100, 'Clefable': 60,
  // Mega forms
  'Gengar-Mega': 130, 'Kangaskhan-Mega': 100, 'Gardevoir-Mega': 100,
  'Metagross-Mega': 110, 'Salamence-Mega': 120, 'Charizard-Mega-X': 100,
  'Charizard-Mega-Y': 100, 'Froslass-Mega': 120, 'Floette-Mega': 102,
  'Meganium-Mega': 80, 'Delphox-Mega': 134, 'Scizor-Mega': 75,
  'Garchomp-Mega': 92, 'Lucario-Mega': 112, 'Blaziken-Mega': 100,
  'Tyranitar-Mega': 71, 'Gyarados-Mega': 81, 'Venusaur-Mega': 80,
  'Blastoise-Mega': 78, 'Alakazam-Mega': 150, 'Pinsir-Mega': 105,
  'Aerodactyl-Mega': 150, 'Ampharos-Mega': 45, 'Steelix-Mega': 30,
  'Heracross-Mega': 75, 'Houndoom-Mega': 115, 'Sceptile-Mega': 145,
  'Swampert-Mega': 70, 'Sableye-Mega': 20, 'Mawile-Mega': 50,
  'Aggron-Mega': 50, 'Manectric-Mega': 135, 'Altaria-Mega': 80,
  'Absol-Mega': 115, 'Lopunny-Mega': 135, 'Gallade-Mega': 110,
  'Dragonite-Mega': 100, 'Hawlucha-Mega': 118, 'Diancie-Mega': 110,
  'Palafin': 100, 'Clefable-Mega': 60, 'Politoed': 70,
  'Ninetales-Alola': 109,
};
