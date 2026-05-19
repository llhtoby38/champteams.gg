'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PokemonSprite } from './pokemon-sprite';
import { TYPE_COLORS } from '@/lib/sprites';
import { PLAYSTYLE_TAGS, POKEMON_ROLE_TAGS } from '@/lib/constants/pokemon-roles';
import type { PokemonSpecies } from '@/types/pokemon';
import { Search, X, Shield, Swords, Tag, Check, Sparkles } from 'lucide-react';
import type { Move } from '@/types/pokemon';

const CATEGORY_ICONS: Record<string, string> = {
  Physical: 'https://play.pokemonshowdown.com/sprites/categories/Physical.png',
  Special: 'https://play.pokemonshowdown.com/sprites/categories/Special.png',
  Status: 'https://play.pokemonshowdown.com/sprites/categories/Status.png',
};

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const GENERATIONS = [
  { label: 'Gen 1', range: [1, 151] },
  { label: 'Gen 2', range: [152, 251] },
  { label: 'Gen 3', range: [252, 386] },
  { label: 'Gen 4', range: [387, 493] },
  { label: 'Gen 5', range: [494, 649] },
  { label: 'Gen 6', range: [650, 721] },
  { label: 'Gen 7', range: [722, 809] },
  { label: 'Gen 8', range: [810, 905] },
  { label: 'Gen 9', range: [906, 1025] },
];

// Group playstyle tags by category for display
const TAG_CATEGORIES = [
  { id: 'offense', label: 'Offense' },
  { id: 'support', label: 'Support' },
  { id: 'defense', label: 'Defense' },
  { id: 'speed-control', label: 'Speed Control' },
  { id: 'weather', label: 'Weather' },
  { id: 'archetype', label: 'Archetype' },
] as const;

type PokemonWithFormat = PokemonSpecies & { isRestricted?: boolean };

interface PokemonSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pokemon: PokemonSpecies) => void;
  formatId?: string;
  /**
   * When true, alternate in-battle forms (Aegislash-Blade, Palafin-Hero, …)
   * are listed as separate selectable entries. Used in the meta threat editor
   * where there's no in-editor form toggle, so users need to pick the exact
   * battle form to calc against. The main team builder leaves this off because
   * the pokemon editor exposes a form toggle.
   */
  showBattleForms?: boolean;
  /**
   * Current team members. When provided, the selector enables team-roster mode:
   *  - already-rostered Pokemon (and any sibling Mega forms of the same base)
   *    are hidden — species clause means you can't run two Charizards regardless
   *    of mega state.
   *  - results are sorted with /api/partners suggestions pinned to the top,
   *    then by tournament meta score so the strongest picks surface first.
   *  - matching partner cards get a small badge.
   * When undefined (e.g. the meta-threat editor's selector), behavior is
   * unchanged.
   */
  teamSpecies?: PokemonSpecies[];
}

/**
 * Family key used to enforce species clause across base + mega forms.
 * Mega forms collapse to their base species name so a Charizard on the team
 * hides Charizard-Mega-X and Charizard-Mega-Y. Regional forms (Tauros-Paldea-*)
 * are distinct species under the clause, so they keep their own keys.
 */
function speciesFamilyKey(p: { name: string; baseSpecies?: string | null; tags?: string[] | null }): string {
  const isMega = !!p.tags?.includes('Mega Evolution') || /-Mega(-[XYZ])?$/.test(p.name);
  if (isMega && p.baseSpecies) return p.baseSpecies;
  return p.name;
}

const VGC_POPULAR_MOVES = [
  'Protect','Fake Out','Tailwind','Follow Me','Rage Powder','Wide Guard','Quick Guard',
  'Icy Wind','Helping Hand','Trick Room','Light Screen','Reflect','Aurora Veil',
  'Earthquake','Rock Slide','Heat Wave','Dazzling Gleam','Shadow Ball','Hyper Voice',
  'Flamethrower','Ice Beam','Thunderbolt','Close Combat','Body Press',
  'Draco Meteor','Dragon Claw','Extreme Speed','Sucker Punch','Thunder Wave',
  'Will-O-Wisp','Swords Dance','Nasty Plot','Calm Mind',
];

/** Sub-dialog for picking moves to filter by — mirrors MovePickerDialog UI with multi-select */
function MoveFilterDialog({ open, onClose, selectedMoves, onToggleMove }: {
  open: boolean; onClose: () => void; selectedMoves: Set<string>;
  onToggleMove: (move: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortByPower, setSortByPower] = useState(false);
  const inputRef = useCallback((el: HTMLInputElement | null) => { if (el && open) setTimeout(() => el.focus(), 80); }, [open]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCatFilter(null);
    setTypeFilter(null);
    setSortByPower(false);
    if (allMoves.length > 0) return; // already loaded
    setLoading(true);
    fetch('/api/moves?limit=1000')
      .then(r => r.json())
      .then(data => { setAllMoves(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let moves = [...allMoves];
    if (search.trim()) {
      const q = search.toLowerCase();
      moves = moves.filter(m => m.name.toLowerCase().includes(q));
    }
    if (catFilter) moves = moves.filter(m => m.category === catFilter);
    if (typeFilter) moves = moves.filter(m => m.type === typeFilter);
    if (sortByPower) {
      moves.sort((a, b) => (b.basePower || 0) - (a.basePower || 0));
    } else if (!search.trim()) {
      const pop = new Set(VGC_POPULAR_MOVES);
      moves.sort((a, b) => {
        const aP = pop.has(a.name) ? VGC_POPULAR_MOVES.indexOf(a.name) : 999;
        const bP = pop.has(b.name) ? VGC_POPULAR_MOVES.indexOf(b.name) : 999;
        return aP - bP;
      });
    }
    return moves;
  }, [allMoves, search, catFilter, typeFilter, sortByPower]);

  const usedTypes = useMemo(() => {
    const types = new Set(allMoves.map(m => m.type));
    return ALL_TYPES.filter(t => types.has(t));
  }, [allMoves]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="
        !fixed !top-14 !bottom-0 !left-0 !right-0
        !translate-x-0 !translate-y-0
        !max-w-none !rounded-none !rounded-t-xl
        sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
        sm:!-translate-x-1/2 sm:!-translate-y-1/2
        sm:!max-w-2xl sm:!max-h-[90vh] sm:!rounded-xl
        flex flex-col gap-0 !p-0
      ">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Filter by Moves</DialogTitle>
          <p className="text-[10px] text-muted-foreground">Select moves — only Pokemon that learn ALL selected moves will be shown</p>
        </DialogHeader>

        {/* Selected move pills */}
        {selectedMoves.size > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1 shrink-0">
            {Array.from(selectedMoves).map(move => (
              <button key={move} onClick={() => onToggleMove(move)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4a017] text-white flex items-center gap-1">
                {move} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search moves..."
              className="w-full h-9 pl-9 pr-8 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-2 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Physical', 'Special', 'Status'].map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-all ${catFilter === cat ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
              >
                <img src={CATEGORY_ICONS[cat]} alt={cat} width={24} height={11} className="shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {cat}
              </button>
            ))}
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={() => setSortByPower(!sortByPower)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-all ${sortByPower ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
            >
              Sort by Power ↓
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {usedTypes.map(type => {
              const color = TYPE_COLORS[type] || '#888';
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-all"
                  style={{
                    backgroundColor: active ? color : `${color}22`,
                    color: active ? '#fff' : color,
                    border: `1px solid ${color}55`,
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Move list */}
        <div className="flex-1 overflow-y-auto border-t flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 border-b sticky top-0 z-10 shrink-0">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ minWidth: 48 }}>Type</span>
            <span className="w-7 shrink-0" />
            <span className="flex-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Move</span>
            <div className="flex gap-2 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="w-8 text-right">PWR</span>
              <span className="w-8 text-right">ACC</span>
              <span className="w-7 text-right">PP</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading moves...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No moves found</div>
          ) : (
            <div>
              {filtered.map(m => {
                const typeColor = TYPE_COLORS[m.type] || '#888';
                const active = selectedMoves.has(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => onToggleMove(m.name)}
                    className={`w-full text-left px-3 py-2 border-b border-border/40 last:border-0 hover:bg-accent transition-colors flex items-center gap-2 ${active ? 'bg-[#d4a017]/10' : ''}`}
                  >
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase"
                      style={{ background: typeColor, color: '#fff', minWidth: 48, textAlign: 'center' }}
                    >
                      {m.type}
                    </span>
                    <img src={CATEGORY_ICONS[m.category]} alt={m.category} width={28} height={12} className="shrink-0 w-7" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block leading-tight">{m.name}</span>
                      {m.description && (
                        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{m.description}</span>
                      )}
                    </div>
                    <div className="flex gap-2 text-[10px] shrink-0 items-center">
                      <span className="font-mono font-semibold w-8 text-right">{m.basePower > 0 ? m.basePower : '—'}</span>
                      <span className="text-muted-foreground w-8 text-right">{m.accuracy ? `${m.accuracy}%` : '—'}</span>
                      <span className="text-muted-foreground w-7 text-right">{m.pp}</span>
                    </div>
                    {active && <Check className="h-4 w-4 text-[#d4a017] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t flex items-center justify-between shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {selectedMoves.size > 0 ? `${selectedMoves.size} move${selectedMoves.size > 1 ? 's' : ''} selected` : 'No filter active'}
          </span>
          <button onClick={onClose} className="text-xs px-4 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 font-medium">
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** VGC-relevant abilities shown at the top when no search is active */
const VGC_POPULAR_ABILITIES = [
  'Intimidate', 'Drizzle', 'Drought', 'Sand Stream', 'Snow Warning',
  'Swift Swim', 'Chlorophyll', 'Sand Rush', 'Slush Rush',
  'Prankster', 'Defiant', 'Competitive', 'Clear Body',
  'Levitate', 'Flash Fire', 'Volt Absorb', 'Water Absorb', 'Lightning Rod', 'Storm Drain',
  'Huge Power', 'Pure Power', 'Adaptability', 'Pixilate', 'Refrigerate', 'Aerilate',
  'Shadow Tag', 'Arena Trap', 'Magic Bounce',
  'Friend Guard', 'Telepathy', 'Inner Focus',
  'Multiscale', 'Sturdy', 'Regenerator', 'Natural Cure',
  'Speed Boost', 'Unburden', 'Gale Wings',
  'Parental Bond', 'Tough Claws', 'Stance Change', 'Zero to Hero',
];

interface AbilityRow {
  id: string;
  name: string;
  description: string | null;
  rating: number | null;
}

/** Sub-dialog for picking abilities to filter by */
function AbilityFilterDialog({ open, onClose, selectedAbilities, onToggleAbility }: {
  open: boolean; onClose: () => void; selectedAbilities: Set<string>;
  onToggleAbility: (ability: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [allAbilities, setAllAbilities] = useState<AbilityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useCallback((el: HTMLInputElement | null) => { if (el && open) setTimeout(() => el.focus(), 80); }, [open]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    if (allAbilities.length > 0) return;
    setLoading(true);
    fetch('/api/abilities?all=true')
      .then(r => r.json())
      .then(data => { setAllAbilities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let abs = [...allAbilities];
    if (search.trim()) {
      const q = search.toLowerCase();
      abs = abs.filter(a => a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
    } else {
      // Sort popular abilities to top
      const pop = new Set(VGC_POPULAR_ABILITIES);
      abs.sort((a, b) => {
        const aP = pop.has(a.name) ? VGC_POPULAR_ABILITIES.indexOf(a.name) : 999;
        const bP = pop.has(b.name) ? VGC_POPULAR_ABILITIES.indexOf(b.name) : 999;
        if (aP !== bP) return aP - bP;
        return a.name.localeCompare(b.name);
      });
    }
    return abs;
  }, [allAbilities, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="
        !fixed !top-14 !bottom-0 !left-0 !right-0
        !translate-x-0 !translate-y-0
        !max-w-none !rounded-none !rounded-t-xl
        sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
        sm:!-translate-x-1/2 sm:!-translate-y-1/2
        sm:!max-w-2xl sm:!max-h-[90vh] sm:!rounded-xl
        flex flex-col gap-0 !p-0
      ">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Filter by Ability</DialogTitle>
          <p className="text-[10px] text-muted-foreground">Select abilities — only Pokemon with ANY selected ability will be shown</p>
        </DialogHeader>

        {/* Selected ability pills */}
        {selectedAbilities.size > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1 shrink-0">
            {Array.from(selectedAbilities).map(ab => (
              <button key={ab} onClick={() => onToggleAbility(ab)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                {ab} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search abilities..."
              className="w-full h-9 pl-9 pr-8 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Ability list */}
        <div className="flex-1 overflow-y-auto border-t flex flex-col">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading abilities...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No abilities found</div>
          ) : (
            <div>
              {filtered.map(a => {
                const active = selectedAbilities.has(a.name);
                return (
                  <button
                    key={a.id}
                    onClick={() => onToggleAbility(a.name)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/40 last:border-0 hover:bg-accent transition-colors flex items-center gap-2 ${active ? 'bg-blue-600/10' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block leading-tight">{a.name}</span>
                      {a.description && (
                        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{a.description}</span>
                      )}
                    </div>
                    {active && <Check className="h-4 w-4 text-blue-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t flex items-center justify-between shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {selectedAbilities.size > 0 ? `${selectedAbilities.size} abilit${selectedAbilities.size > 1 ? 'ies' : 'y'} selected` : 'No filter active'}
          </span>
          <button onClick={onClose} className="text-xs px-4 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 font-medium">
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Sub-dialog for picking playstyle tags */
function PlaystyleFilterDialog({ open, onClose, selectedTags, onToggleTag }: {
  open: boolean; onClose: () => void; selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:!max-w-md !p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Filter by Playstyle</DialogTitle>
          <p className="text-[10px] text-muted-foreground">Select roles — Pokemon tagged with ANY selected role will be shown</p>
        </DialogHeader>
        {selectedTags.size > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {Array.from(selectedTags).map(tag => {
              const info = PLAYSTYLE_TAGS.find(t => t.id === tag);
              return (
                <button key={tag} onClick={() => onToggleTag(tag)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#c0392b] text-white flex items-center gap-1">
                  {info?.label || tag} <X className="h-2.5 w-2.5" />
                </button>
              );
            })}
          </div>
        )}
        <div className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {TAG_CATEGORIES.map(cat => {
            const tags = PLAYSTYLE_TAGS.filter(t => t.category === cat.id);
            if (tags.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{cat.label}</div>
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => {
                    const active = selectedTags.has(tag.id);
                    return (
                      <button key={tag.id} onClick={() => onToggleTag(tag.id)}
                        title={tag.description}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                          active ? 'bg-[#c0392b] text-white border-[#c0392b]' : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}>
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t flex justify-end">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90">
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PokemonSelector({ open, onOpenChange, onSelect, formatId = 'season-m1', showBattleForms = false, teamSpecies }: PokemonSelectorProps) {
  const [search, setSearch] = useState('');
  const [allPokemon, setAllPokemon] = useState<PokemonWithFormat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedGen, setSelectedGen] = useState<number[] | null>(null);
  const [showMegasOnly, setShowMegasOnly] = useState(false);
  const [derivedTags, setDerivedTags] = useState<Record<string, string[]>>({});
  // Team-roster mode: partner scores indexed by canonical pokemon id (e.g.
  // "garchomp"). Tier data per id powers the secondary sort + on-card stats.
  const [partnerScoreById, setPartnerScoreById] = useState<Record<string, number>>({});
  const [tierDataById, setTierDataById] = useState<Record<string, { metaScore: number; usage: number | null; winRate: number | null }>>({});
  const rosterMode = !!teamSpecies && teamSpecies.length > 0;

  // Move filter state
  const [moveFilterMoves, setMoveFilterMoves] = useState<Set<string>>(new Set());
  const [moveFilterOpen, setMoveFilterOpen] = useState(false);

  // Ability filter state
  const [abilityFilter, setAbilityFilter] = useState<Set<string>>(new Set());
  const [abilityFilterOpen, setAbilityFilterOpen] = useState(false);

  // Playstyle filter state
  const [playstyleTags, setPlaystyleTags] = useState<Set<string>>(new Set());
  const [playstyleOpen, setPlaystyleOpen] = useState(false);

  const toggleMoveFilter = useCallback((move: string) => {
    setMoveFilterMoves(prev => {
      const next = new Set(prev);
      if (next.has(move)) next.delete(move); else next.add(move);
      return next;
    });
  }, []);

  const toggleAbilityFilter = useCallback((ability: string) => {
    setAbilityFilter(prev => {
      const next = new Set(prev);
      if (next.has(ability)) next.delete(ability); else next.add(ability);
      return next;
    });
  }, []);

  const togglePlaystyleTag = useCallback((tag: string) => {
    setPlaystyleTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }, []);

  // Reset transient filter inputs whenever the dialog re-opens, so users
  // don't reopen the picker to find their previous search still typed in.
  // (Persistent filters like type / playstyle are intentionally retained
  // since they're set via deliberate clicks, not free-text typing.)
  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  // Fetch Pokemon filtered to the active format (and optionally by moves)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: '2000', format: formatId });
    if (moveFilterMoves.size > 0) {
      params.set('moves', Array.from(moveFilterMoves).join(','));
    }
    fetch(`/api/pokemon?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAllPokemon(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, formatId, moveFilterMoves]);

  // Fetch derived playstyle index (abilities + learnsets → tags) once per format/open
  useEffect(() => {
    if (!open) return;
    fetch(`/api/pokemon/playstyle-index?format=${formatId}`)
      .then(r => r.json())
      .then(data => { if (data && typeof data === 'object') setDerivedTags(data); })
      .catch(() => {});
  }, [open, formatId]);

  // Team-roster mode: fetch partner suggestions for the current team.
  // We pass the full team as both `species` (anchors) and `exclude` so the API
  // never includes a Pokemon already on the team in its returned partner list.
  // We don't pass partners through to the actual exclusion filter here — that's
  // done client-side via speciesFamilyKey so megas get filtered too.
  const teamNamesKey = (teamSpecies ?? []).map(s => s.name).sort().join('|');
  useEffect(() => {
    if (!open || !rosterMode) { setPartnerScoreById({}); return; }
    const ctl = new AbortController();
    const params = new URLSearchParams();
    for (const s of teamSpecies!) params.append('species', s.name);
    for (const s of teamSpecies!) params.append('exclude', s.name);
    params.set('limit', '20');
    fetch(`/api/partners?${params}`, { signal: ctl.signal })
      .then(r => r.ok ? r.json() : { partners: [] })
      .then((data: { partners?: { pokemonId: string; score: number }[] }) => {
        const map: Record<string, number> = {};
        for (const p of data.partners ?? []) map[p.pokemonId] = p.score;
        setPartnerScoreById(map);
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [open, rosterMode, teamNamesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Team-roster mode: fetch tier-list data — meta score for ordering and
  // usage% + WR for the on-card stats badge.
  useEffect(() => {
    if (!open || !rosterMode) { setTierDataById({}); return; }
    const ctl = new AbortController();
    fetch(`/api/tier-list?format=${formatId}`, { signal: ctl.signal })
      .then(r => r.ok ? r.json() : { tiers: [] })
      .then((data: { tiers?: { pokemon?: { id: string; metaScore: number; tournamentUsage: number | null; winRate: number | null }[] }[] }) => {
        const map: Record<string, { metaScore: number; usage: number | null; winRate: number | null }> = {};
        for (const t of data.tiers ?? []) {
          for (const p of t.pokemon ?? []) {
            map[p.id] = { metaScore: p.metaScore, usage: p.tournamentUsage, winRate: p.winRate };
          }
        }
        setTierDataById(map);
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [open, rosterMode, formatId]);

  // Client-side filtering (search, type, gen, mega, playstyle)
  const filtered = useMemo(() => {
    let result = allPokemon;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (selectedTypes.size > 0) {
      result = result.filter((p) =>
        p.types.some((t) => selectedTypes.has(t)),
      );
    }

    if (selectedGen) {
      result = result.filter(
        (p) => p.dexNum >= selectedGen[0] && p.dexNum <= selectedGen[1],
      );
    }

    // Playstyle filter — match ANY selected tag (union of static + derived tags)
    if (playstyleTags.size > 0) {
      result = result.filter((p) => {
        const staticRoles = POKEMON_ROLE_TAGS[p.name] || [];
        const derived = derivedTags[p.name] || [];
        const all = new Set([...staticRoles, ...derived]);
        for (const r of all) if (playstyleTags.has(r)) return true;
        return false;
      });
    }

    // Ability filter — match ANY selected ability
    if (abilityFilter.size > 0) {
      result = result.filter((p) => {
        const pokemonAbilities = Object.values((p.abilities || {}) as Record<string, string>);
        return pokemonAbilities.some(a => abilityFilter.has(a));
      });
    }

    // Hide battle forms that have a toggle button in the editor (e.g., Aegislash-Blade, Palafin-Hero).
    // In the main builder the pokemon editor has a form toggle, so listing both
    // would be redundant. Meta threat editor opts in via `showBattleForms`.
    if (!showBattleForms) {
      const HIDDEN_BATTLE_FORMS = new Set(['Aegislash-Blade', 'Palafin-Hero']);
      result = result.filter(p => !HIDDEN_BATTLE_FORMS.has(p.name));
    }

    // Mega handling: megas are always visible alongside base forms so users can
    // pick them directly; team-builder intercepts selection and auto-equips the
    // corresponding mega stone. The "Megas only" toggle narrows to just megas.
    if (showMegasOnly) {
      result = result.filter(
        (p) => p.tags?.includes('Mega Evolution') || p.name.includes('-Mega'),
      );
    }

    // Team-roster mode: hide Pokemon whose family is already on the team.
    // A Pokemon's family includes both its base form and all megas of that
    // base, so adding "Charizard" hides Charizard-Mega-X / Charizard-Mega-Y.
    // Regional forms (Tauros-Paldea-Aqua etc.) get their own family keys, so
    // they remain selectable alongside the original.
    if (rosterMode) {
      const teamFamilyKeys = new Set((teamSpecies ?? []).map(s => speciesFamilyKey(s)));
      result = result.filter(p => !teamFamilyKeys.has(speciesFamilyKey(p)));
    }

    // Team-roster ordering: partners first (descending partner score), then
    // remaining Pokemon by tournament meta score, with no-data Pokemon falling
    // back to whatever upstream order they came in. We only override the
    // default order when in roster mode — the meta-threat editor's selector
    // keeps its dex-based listing.
    if (rosterMode) {
      // Stable sort: copy index so ties resolve to original order (which is
      // already base-form-first by dex from the API).
      const indexed = result.map((p, i) => ({ p, i }));
      indexed.sort((a, b) => {
        const aP = partnerScoreById[a.p.id] ?? -1;
        const bP = partnerScoreById[b.p.id] ?? -1;
        if (aP !== bP) return bP - aP; // partner score desc
        const aM = tierDataById[a.p.id]?.metaScore ?? -1;
        const bM = tierDataById[b.p.id]?.metaScore ?? -1;
        if (aM !== bM) return bM - aM; // meta score desc
        return a.i - b.i; // stable fallback
      });
      result = indexed.map(x => x.p);
    }

    return result;
  }, [allPokemon, search, selectedTypes, selectedGen, showMegasOnly, abilityFilter, playstyleTags, derivedTags, showBattleForms, rosterMode, teamSpecies, partnerScoreById, tierDataById]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTypes(new Set());
    setSelectedGen(null);
    setShowMegasOnly(false);
    setMoveFilterMoves(new Set());
    setAbilityFilter(new Set());
    setPlaystyleTags(new Set());
  };

  const hasFilters = selectedTypes.size > 0 || selectedGen !== null || showMegasOnly || moveFilterMoves.size > 0 || abilityFilter.size > 0 || playstyleTags.size > 0;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          !fixed !top-14 !bottom-0 !left-0 !right-0
          !translate-x-0 !translate-y-0
          !max-w-none !rounded-none !rounded-t-xl
          sm:!top-[5vh] sm:!bottom-auto sm:!left-1/2 sm:!right-auto
          sm:!-translate-x-1/2 sm:!translate-y-0
          sm:!w-[92vw] sm:!max-w-[1400px] sm:!h-[90vh] sm:!rounded-2xl
          flex flex-col !p-0
        "
      >
        {/* Scrollable wrapper: on mobile everything scrolls, on desktop only grid scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto sm:overflow-visible sm:flex sm:flex-col sm:flex-1">
        <div className="px-5 pt-5 pb-0 space-y-3 sm:shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="!text-xl">Select a Pokemon</DialogTitle>
            <span className="text-xs text-muted-foreground">
              {filtered.length} Pokemon
            </span>
          </div>

          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Pokemon by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Type filter bubbles — hidden on mobile when searching */}
          <div className={`flex flex-wrap gap-1.5 ${search ? 'hidden sm:flex' : ''}`}>
            {ALL_TYPES.map((type) => {
              const active = selectedTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide transition-all ${
                    active
                      ? 'text-white shadow-sm scale-105'
                      : 'text-white/70 opacity-40 hover:opacity-75'
                  }`}
                  style={{ backgroundColor: TYPE_COLORS[type] || '#777' }}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Secondary filters row */}
          <div className={`flex flex-wrap gap-1.5 items-center pb-1 ${search ? 'hidden sm:flex' : ''}`}>
            {GENERATIONS.map((gen) => {
              const active =
                selectedGen !== null &&
                selectedGen[0] === gen.range[0] &&
                selectedGen[1] === gen.range[1];
              return (
                <button
                  key={gen.label}
                  onClick={() => setSelectedGen(active ? null : gen.range)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                  }`}
                >
                  {gen.label}
                </button>
              );
            })}

            <div className="w-px h-4 bg-border mx-0.5" />

            <button
              onClick={() => setShowMegasOnly(!showMegasOnly)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                showMegasOnly
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-background text-muted-foreground border-border hover:border-purple-400'
              }`}
            >
              Mega
            </button>

            {/* Move Filter button */}
            <button
              onClick={() => setMoveFilterOpen(true)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                moveFilterMoves.size > 0
                  ? 'bg-[#d4a017] text-white border-[#d4a017]'
                  : 'bg-background text-muted-foreground border-border hover:border-[#d4a017]/50'
              }`}
            >
              <Swords className="h-3 w-3" />
              Moves{moveFilterMoves.size > 0 ? ` (${moveFilterMoves.size})` : ''}
            </button>

            {/* Ability Filter button */}
            <button
              onClick={() => setAbilityFilterOpen(true)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                abilityFilter.size > 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-400/50'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Ability{abilityFilter.size > 0 ? ` (${abilityFilter.size})` : ''}
            </button>

            {/* Playstyle Filter button */}
            <button
              onClick={() => setPlaystyleOpen(true)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                playstyleTags.size > 0
                  ? 'bg-[#c0392b] text-white border-[#c0392b]'
                  : 'bg-background text-muted-foreground border-border hover:border-[#c0392b]/50'
              }`}
            >
              <Tag className="h-3 w-3" />
              Playstyle{playstyleTags.size > 0 ? ` (${playstyleTags.size})` : ''}
            </button>

            {hasFilters && (
              <>
                <div className="w-px h-4 bg-border mx-0.5" />
                <button
                  onClick={clearFilters}
                  className="text-[11px] px-2.5 py-1 rounded-full text-destructive hover:bg-destructive/10 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Active filter pills summary */}
          {(moveFilterMoves.size > 0 || playstyleTags.size > 0) && (
            <div className="flex flex-wrap gap-1 pb-1">
              {Array.from(moveFilterMoves).map(move => (
                <span key={`m-${move}`} onClick={() => toggleMoveFilter(move)}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#d4a017]/15 text-[#d4a017] border border-[#d4a017]/30 cursor-pointer hover:bg-[#d4a017]/25 flex items-center gap-0.5">
                  {move} <X className="h-2 w-2" />
                </span>
              ))}
              {Array.from(playstyleTags).map(tag => {
                const info = PLAYSTYLE_TAGS.find(t => t.id === tag);
                return (
                  <span key={`t-${tag}`} onClick={() => togglePlaystyleTag(tag)}
                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#c0392b]/15 text-[#c0392b] border border-[#c0392b]/30 cursor-pointer hover:bg-[#c0392b]/25 flex items-center gap-0.5">
                    {info?.label || tag} <X className="h-2 w-2" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Pokemon grid */}
        <div className="sm:flex-1 sm:min-h-0 sm:overflow-y-auto overscroll-contain px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Loading Pokemon...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No Pokemon match your filters
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 2xl:grid-cols-13 gap-2 pt-1">
              {filtered.map((p) => {
                const isPartner = rosterMode && partnerScoreById[p.id] != null;
                const tier = rosterMode ? tierDataById[p.id] : undefined;
                return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onOpenChange(false);
                  }}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-all group relative ${
                    isPartner
                      ? 'border-[#d4a017]/50 bg-[#d4a017]/5 hover:border-[#d4a017] hover:bg-[#d4a017]/10'
                      : 'border-transparent hover:border-primary/40 hover:bg-accent'
                  }`}
                  title={(() => {
                    const allTags = Array.from(new Set([
                      ...(POKEMON_ROLE_TAGS[p.name] || []),
                      ...(derivedTags[p.name] || []),
                    ]));
                    const tagLabels = allTags.map(r => PLAYSTYLE_TAGS.find(t => t.id === r)?.label || r).join(', ');
                    const partnerNote = isPartner ? '\nSuggested partner for your team' : '';
                    return `${p.name} — ${p.types.join('/')}${tagLabels ? '\n' + tagLabels : ''}${partnerNote}`;
                  })()}
                >
                  {/* Suggested-partner badge (team-roster mode only) */}
                  {isPartner && (
                    <div
                      className="absolute top-1 left-1 flex items-center justify-center bg-[#d4a017] text-white rounded-full h-4 w-4 shadow-sm"
                      title="Suggested partner for your team"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                    </div>
                  )}
                  {/* Restricted badge */}
                  {p.isRestricted && (
                    <div className="absolute top-1 right-1" title="Restricted">
                      <Shield className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  )}
                  <PokemonSprite
                    spriteId={p.spriteId}
                    dexNum={p.dexNum}
                    name={p.name}
                    size={72}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <div className="text-[11px] font-medium truncate max-w-full mt-1 leading-tight text-center">
                    {p.name}
                  </div>
                  <div className="flex gap-0.5 mt-0.5">
                    {p.types.map((t) => (
                      <span
                        key={t}
                        className="block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[t] }}
                        title={t}
                      />
                    ))}
                  </div>
                  {/* Tournament usage + WR — only rendered in roster mode, and
                      only when the Pokemon has actually placed in tournaments
                      (otherwise the row would just be a long line of dashes). */}
                  {tier && (tier.usage != null || tier.winRate != null) && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] tabular-nums leading-none">
                      {tier.usage != null && (
                        <span className="text-blue-500 font-semibold" title="Tournament usage">
                          {tier.usage.toFixed(1)}%
                        </span>
                      )}
                      {tier.winRate != null && (
                        <span className={tier.winRate >= 50 ? 'text-green-600' : 'text-muted-foreground'} title="Win rate">
                          {tier.winRate.toFixed(0)}WR
                        </span>
                      )}
                    </div>
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>
        </div>{/* close scrollable wrapper */}
      </DialogContent>
    </Dialog>

    {/* Move filter sub-dialog */}
    <MoveFilterDialog
      open={moveFilterOpen}
      onClose={() => setMoveFilterOpen(false)}
      selectedMoves={moveFilterMoves}
      onToggleMove={toggleMoveFilter}
    />

    {/* Ability filter sub-dialog */}
    <AbilityFilterDialog
      open={abilityFilterOpen}
      onClose={() => setAbilityFilterOpen(false)}
      selectedAbilities={abilityFilter}
      onToggleAbility={toggleAbilityFilter}
    />

    {/* Playstyle filter sub-dialog */}
    <PlaystyleFilterDialog
      open={playstyleOpen}
      onClose={() => setPlaystyleOpen(false)}
      selectedTags={playstyleTags}
      onToggleTag={togglePlaystyleTag}
    />
    </>
  );
}
