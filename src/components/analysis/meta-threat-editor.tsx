'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MetaThreat } from '@/types/calc';
import { DEFAULT_META_THREATS } from '@/types/calc';
import { STAT_NAMES, type StatsTable } from '@/types/pokemon';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { speciesToSpriteId } from '@/lib/sprites';
import {
  Plus, Trash2, GripVertical, Copy, ClipboardPaste, RotateCcw,
  AlertCircle, Check, ChevronDown, ChevronRight, ChevronsUp, ChevronsDown, Info,
  Filter, Search, X,
} from 'lucide-react';
import { TYPE_COLORS } from '@/lib/sprites';
import { PokemonSelector } from '@/components/builder/pokemon-selector';
import { MovePickerDialog } from '@/components/builder/move-picker-dialog';
import { ItemPickerDialog } from '@/components/builder/item-picker-dialog';
import { useFormat } from '@/hooks/use-format';
import { useUsageStats } from '@/hooks/use-usage-stats';
import type { PokemonSpecies, Move } from '@/types/pokemon';

interface MetaThreatEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threats: MetaThreat[];
  onSave: (threats: MetaThreat[]) => void;
  /** If provided, "Restore Defaults" uses this generator (DB-driven list)
   *  instead of the hardcoded DEFAULT_META_THREATS constant. Fallback to
   *  hardcoded when the callback returns an empty array. */
  onRestoreDefaults?: () => MetaThreat[];
  /** If provided, the dialog scrolls this threat row into view on open. */
  initialFocusThreatId?: string | null;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface PokemonMeta {
  abilities: string[];
  learnset: Move[];
  spriteId?: string;
  types: string[];
}

// ── Mobile detection hook ──────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ── Generic searchable dropdown (desktop) ─────────────────────────────────

interface SearchSelectProps {
  value: string;
  placeholder: string;
  onSearch: (q: string) => Promise<string[]>;
  onChange: (val: string) => void;
  onViewAll?: () => void;
  loadAllOptions?: () => Promise<string[]>;
  viewAllLabel: string;
  className?: string;
}

function SearchSelect({
  value, placeholder, onSearch, onChange,
  onViewAll, loadAllOptions, viewAllLabel, className = '',
}: SearchSelectProps) {
  const [input, setInput] = useState(value);
  const [options, setOptions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    clearTimeout(timer.current);
    if (!q.trim()) { setOptions([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { setOptions(await onSearch(q)); } finally { setLoading(false); }
    }, 200);
  }, [onSearch]);

  const handleInput = (q: string) => {
    setInput(q);
    setOpen(true);
    doSearch(q);
  };

  const handleFocus = () => {
    setOpen(true);
    if (input.trim()) doSearch(input);
  };

  const handleSelect = (val: string) => {
    setInput(val);
    onChange(val);
    setOpen(false);
    setOptions([]);
  };

  const handleViewAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewAll) {
      onViewAll();
      setOpen(false);
    } else if (loadAllOptions) {
      setLoading(true);
      try {
        const all = await loadAllOptions();
        setOptions(all);
      } finally { setLoading(false); }
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          value={input}
          onChange={e => handleInput(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full h-7 px-2 pr-6 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-popover border rounded shadow-md max-h-48 overflow-y-auto">
          <button
            onMouseDown={handleViewAll}
            className="w-full text-left px-2 py-1.5 text-xs text-[#d4a017] font-medium hover:bg-[#d4a017]/10 border-b transition-colors flex items-center gap-1.5 sticky top-0 bg-popover"
          >
            <Plus className="h-3 w-3 shrink-0" /> {viewAllLabel}
          </button>
          {loading && <div className="px-2 py-1 text-[11px] text-muted-foreground">Loading…</div>}
          {options.map(opt => (
            <button
              key={opt}
              onMouseDown={() => handleSelect(opt)}
              className="w-full text-left px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              {opt}
            </button>
          ))}
          {!loading && options.length === 0 && input.trim() && (
            <div className="px-2 py-1 text-[11px] text-muted-foreground">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── API helpers ────────────────────────────────────────────────────────────

async function searchPokemonNames(q: string, formatId: string): Promise<string[]> {
  const res = await fetch(`/api/pokemon?q=${encodeURIComponent(q)}&limit=8&format=${encodeURIComponent(formatId)}`);
  const data = await res.json();
  return Array.isArray(data) ? data.map((p: { name: string }) => p.name) : [];
}


function speciesId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True if this species is a Mega form (name ends in "-Mega", "-Mega-X", etc.). */
function isMegaSpecies(name: string): boolean {
  return /-Mega(-[XYZ])?$/i.test(name.trim());
}

/** Prefill threat fields from DEFAULT_META_THREATS, or clear everything if unknown. */
function defaultsForSpecies(speciesName: string): Partial<MetaThreat> {
  const found = DEFAULT_META_THREATS.find(
    t => t.species.toLowerCase() === speciesName.toLowerCase(),
  );
  if (found) {
    return {
      item: found.item ?? '',
      nature: found.nature ?? 'Hardy',
      ability: found.ability ?? '',
      evs: found.evs ?? { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      moves: (found.moves ?? []).concat(['', '', '', '']).slice(0, 4) as MetaThreat['moves'],
    };
  }
  return {
    item: '',
    nature: 'Hardy',
    ability: '',
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    moves: ['', '', '', ''],
  };
}

/**
 * Fetch usage-based defaults for a Pokemon species from Smogon data.
 * Returns the most popular ability, item, nature, spread, and moves.
 */
async function fetchUsageDefaults(speciesName: string): Promise<Partial<MetaThreat> | null> {
  try {
    const id = speciesName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const res = await fetch(`/api/usage?pokemon=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!data || !data.moves) return null;

    const topMoves = (data.moves as { name: string; percent: number }[])
      .slice(0, 4)
      .map(m => m.name);
    const topItem = (data.items as { name: string }[])?.[0]?.name ?? '';
    const topAbility = (data.abilities as { name: string }[])?.[0]?.name ?? '';
    const topSpread = (data.spreads as { nature: string; evs: Record<string, number> }[])?.[0];

    // Convert old EVs (0-252) to SP (0-32) if needed
    let evs: Record<string, number> = { ...(topSpread?.evs ?? { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }) };
    const maxVal = Math.max(...Object.values(evs));
    if (maxVal > 32) {
      const convert = (v: number) => Math.min(Math.round(v / 8), 32);
      evs = { hp: convert(evs.hp || 0), atk: convert(evs.atk || 0), def: convert(evs.def || 0),
              spa: convert(evs.spa || 0), spd: convert(evs.spd || 0), spe: convert(evs.spe || 0) };
    }
    // Bump to 66 total SP if under
    const total = Object.values(evs).reduce((a, b) => a + b, 0);
    if (total > 0 && total < 66) {
      const deficit = 66 - total;
      const smallest = Object.entries(evs).filter(([, v]) => v > 0 && v < 32).sort(([, a], [, b]) => a - b);
      if (smallest.length > 0) evs[smallest[0][0]] = Math.min((evs[smallest[0][0]] || 0) + deficit, 32);
      else { const zero = Object.entries(evs).find(([, v]) => v === 0); if (zero) evs[zero[0]] = deficit; }
    }

    // Resolve move display names from learnset (one fetch)
    let resolvedMoves = topMoves;
    try {
      const learnRes = await fetch(`/api/pokemon/${id}/learnset`);
      const learnset = await learnRes.json();
      if (Array.isArray(learnset)) {
        resolvedMoves = topMoves.map(name => {
          const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = learnset.find((m: { name: string }) =>
            m.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key);
          return match?.name ?? name;
        });
      }
    } catch { /* use raw names */ }

    return {
      item: topItem,
      nature: topSpread?.nature ?? 'Hardy',
      ability: topAbility,
      evs,
      moves: resolvedMoves.concat(['', '', '', '']).slice(0, 4) as MetaThreat['moves'],
    };
  } catch {
    return null;
  }
}

async function fetchPokemonMeta(species: string): Promise<PokemonMeta> {
  const [pokeRes, learnRes] = await Promise.all([
    fetch(`/api/pokemon?q=${encodeURIComponent(species)}&limit=10`),
    fetch(`/api/pokemon/${encodeURIComponent(speciesId(species))}/learnset`),
  ]);
  const pokeData = await pokeRes.json();
  const learnData = await learnRes.json();

  let abilities: string[] = [];
  let spriteId: string | undefined;
  let types: string[] = [];
  if (Array.isArray(pokeData) && pokeData.length > 0) {
    // Prefer exact name match to avoid Venusaur returning Venusaur-Mega
    const exact = pokeData.find((p: PokemonSpecies) => p.name === species) || pokeData[0];
    if (exact.abilities) {
      const ab = exact.abilities as Record<string, string>;
      abilities = Object.values(ab).filter(Boolean) as string[];
    }
    spriteId = exact.spriteId;
    if (Array.isArray(exact.types)) types = exact.types;
  }
  const learnset: Move[] = Array.isArray(learnData) ? learnData : [];

  return { abilities, learnset, spriteId, types };
}

const NATURES = [
  'Adamant','Jolly','Modest','Timid','Bold','Calm','Careful','Impish',
  'Brave','Quiet','Relaxed','Sassy','Serious','Hardy','Naive','Hasty',
  'Rash','Mild','Gentle','Lax',
];

const EV_PRESETS: { label: string; evs: Partial<StatsTable> }[] = [
  { label: 'HP/Atk', evs: { hp: 32, atk: 32, spe: 2 } },
  { label: 'HP/SpA', evs: { hp: 32, spa: 32, spe: 2 } },
  { label: 'Spe/Atk', evs: { atk: 32, spe: 32, hp: 2 } },
  { label: 'Spe/SpA', evs: { spa: 32, spe: 32, hp: 2 } },
  { label: 'HP/Def', evs: { hp: 32, def: 32, spd: 2 } },
  { label: 'HP/SpD', evs: { hp: 32, spd: 32, def: 2 } },
];

// ── Mobile threat row ──────────────────────────────────────────────────────

interface MobileThreatRowProps {
  threat: MetaThreat;
  meta: PokemonMeta;
  onUpdate: (id: string, updates: Partial<MetaThreat>) => void;
  onRemove: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onMoveToBottom: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: () => void;
  isDragOver: boolean;
  onOpenPokemonSelector: (id: string) => void;
  errors: string[];
  onGripTouchStart: (id: string, e: React.TouchEvent) => void;
}

function MobileThreatRow({
  threat, meta, onUpdate, onRemove, onMoveToTop, onMoveToBottom,
  onDragStart, onDragOver, onDrop, isDragOver,
  onOpenPokemonSelector, errors, onGripTouchStart,
}: MobileThreatRowProps) {
  const usageData = useUsageStats(threat.species || undefined);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [movePicker, setMovePicker] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Summary text for collapsed view
  const summaryParts: string[] = [];
  if (threat.item) summaryParts.push(threat.item);
  if (threat.nature && threat.nature !== 'Hardy') summaryParts.push(threat.nature);
  const summaryText = summaryParts.join(' · ');

  return (
    <>
      <div
        draggable
        onDragStart={() => onDragStart(threat.id)}
        onDragOver={e => { e.preventDefault(); onDragOver(threat.id); }}
        onDrop={onDrop}
        className={`border rounded-xl transition-colors ${isDragOver ? 'border-[#d4a017] bg-[#d4a017]/5' : 'bg-card'}`}
      >
        {/* Header: always visible — tap to expand/collapse */}
        <div
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-col items-center shrink-0 -my-1" onClick={e => e.stopPropagation()}>
            <div
              className="touch-none p-2 -m-2 cursor-grab"
              onTouchStart={(e) => onGripTouchStart(threat.id, e)}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex gap-0.5">
              <button onClick={() => onMoveToTop(threat.id)} className="p-0.5 text-muted-foreground hover:text-foreground" title="Move to top">
                <ChevronsUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onMoveToBottom(threat.id)} className="p-0.5 text-muted-foreground hover:text-foreground" title="Move to bottom">
                <ChevronsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {threat.species && (
            <PokemonMiniSprite spriteId={meta.spriteId || speciesToSpriteId(threat.species)} name={threat.species} size={32} />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">
              {threat.species || <span className="text-muted-foreground italic">No Pokémon selected</span>}
            </span>
            {!expanded && summaryText && (
              <span className="text-[11px] text-muted-foreground truncate block">{summaryText}</span>
            )}
          </div>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <button onClick={(e) => { e.stopPropagation(); onRemove(threat.id); }} className="p-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Expandable body */}
        {expanded && (
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* Pokémon selector button */}
            <button
              onClick={() => onOpenPokemonSelector(threat.id)}
              className="w-full h-10 px-3 text-sm text-left border rounded-lg bg-background flex items-center justify-between"
            >
              <span className={threat.species ? '' : 'text-muted-foreground'}>
                {threat.species || 'Select Pokémon…'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {/* Item picker button */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Item</label>
              <div className="relative">
                <button
                  onClick={() => setItemPickerOpen(true)}
                  className="w-full h-10 pl-3 pr-9 text-sm text-left border rounded-lg bg-background flex items-center justify-between"
                >
                  <span className={threat.item ? '' : 'text-muted-foreground'}>
                    {threat.item || 'Select item…'}
                  </span>
                  {!threat.item && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {threat.item && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdate(threat.id, { item: '' }); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive p-1 rounded"
                    title="Clear item"
                    aria-label="Clear item"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Ability + Nature row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                  Ability
                </label>
                {isMegaSpecies(threat.species) && meta.abilities[0] ? (
                  <div className="w-full h-10 text-sm rounded-lg border bg-muted/30 px-2 flex items-center cursor-not-allowed">
                    {meta.abilities[0]}
                  </div>
                ) : meta.abilities.length > 0 ? (
                  <select
                    value={threat.ability ?? ''}
                    onChange={e => onUpdate(threat.id, { ability: e.target.value })}
                    className="w-full h-10 text-sm rounded-lg border bg-background px-2"
                  >
                    <option value="">— select —</option>
                    {meta.abilities.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <div className="w-full h-10 text-sm rounded-lg border bg-background px-2 flex items-center text-muted-foreground">
                    {threat.species ? 'Loading…' : 'Select Pokémon first'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Nature</label>
                <select
                  value={threat.nature ?? 'Adamant'}
                  onChange={e => onUpdate(threat.id, { nature: e.target.value })}
                  className="w-full h-10 text-sm rounded-lg border bg-background px-2"
                >
                  {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* EVs */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">EVs</label>
                <div className="flex gap-1 flex-wrap justify-end">
                  {EV_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => onUpdate(threat.id, { evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...p.evs } })}
                      className="px-1.5 py-0.5 text-[9px] rounded border bg-background hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['hp','atk','def','spa','spd','spe'] as (keyof StatsTable)[]).map(stat => (
                  <div key={stat} className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground w-7 shrink-0">{STAT_NAMES[stat].slice(0,3)}</span>
                    <input
                      type="number"
                      value={threat.evs[stat] ?? 0}
                      onFocus={e => e.target.select()}
                      onChange={e => { const v = e.target.value === '' ? 0 : Math.min(32, Math.max(0, parseInt(e.target.value) || 0)); onUpdate(threat.id, { evs: { ...threat.evs, [stat]: v } }); }}
                      className="flex-1 h-9 text-sm text-center border rounded-lg bg-background min-w-0"
                      min={0} max={32} inputMode="numeric"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Moves — 2x2 grid of tappable buttons */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Moves</label>
              <div className="grid grid-cols-2 gap-2">
                {[0,1,2,3].map(i => (
                  <button
                    key={i}
                    onClick={() => setMovePicker(i)}
                    className="h-10 px-3 text-sm text-left border rounded-lg bg-background flex items-center justify-between w-full"
                  >
                    <span className={`truncate ${threat.moves[i] ? '' : 'text-muted-foreground'}`}>
                      {threat.moves[i] || `Move ${i + 1}`}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item picker — uses builder's full ItemPickerDialog */}
      <ItemPickerDialog
        open={itemPickerOpen}
        onClose={() => setItemPickerOpen(false)}
        onSelect={item => onUpdate(threat.id, { item })}
        canMegaEvolve={false}
        currentItem={threat.item}
        itemUsage={usageData?.items}
      />

      {/* Move picker — uses builder's full MovePickerDialog with learnset */}
      <MovePickerDialog
        open={movePicker !== null}
        onClose={() => setMovePicker(null)}
        onSelect={val => {
          if (movePicker === null) return;
          const moves = [...threat.moves];
          moves[movePicker] = val;
          onUpdate(threat.id, { moves });
        }}
        learnset={meta.learnset}
        currentMoves={threat.moves}
        slotIndex={movePicker ?? 0}
        moveUsage={usageData?.moves}
      />
    </>
  );
}

// ── Desktop threat row ─────────────────────────────────────────────────────

interface ThreatRowProps {
  threat: MetaThreat;
  metaCache: Record<string, PokemonMeta>;
  onUpdate: (id: string, updates: Partial<MetaThreat>) => void;
  onRemove: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onMoveToBottom: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: () => void;
  isDragOver: boolean;
  onOpenPokemonSelector: (id: string) => void;
  errors: string[];
  isMobile: boolean;
  onGripTouchStart: (id: string, e: React.TouchEvent) => void;
  searchNames: (q: string) => Promise<string[]>;
}

function ThreatRow(props: ThreatRowProps) {
  const { threat, metaCache, isMobile } = props;
  const meta = metaCache[threat.species] ?? { abilities: [], learnset: [], types: [] };
  const usageData = useUsageStats(threat.species || undefined);

  if (isMobile) {
    return (
      <MobileThreatRow
        threat={threat}
        meta={meta}
        onUpdate={props.onUpdate}
        onRemove={props.onRemove}
        onMoveToTop={props.onMoveToTop}
        onMoveToBottom={props.onMoveToBottom}
        onDragStart={props.onDragStart}
        onDragOver={props.onDragOver}
        onDrop={props.onDrop}
        isDragOver={props.isDragOver}
        onOpenPokemonSelector={props.onOpenPokemonSelector}
        errors={props.errors}
        onGripTouchStart={props.onGripTouchStart}
      />
    );
  }

  // Desktop layout
  const [desktopItemOpen, setDesktopItemOpen] = useState(false);
  const [desktopMovePicker, setDesktopMovePicker] = useState<number | null>(null);

  const handleSpeciesChange = async (species: string) => {
    // Try static defaults first, then fetch from usage data
    const staticDefaults = defaultsForSpecies(species);
    props.onUpdate(threat.id, { species, ...staticDefaults });
    // If no static defaults found (empty item), try usage data
    if (!staticDefaults.item) {
      const usageDefaults = await fetchUsageDefaults(species);
      if (usageDefaults) {
        props.onUpdate(threat.id, { species, ...usageDefaults });
      }
    }
  };

  return (
    <>
    <div
      draggable
      onDragStart={() => props.onDragStart(threat.id)}
      onDragOver={e => { e.preventDefault(); props.onDragOver(threat.id); }}
      onDrop={props.onDrop}
      className={`border rounded-lg p-3 space-y-2 transition-colors ${props.isDragOver ? 'border-[#d4a017] bg-[#d4a017]/5' : ''}`}
    >
      {/* Row 1: Drag | Move buttons | Species | Item | Nature | Delete */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center shrink-0 -my-0.5">
          <div
            className="touch-none p-1 -m-1 cursor-grab"
            onTouchStart={(e) => props.onGripTouchStart(threat.id, e)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-0">
            <button onClick={() => props.onMoveToTop(threat.id)} className="p-0.5 text-muted-foreground hover:text-foreground" title="Move to top">
              <ChevronsUp className="h-3 w-3" />
            </button>
            <button onClick={() => props.onMoveToBottom(threat.id)} className="p-0.5 text-muted-foreground hover:text-foreground" title="Move to bottom">
              <ChevronsDown className="h-3 w-3" />
            </button>
          </div>
        </div>
        {threat.species && (
          <PokemonMiniSprite spriteId={meta.spriteId || speciesToSpriteId(threat.species)} name={threat.species} size={26} />
        )}
        <button
          onClick={() => props.onOpenPokemonSelector(threat.id)}
          className="flex-1 h-7 px-2 text-xs text-left border rounded bg-background hover:bg-accent transition-colors truncate"
        >
          {threat.species || <span className="text-muted-foreground">Select Pokémon…</span>}
        </button>
        {/* Item — uses builder's ItemPickerDialog */}
        <div className="relative w-36 shrink-0">
          <button
            onClick={() => setDesktopItemOpen(true)}
            className="w-full h-7 pl-2 pr-6 text-xs text-left border rounded bg-background flex items-center justify-between hover:bg-accent transition-colors"
          >
            <span className={`truncate ${threat.item ? '' : 'text-muted-foreground'}`}>{threat.item || 'Item…'}</span>
            {!threat.item && <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />}
          </button>
          {threat.item && (
            <button
              onClick={(e) => { e.stopPropagation(); props.onUpdate(threat.id, { item: '' }); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive px-1 leading-none"
              title="Clear item"
              aria-label="Clear item"
            >
              ×
            </button>
          )}
        </div>
        <select
          value={threat.nature ?? 'Adamant'}
          onChange={e => props.onUpdate(threat.id, { nature: e.target.value })}
          className="h-7 text-xs rounded border bg-background px-1 w-24 shrink-0"
        >
          {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={() => props.onRemove(threat.id)} className="p-1 text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Row 2: Ability */}
      <div className="flex items-center gap-2 pl-5">
        <span className="text-[10px] text-muted-foreground w-12 shrink-0">
          Ability{isMegaSpecies(threat.species) && <span className="text-purple-400 ml-1">(Mega)</span>}
        </span>
        {isMegaSpecies(threat.species) && meta.abilities[0] ? (
          <div className="h-6 text-xs rounded border bg-muted/30 px-2 flex-1 flex items-center cursor-not-allowed">
            {meta.abilities[0]}
          </div>
        ) : meta.abilities.length > 0 ? (
          <select
            value={threat.ability ?? ''}
            onChange={e => props.onUpdate(threat.id, { ability: e.target.value })}
            className="h-6 text-xs rounded border bg-background px-1 flex-1"
          >
            <option value="">— select —</option>
            {meta.abilities.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        ) : (
          <input
            value={threat.ability ?? ''}
            onChange={e => props.onUpdate(threat.id, { ability: e.target.value })}
            placeholder={threat.species ? 'Loading…' : 'Select Pokémon first'}
            className="h-6 text-xs rounded border bg-background px-2 flex-1 text-muted-foreground"
          />
        )}
      </div>

      {/* Row 3: EVs */}
      <div className="flex items-center gap-1.5 flex-wrap pl-5">
        {(['hp','atk','def','spa','spd','spe'] as (keyof StatsTable)[]).map(stat => (
          <div key={stat} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground w-6">{STAT_NAMES[stat].slice(0,3)}</span>
            <input
              type="number"
              value={threat.evs[stat] ?? 0}
              onFocus={e => e.target.select()}
              onChange={e => props.onUpdate(threat.id, { evs: { ...threat.evs, [stat]: Math.min(32, Math.max(0, parseInt(e.target.value) || 0)) } })}
              className="w-12 h-6 text-[10px] text-center border rounded bg-background"
              min={0} max={32}
            />
          </div>
        ))}
        <div className="flex gap-1 ml-auto">
          {EV_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => props.onUpdate(threat.id, { evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...p.evs } })}
              className="px-1 py-0.5 text-[9px] rounded border bg-background hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: Moves — tappable buttons that open MovePickerDialog */}
      <div className="flex gap-1.5 pl-5">
        {[0,1,2,3].map(i => (
          <button
            key={i}
            onClick={() => setDesktopMovePicker(i)}
            className="flex-1 h-7 px-2 text-xs text-left border rounded bg-background flex items-center justify-between hover:bg-accent transition-colors min-w-0"
          >
            <span className={`truncate ${threat.moves[i] ? '' : 'text-muted-foreground'}`}>
              {threat.moves[i] || `Move ${i + 1}`}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
          </button>
        ))}
      </div>

      {/* Validation errors */}
      {props.errors.length > 0 && (
        <div className="pl-5 space-y-0.5">
          {props.errors.map((err, i) => (
            <p key={i} className="text-[10px] text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />{err}
            </p>
          ))}
        </div>
      )}
    </div>

    {/* Desktop dialogs — same builder components */}
    <ItemPickerDialog
      open={desktopItemOpen}
      onClose={() => setDesktopItemOpen(false)}
      onSelect={item => props.onUpdate(threat.id, { item })}
      canMegaEvolve={false}
      currentItem={threat.item}
      itemUsage={usageData?.items}
    />
    <MovePickerDialog
      open={desktopMovePicker !== null}
      onClose={() => setDesktopMovePicker(null)}
      onSelect={val => {
        if (desktopMovePicker === null) return;
        const moves = [...threat.moves];
        moves[desktopMovePicker] = val;
        props.onUpdate(threat.id, { moves });
      }}
      learnset={meta.learnset}
      currentMoves={threat.moves}
      slotIndex={desktopMovePicker ?? 0}
      moveUsage={usageData?.moves}
    />
    </>
  );
}

// ── Import dialog ──────────────────────────────────────────────────────────

function ImportDialog({ onImport, onCancel }: { onImport: (json: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array');
      onImport(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border rounded-xl p-5 w-full max-w-md shadow-xl space-y-3">
        <h3 className="font-semibold text-sm">Import Threat List</h3>
        <p className="text-xs text-muted-foreground">Paste a previously copied threat list JSON below.</p>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          className="w-full h-32 text-xs font-mono border rounded p-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder='[{"id":"1","species":"Incineroar",...}]'
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleImport}>Import</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────

const FILTER_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

export function MetaThreatEditor({ open, onOpenChange, threats, onSave, onRestoreDefaults, initialFocusThreatId }: MetaThreatEditorProps) {
  const [list, setList] = useState<MetaThreat[]>(threats);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [metaCache, setMetaCache] = useState<Record<string, PokemonMeta>>({});
  const validationErrors: Record<string, string[]> = {};
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pokemonSelectorOpen, setPokemonSelectorOpen] = useState(false);
  const [selectorTargetId, setSelectorTargetId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { formatId } = useFormat();
  const searchNames = useCallback((q: string) => searchPokemonNames(q, formatId), [formatId]);

  // Filter popup state
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showMegasOnly, setShowMegasOnly] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const visibleList = useMemo(() => {
    if (activeFilterCount === 0) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(t => {
      if (q && !t.species.toLowerCase().includes(q)) return false;
      if (showMegasOnly && !isMegaSpecies(t.species)) return false;
      if (selectedTypes.size > 0) {
        const types = metaCache[t.species]?.types || [];
        // Strict: hide threats whose types haven't loaded yet, otherwise the
        // type filter silently includes everything with a cache miss.
        if (types.length === 0 || !types.some(tp => selectedTypes.has(tp))) return false;
      }
      return true;
    });
  }, [list, searchQuery, selectedTypes, showMegasOnly, metaCache, activeFilterCount]);

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

  // Drag state
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Scroll-to-bottom ref
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);

  // Auto-scroll when dragging near edges of the list container
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const EDGE_ZONE = 60; // px from edge to start scrolling
    const SCROLL_SPEED = 8;
    const y = e.clientY;

    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);

    if (y < rect.top + EDGE_ZONE) {
      // Near top — scroll up
      const intensity = 1 - (y - rect.top) / EDGE_ZONE;
      container.scrollTop -= SCROLL_SPEED * Math.max(0.2, intensity);
    } else if (y > rect.bottom - EDGE_ZONE) {
      // Near bottom — scroll down
      const intensity = 1 - (rect.bottom - y) / EDGE_ZONE;
      container.scrollTop += SCROLL_SPEED * Math.max(0.2, intensity);
    }
  }, []);

  // Sync when dialog opens
  useEffect(() => { if (open) setList(threats); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to and briefly highlight the focused threat when opened from the stat popup
  useEffect(() => {
    if (!open || !initialFocusThreatId) return;
    const timer = setTimeout(() => {
      const el = scrollContainerRef.current?.querySelector(`[data-threat-id="${initialFocusThreatId}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(initialFocusThreatId);
      setTimeout(() => setHighlightId(null), 1800);
    }, 120);
    return () => clearTimeout(timer);
  }, [open, initialFocusThreatId]);

  // Fetch species meta when list changes
  useEffect(() => {
    const toFetch = list
      .map(t => t.species.trim())
      .filter(s => s && !metaCache[s]);

    if (toFetch.length === 0) return;
    const unique = [...new Set(toFetch)];
    unique.forEach(async (species) => {
      try {
        const meta = await fetchPokemonMeta(species);
        setMetaCache(prev => ({ ...prev, [species]: meta }));
        // Auto-set mega signature ability (mega pokemon have single locked ability)
        if (isMegaSpecies(species) && meta.abilities[0]) {
          setList(prev => prev.map(t =>
            t.species === species && t.ability !== meta.abilities[0]
              ? { ...t, ability: meta.abilities[0] }
              : t,
          ));
        }
      } catch { /* ignore */ }
    });
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

  const addThreat = () => {
    setList(prev => [{
      id: Date.now().toString(),
      species: '', item: '', nature: 'Adamant', ability: '',
      evs: { hp: 32, atk: 32 }, moves: ['', '', '', ''],
    }, ...prev]);
    // Scroll to top after state update
    setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const moveThreatToTop = (id: string) => {
    setList(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
    setTimeout(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const moveThreatToBottom = (id: string) => {
    setList(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const removeThreat = (id: string) => setList(prev => prev.filter(t => t.id !== id));

  const updateThreat = (id: string, updates: Partial<MetaThreat>) =>
    setList(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

  // Drag handlers
  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (id: string) => setDragOverId(id);
  const handleDrop = () => {
    if (!dragId.current || dragId.current === dragOverId) { setDragOverId(null); return; }
    setList(prev => {
      const from = prev.findIndex(t => t.id === dragId.current);
      const to = prev.findIndex(t => t.id === dragOverId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    dragId.current = null;
    setDragOverId(null);
  };

  // Touch drag handler for grip handles (tablet/mobile)
  const touchDragOverId = useRef<string | null>(null);
  const handleGripTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    e.stopPropagation();
    dragId.current = id;
    touchDragOverId.current = null;

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const touch = ev.touches[0];

      // Auto-scroll near edges
      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const EDGE_ZONE = 60;
        const SCROLL_SPEED = 6;
        if (touch.clientY < rect.top + EDGE_ZONE) {
          container.scrollTop -= SCROLL_SPEED * (1 - (touch.clientY - rect.top) / EDGE_ZONE);
        } else if (touch.clientY > rect.bottom - EDGE_ZONE) {
          container.scrollTop += SCROLL_SPEED * (1 - (rect.bottom - touch.clientY) / EDGE_ZONE);
        }
      }

      // Find which threat row is under the touch point
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el) {
        const row = (el as HTMLElement).closest('[data-threat-id]');
        if (row) {
          const overId = row.getAttribute('data-threat-id');
          if (overId && overId !== dragId.current) {
            touchDragOverId.current = overId;
            setDragOverId(overId);
          }
        }
      }
    };

    const onTouchEnd = () => {
      // Perform the drop using the ref (not stale state)
      const targetId = touchDragOverId.current;
      if (dragId.current && targetId) {
        const fromId = dragId.current;
        setList(prev => {
          const from = prev.findIndex(t => t.id === fromId);
          const to = prev.findIndex(t => t.id === targetId);
          if (from === -1 || to === -1) return prev;
          const next = [...prev];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return next;
        });
      }
      dragId.current = null;
      touchDragOverId.current = null;
      setDragOverId(null);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, []);

  const handleSave = () => {
    onSave(list.filter(t => t.species.trim()));
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(list, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportJson = (json: string) => {
    try {
      const parsed: MetaThreat[] = JSON.parse(json);
      setList(parsed.map((t, i) => ({ ...t, id: t.id || String(Date.now() + i) })));
  
      setShowImport(false);
    } catch { /* ignore */ }
  };

  const handleRestoreDefaults = () => {
    if (!confirm('Restore to default meta threat list? Your current list will be replaced.')) return;
    const dbDefaults = onRestoreDefaults?.() ?? [];
    const source = dbDefaults.length > 0 ? dbDefaults : DEFAULT_META_THREATS;
    setList(source.map(t => ({ ...t })));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-2xl !max-h-[80dvh] sm:!max-h-[92vh] flex flex-col !p-0">
          <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-0">
            <DialogTitle>Edit Meta Threat List</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground px-4 sm:px-5 pb-2">
            {isMobile
              ? 'Tap each field to edit. Drag rows to reorder.'
              : 'Drag rows to reorder. Moves and abilities are validated against each Pokémon\'s legal set before saving.'}
          </p>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 sm:px-5 pb-3 border-b flex-wrap">
            <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs h-8">
              {copied ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copied!' : 'Copy List'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="text-xs h-8">
              <ClipboardPaste className="h-3 w-3 mr-1" /> Import
            </Button>
            <Button size="sm" variant="outline" onClick={handleRestoreDefaults} className="text-xs h-8 text-muted-foreground hover:text-destructive">
              <RotateCcw className="h-3 w-3 mr-1" /> Restore
            </Button>
            <div ref={filterRef} className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterOpen(v => !v)}
                className={`text-xs h-8 ${activeFilterCount > 0 ? 'text-[#d4a017] border-[#d4a017]/40' : ''}`}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
              {filterOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-30 bg-popover border rounded-lg shadow-xl p-3 w-[min(320px,calc(100vw-2rem))] space-y-2.5">
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
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Types</div>
                    <div className="flex flex-wrap gap-1">
                      {FILTER_TYPES.map(type => {
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
                  <div className="flex items-center justify-between gap-2 pt-1 border-t">
                    <button
                      onClick={() => setShowMegasOnly(v => !v)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${showMegasOnly ? 'bg-purple-600 text-white border-purple-600' : 'bg-background text-muted-foreground border-border hover:border-purple-400'}`}
                    >
                      Megas only
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{visibleList.length}/{list.length}</span>
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
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground" title="This threat list is saved with your team. Copy it to transfer to another team, then import and save.">
              <Info className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Saved with team</span>
              <span className="sm:hidden">{list.length}</span>
              <span className="hidden sm:inline">· {list.length} threats</span>
            </span>
          </div>

          {/* Threat list */}
          <div ref={scrollContainerRef} onDragOver={handleContainerDragOver} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
            {visibleList.length === 0 && activeFilterCount > 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No threats match your filters.{' '}
                <button onClick={clearFilters} className="text-[#d4a017] hover:underline">Clear</button>
              </div>
            ) : (
              visibleList.map(threat => (
                <div
                  key={threat.id}
                  data-threat-id={threat.id}
                  className={highlightId === threat.id ? 'ring-2 ring-[#d4a017] rounded-lg transition-shadow' : ''}
                >
                  <ThreatRow
                    threat={threat}
                    metaCache={metaCache}
                    onUpdate={updateThreat}
                    onRemove={removeThreat}
                    onMoveToTop={moveThreatToTop}
                    onMoveToBottom={moveThreatToBottom}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragOver={dragOverId === threat.id}
                    onOpenPokemonSelector={(id) => { setSelectorTargetId(id); setPokemonSelectorOpen(true); }}
                    errors={validationErrors[threat.id] ?? []}
                    isMobile={isMobile}
                    onGripTouchStart={handleGripTouchStart}
                    searchNames={searchNames}
                  />
                </div>
              ))
            )}
            {/* Scroll anchor */}
            <div ref={listEndRef} />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t">
            <Button size="sm" variant="outline" onClick={addThreat} className="h-9">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Threat
            </Button>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
              <Button size="sm" onClick={handleSave} className="h-9">
                Save List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pokémon selector */}
      <PokemonSelector
        open={pokemonSelectorOpen}
        onOpenChange={setPokemonSelectorOpen}
        formatId={formatId}
        showBattleForms
        onSelect={async (species: PokemonSpecies) => {
          const staticDefaults = defaultsForSpecies(species.name);
          if (selectorTargetId) updateThreat(selectorTargetId, { species: species.name, ...staticDefaults });
          setPokemonSelectorOpen(false);
          setSelectorTargetId(null);
          // Fetch usage-based defaults if no static defaults
          if (selectorTargetId && !staticDefaults.item) {
            const usageDefaults = await fetchUsageDefaults(species.name);
            if (usageDefaults) updateThreat(selectorTargetId, { species: species.name, ...usageDefaults });
          }
        }}
      />

      {/* Import dialog overlay */}
      {showImport && (
        <ImportDialog
          onImport={handleImportJson}
          onCancel={() => setShowImport(false)}
        />
      )}
    </>
  );
}
