'use client';

import { useState, useEffect } from 'react';
import { learnsetCache, fetchLearnset, itemsCached, setItemsCache } from '@/lib/pokemon/learnset-cache';
import { PokemonSprite } from './pokemon-sprite';
import { ItemIcon } from './item-icon';
import { TypeBadge } from './type-badge';
import { StatDisplay } from './stat-display';
import { EvEditor } from './ev-editor';
import { Separator } from '@/components/ui/separator';
import type { PokemonSet, PokemonSpecies, StatsTable, Move, Nature } from '@/types/pokemon';
import { STAT_NAMES } from '@/types/pokemon';
import { MegaIcon } from './mega-icon';
import { MovePickerDialog } from './move-picker-dialog';
import { ItemPickerDialog } from './item-picker-dialog';
import { useUsageStats } from '@/hooks/use-usage-stats';
import { PanelRightOpen, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getTypeMatchups } from '@/lib/pokemon/type-weakness';
import { MEGA_STONE_MAP } from '@/lib/constants/mega-stones';

interface PokemonEditorProps {
  pokemonSet: PokemonSet;
  species: PokemonSpecies;
  onUpdate: (updates: Partial<PokemonSet>) => void;
  onMoveUpdate: (moveIndex: number, move: string) => void;
  onEvUpdate: (stat: keyof StatsTable, value: number) => void;
  onDisplaySpeciesChange?: (species: PokemonSpecies) => void;
  /** Whether the stats panel is expanded in a separate column */
  statsPanelExpanded?: boolean;
  /** Callback to expand the stats panel into its own column (desktop/tablet) */
  onExpandStatsPanel?: () => void;
}


export const NATURES: Nature[] = [
  { id: 'adamant', name: 'Adamant', plus: 'atk', minus: 'spa' },
  { id: 'jolly', name: 'Jolly', plus: 'spe', minus: 'spa' },
  { id: 'modest', name: 'Modest', plus: 'spa', minus: 'atk' },
  { id: 'timid', name: 'Timid', plus: 'spe', minus: 'atk' },
  { id: 'brave', name: 'Brave', plus: 'atk', minus: 'spe' },
  { id: 'quiet', name: 'Quiet', plus: 'spa', minus: 'spe' },
  { id: 'bold', name: 'Bold', plus: 'def', minus: 'atk' },
  { id: 'impish', name: 'Impish', plus: 'def', minus: 'spa' },
  { id: 'calm', name: 'Calm', plus: 'spd', minus: 'atk' },
  { id: 'careful', name: 'Careful', plus: 'spd', minus: 'spa' },
  { id: 'relaxed', name: 'Relaxed', plus: 'def', minus: 'spe' },
  { id: 'sassy', name: 'Sassy', plus: 'spd', minus: 'spe' },
  { id: 'naive', name: 'Naive', plus: 'spe', minus: 'spd' },
  { id: 'hasty', name: 'Hasty', plus: 'spe', minus: 'def' },
  { id: 'serious', name: 'Serious', plus: null, minus: null },
  { id: 'hardy', name: 'Hardy', plus: null, minus: null },
  { id: 'docile', name: 'Docile', plus: null, minus: null },
  { id: 'bashful', name: 'Bashful', plus: null, minus: null },
  { id: 'quirky', name: 'Quirky', plus: null, minus: null },
  { id: 'lonely', name: 'Lonely', plus: 'atk', minus: 'def' },
  { id: 'mild', name: 'Mild', plus: 'spa', minus: 'def' },
  { id: 'rash', name: 'Rash', plus: 'spa', minus: 'spd' },
  { id: 'gentle', name: 'Gentle', plus: 'spd', minus: 'def' },
  { id: 'naughty', name: 'Naughty', plus: 'atk', minus: 'spd' },
  { id: 'lax', name: 'Lax', plus: 'def', minus: 'spd' },
];

function TypeWeaknessRow({ types }: { types: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const matchups = getTypeMatchups(types);
  const hasWeakness = matchups.x4.length > 0 || matchups.x2.length > 0;
  const hasResist = matchups.half.length > 0 || matchups.quarter.length > 0 || matchups.immune.length > 0;
  if (!hasWeakness && !hasResist) return null;

  const TypeImg = ({ type }: { type: string }) => (
    <img src={`https://play.pokemonshowdown.com/sprites/types/${type}.png`} alt={type} width={28} height={12} className="shrink-0" />
  );

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Type Matchups
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {matchups.x4.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-semibold text-red-500 w-6 shrink-0">4x</span>
              {matchups.x4.map(t => <TypeImg key={t} type={t} />)}
            </div>
          )}
          {matchups.x2.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-red-400 w-6 shrink-0">2x</span>
              {matchups.x2.map(t => <TypeImg key={t} type={t} />)}
            </div>
          )}
          {matchups.half.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-green-500 w-6 shrink-0">½x</span>
              {matchups.half.map(t => <TypeImg key={t} type={t} />)}
            </div>
          )}
          {matchups.quarter.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-semibold text-green-600 w-6 shrink-0">¼x</span>
              {matchups.quarter.map(t => <TypeImg key={t} type={t} />)}
            </div>
          )}
          {matchups.immune.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-semibold text-blue-400 w-6 shrink-0">0x</span>
              {matchups.immune.map(t => <TypeImg key={t} type={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PokemonEditor({
  pokemonSet,
  species,
  onUpdate,
  onMoveUpdate,
  onEvUpdate,
  onDisplaySpeciesChange,
  statsPanelExpanded,
  onExpandStatsPanel,
}: PokemonEditorProps) {
  const [learnset, setLearnset] = useState<Move[]>([]);
  const usageData = useUsageStats(species.name);
  const [abilityDescs, setAbilityDescs] = useState<Record<string, string>>({});
  const [items, setItems] = useState<{ id: string; name: string; description?: string | null }[]>([]);
  const [movePickerSlot, setMovePickerSlot] = useState<number | null>(null);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [megaForms, setMegaForms] = useState<PokemonSpecies[]>([]);
  const [showMega, setShowMega] = useState(false);
  const [megaPrompt, setMegaPrompt] = useState(false);
  const [baseAbility, setBaseAbility] = useState<string | null>(null);

  // Battle form switching (Aegislash Blade/Shield, Palafin Hero, etc.)
  const [battleForm, setBattleForm] = useState<PokemonSpecies | null>(null);
  const [showBattleForm, setShowBattleForm] = useState(false);

  // Detect if current item is a mega stone (ends with "ite", optionally "ite X"/"ite Y"/"ite Z")
  const isMegaStoneEquipped = !!(pokemonSet.item &&
    /ite( [XYZ])?$/i.test(pokemonSet.item) &&
    pokemonSet.item.toLowerCase() !== 'eviolite');

  // Fetch learnset — uses shared cache, shows loading state on first visit
  useEffect(() => {
    const cached = learnsetCache.get(species.id);
    if (cached) { setLearnset(cached); return; }
    setLearnset([]); // triggers loading skeleton while fetching
    fetchLearnset(species.id).then(setLearnset).catch(console.error);
  }, [species.id]);

  // Fetch items — cached globally, only fetched once ever
  useEffect(() => {
    if (itemsCached) { setItems(itemsCached); return; }
    fetch('/api/items?vgc=true&limit=500')
      .then((r) => r.json())
      .then((data) => { setItemsCache(data); setItems(data); })
      .catch(console.error);
  }, []);

  // Fetch mega form data only if the static map says this species can mega evolve
  const megaStoneEntries = MEGA_STONE_MAP[species.name] ?? [];
  useEffect(() => {
    setMegaForms([]);
    setShowMega(false);
    if (megaStoneEntries.length === 0) return;
    // Fetch the mega form(s) by name from the DB for stats/type data
    const megaNames = megaStoneEntries.map(e => e.mega);
    Promise.all(megaNames.map(name =>
      fetch(`/api/pokemon?q=${encodeURIComponent(name)}&limit=3`)
        .then(r => r.json())
        .then((data: PokemonSpecies[]) => data.find(p => p.name === name) ?? null)
        .catch(() => null)
    )).then(results => {
      const found = results.filter((r): r is PokemonSpecies => r !== null);
      if (found.length > 0) setMegaForms(found);
    });
  }, [species.id, species.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Battle form map: base species name → alternate form display name
  const BATTLE_FORMS: Record<string, { formName: string; label: string; baseLabel: string }> = {
    'Aegislash': { formName: 'Aegislash-Blade', label: 'Blade', baseLabel: 'Shield' },
    'Palafin': { formName: 'Palafin-Hero', label: 'Hero', baseLabel: 'Zero' },
  };

  // Fetch battle form data if applicable
  useEffect(() => {
    setBattleForm(null);
    setShowBattleForm(false);
    const formInfo = BATTLE_FORMS[species.name];
    if (!formInfo) return;
    fetch(`/api/pokemon?q=${encodeURIComponent(formInfo.formName)}&limit=5`)
      .then(r => r.json())
      .then((data: PokemonSpecies[]) => {
        const match = data.find(p => p.name === formInfo.formName);
        if (match) setBattleForm(match);
      })
      .catch(() => {});
  }, [species.id, species.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const battleFormInfo = BATTLE_FORMS[species.name] ?? null;

  // Pick the correct mega form based on equipped stone (handles X/Y/Z variants)
  const megaData = (() => {
    if (megaForms.length === 0) return null;
    if (megaForms.length === 1) return megaForms[0];
    // Check equipped item for X/Y/Z suffix (e.g. "Charizardite X", "Mewtwonite Y", "Absolite Z")
    const stoneMatch = pokemonSet.item?.match(/ite ([XYZ])$/i);
    if (stoneMatch) {
      const suffix = stoneMatch[1].toUpperCase();
      const match = megaForms.find(m => m.name.endsWith(`-${suffix}`));
      if (match) return match;
    }
    return megaForms[0];
  })();

  // True when this specific species can mega evolve (per static Showdown map)
  const canMegaEvolve = megaStoneEntries.length > 0;

  // Collapse to base form when stone is removed
  useEffect(() => {
    if (!isMegaStoneEquipped) {
      if (showMega && baseAbility) onUpdate({ ability: baseAbility });
      setShowMega(false);
      setBaseAbility(null);
    }
  }, [isMegaStoneEquipped]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentNature = NATURES.find((n) => n.name === pokemonSet.nature) || {
    plus: null,
    minus: null,
  };

  // Which stats/sprite to display — mega takes priority, then battle form
  const displaySpecies = showMega && megaData ? megaData
    : showBattleForm && battleForm ? battleForm
    : species;
  const displayAbilities = Object.values(displaySpecies.abilities);

  // Fetch ability descriptions from DB whenever the displayed abilities change
  useEffect(() => {
    if (!displayAbilities.length) return;
    const names = displayAbilities.join(',');
    fetch(`/api/abilities?names=${encodeURIComponent(names)}`)
      .then(r => r.json())
      .then((data: Record<string, string>) => setAbilityDescs(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [displayAbilities.join(',')]);

  // Notify parent when display species changes (mega toggle)
  useEffect(() => {
    onDisplaySpeciesChange?.(displaySpecies);
  }, [displaySpecies]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <PokemonSprite
          spriteId={displaySpecies.spriteId}
          dexNum={displaySpecies.dexNum}
          name={displaySpecies.name}
          size={96}
          animated={true}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">{displaySpecies.name}</h3>
          <div className="flex gap-1 mt-1">
            {displaySpecies.types.map((t) => (
              <TypeBadge key={t} type={t} size="md" />
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            #{String(displaySpecies.dexNum).padStart(3, '0')}
          </div>
          <TypeWeaknessRow types={displaySpecies.types} />
        </div>
        {/* Mega toggle — always visible when Pokemon has a mega form */}
        {canMegaEvolve && (
          <div className="flex flex-col items-end gap-1 pr-6 lg:pr-0">
            <button
              onClick={() => {
                if (!isMegaStoneEquipped) { setMegaPrompt(true); setTimeout(() => setMegaPrompt(false), 2500); return; }
                const nextShowMega = !showMega;
                setShowMega(nextShowMega);
                if (nextShowMega && megaData) {
                  // Save base ability and switch to mega ability
                  setBaseAbility(pokemonSet.ability);
                  const megaAbility = Object.values(megaData.abilities)[0];
                  if (megaAbility) onUpdate({ ability: megaAbility });
                } else {
                  // Restore base ability
                  if (baseAbility) onUpdate({ ability: baseAbility });
                  setBaseAbility(null);
                }
              }}
              title={!isMegaStoneEquipped ? 'Equip the Mega Stone to view Mega form' : (showMega ? 'Switch to base form' : 'Switch to Mega form')}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-all ${
                showMega
                  ? 'bg-purple-950/30 border-purple-500/60 text-purple-200'
                  : isMegaStoneEquipped
                    ? 'bg-background border-border hover:border-purple-400/60 text-muted-foreground'
                    : 'bg-background border-border text-muted-foreground opacity-40 cursor-not-allowed'
              }`}
            >
              <MegaIcon size={18} active={showMega} />
              <span className="font-medium">{showMega ? 'Mega' : 'Base'}</span>
            </button>
            {megaPrompt && (
              <span className="text-[10px] text-amber-500 text-right leading-tight max-w-[120px]">
                Equip the Mega Stone first
              </span>
            )}
          </div>
        )}
        {/* Battle form toggle (Aegislash Shield/Blade, Palafin Zero/Hero) */}
        {battleFormInfo && battleForm && !canMegaEvolve && (
          <div className="flex flex-col items-end gap-1 pr-6 lg:pr-0">
            <button
              onClick={() => setShowBattleForm(prev => !prev)}
              title={showBattleForm ? `Switch to ${battleFormInfo.baseLabel} form` : `Switch to ${battleFormInfo.label} form`}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-all ${
                showBattleForm
                  ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                  : 'bg-background border-border hover:border-amber-400/60 text-muted-foreground'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="font-medium">{showBattleForm ? battleFormInfo.label : battleFormInfo.baseLabel}</span>
            </button>
          </div>
        )}
      </div>

      <Separator />

      {/* Ability */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Ability {showMega && <span className="text-[10px] text-purple-400">(Mega — locked)</span>}
        </label>
        <div className="space-y-1 mt-1">
          {(showMega ? displayAbilities.slice(0, 1) : displayAbilities).map((a) => (
            <button
              key={a}
              onClick={() => { if (!showMega) onUpdate({ ability: a }); }}
              disabled={showMega}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded border transition-colors group relative ${
                pokemonSet.ability === a
                  ? 'border-[#d4a017] bg-[#d4a017]/10 text-foreground'
                  : 'hover:bg-accent'
              } ${showMega ? 'cursor-not-allowed' : ''}`}
              title={abilityDescs[a] || ''}
            >
              <span className="font-medium">{a}</span>
              {(() => {
                const pct = usageData?.abilities.find(u => u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === a.toLowerCase().replace(/[^a-z0-9]/g, ''))?.percent;
                return pct != null && pct > 0 ? (
                  <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded ml-1">{pct}%</span>
                ) : null;
              })()}
              {abilityDescs[a] && (
                <span className="text-muted-foreground ml-1.5">{abilityDescs[a]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Item */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Item</label>
        <div className="relative mt-1">
          <button
            onClick={() => setItemPickerOpen(true)}
            className={`w-full flex items-center gap-2 h-9 border rounded px-2.5 hover:bg-accent transition-colors text-left ${pokemonSet.item ? 'pr-8' : ''}`}
          >
            {pokemonSet.item ? (
              <>
                <ItemIcon itemName={pokemonSet.item} size={22} />
                <span className="text-sm flex-1">{pokemonSet.item}</span>
                {isMegaStoneEquipped && <span className="text-[10px] text-muted-foreground shrink-0">Mega Stone</span>}
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground flex-1">Select item...</span>
                <span className="text-[10px] text-muted-foreground shrink-0">Browse →</span>
              </>
            )}
          </button>
          {pokemonSet.item && (
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate({ item: '' }); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded"
              title="Clear item"
              aria-label="Clear item"
            >
              ×
            </button>
          )}
        </div>
        <ItemPickerDialog
          open={itemPickerOpen}
          onClose={() => setItemPickerOpen(false)}
          onSelect={(item) => onUpdate({ item })}
          canMegaEvolve={canMegaEvolve}
          speciesName={species.name}
          currentItem={pokemonSet.item}
          itemUsage={usageData?.items}
        />
      </div>

      {/* Nature */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Nature</label>
        <select
          value={pokemonSet.nature}
          onChange={(e) => onUpdate({ nature: e.target.value })}
          className="mt-1 w-full h-8 text-sm rounded border bg-background px-2"
        >
          {NATURES.map((n) => (
            <option key={n.id} value={n.name}>
              {n.name}
              {n.plus ? ` (+${STAT_NAMES[n.plus as keyof StatsTable]}, -${STAT_NAMES[n.minus as keyof StatsTable]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Moves */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Moves</label>
        <div className="space-y-1.5 mt-1">
          {pokemonSet.moves.map((move, i) => {
            const moveData = move ? learnset.find((m) => m.name === move) : null;
            const learnsetLoading = learnset.length === 0;
            return (
              <div key={i} className="relative group">
                <button
                  onClick={() => setMovePickerSlot(i)}
                  className={`w-full text-left px-2.5 py-1.5 rounded border hover:border-[#d4a017]/50 hover:bg-accent transition-colors ${move ? 'pr-8' : ''} ${move ? '' : 'text-muted-foreground'}`}
                  title={moveData?.description || ''}
                >
                  {move ? (
                    moveData ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{move}</span>
                          <img src={`https://play.pokemonshowdown.com/sprites/types/${moveData.type}.png`} alt={moveData.type} width={32} height={14} className="shrink-0" />
                          <img src={`https://play.pokemonshowdown.com/sprites/categories/${moveData.category}.png`} alt={moveData.category} width={32} height={14} className="shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {moveData.basePower > 0 && (
                            <span className="text-[10px] text-muted-foreground ml-auto">{moveData.basePower} BP</span>
                          )}
                        </div>
                        {moveData.description && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{moveData.description}</div>
                        )}
                      </div>
                    ) : (
                      /* Learnset still loading — show move name without metadata */
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{move}</span>
                        {learnsetLoading && <span className="text-[10px] text-muted-foreground animate-pulse">loading…</span>}
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Move {i + 1}</span>
                  )}
                </button>
                {/* Quick-clear for filled moves (always visible for mobile accessibility) */}
                {move && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveUpdate(i, ''); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded"
                    title="Clear move"
                    aria-label="Clear move"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Move picker dialog */}
      <MovePickerDialog
        open={movePickerSlot !== null}
        onClose={() => setMovePickerSlot(null)}
        onSelect={(moveName) => {
          if (movePickerSlot !== null) onMoveUpdate(movePickerSlot, moveName);
        }}
        learnset={learnset}
        currentMoves={pokemonSet.moves}
        slotIndex={movePickerSlot ?? 0}
        moveUsage={usageData?.moves}
      />

      {/* Stats + EVs — hidden when stats panel is expanded into its own column */}
      <div className={statsPanelExpanded ? 'hidden' : ''}>
        <Separator />
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Stats (Lv. 50) {showMega && megaData ? '— Mega Form' : ''}
            </label>
            {onExpandStatsPanel && (
              <button
                onClick={onExpandStatsPanel}
                className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
                title="Expand stats into separate panel"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2">
            <StatDisplay
              baseStats={displaySpecies.baseStats}
              evs={pokemonSet.evs}
              nature={currentNature}
            />
          </div>
        </div>
        <Separator />
        <EvEditor evs={pokemonSet.evs} onEvChange={onEvUpdate} />
      </div>
    </div>
  );
}
