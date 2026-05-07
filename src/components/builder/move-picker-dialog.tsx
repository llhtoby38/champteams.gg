'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';
import type { Move } from '@/types/pokemon';
import { TYPE_COLORS } from '@/lib/sprites';

const CATEGORY_ICONS: Record<string, string> = {
  Physical: 'https://play.pokemonshowdown.com/sprites/categories/Physical.png',
  Special: 'https://play.pokemonshowdown.com/sprites/categories/Special.png',
  Status: 'https://play.pokemonshowdown.com/sprites/categories/Status.png',
};

const ALL_TYPES = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];

const VGC_POPULAR_MOVES = [
  'Protect','Fake Out','Tailwind','Follow Me','Rage Powder','Wide Guard','Quick Guard',
  'Icy Wind','Helping Hand','Trick Room','Light Screen','Reflect','Aurora Veil',
  'Earthquake','Rock Slide','Heat Wave','Dazzling Gleam','Shadow Ball','Hyper Voice',
  'Flamethrower','Ice Beam','Thunderbolt','Close Combat','Giga Impact','Body Press',
  'Draco Meteor','Dragon Claw','Extreme Speed','Sucker Punch','Thunder Wave',
  'Will-O-Wisp','Spore','Swords Dance','Nasty Plot','Calm Mind',
];

interface UsageEntry { name: string; percent: number; }

interface MovePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (move: string) => void;
  learnset: Move[];
  currentMoves: string[];
  slotIndex: number;
  moveUsage?: UsageEntry[];
}

export function MovePickerDialog({ open, onClose, onSelect, learnset, currentMoves, slotIndex, moveUsage }: MovePickerDialogProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortByPower, setSortByPower] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setCatFilter(null);
      setTypeFilter(null);
      setSortByPower(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = useMemo(() => {
    let moves = [...learnset];
    if (search.trim()) {
      const q = search.toLowerCase();
      moves = moves.filter(m => m.name.toLowerCase().includes(q));
    }
    if (catFilter) moves = moves.filter(m => m.category === catFilter);
    if (typeFilter) moves = moves.filter(m => m.type === typeFilter);
    // Build usage lookup
    const usageLookup = new Map<string, number>();
    if (moveUsage) {
      for (const u of moveUsage) {
        usageLookup.set(u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.percent);
      }
    }

    // Sort: by usage % if available, then popular moves, then by power
    if (sortByPower) {
      moves.sort((a, b) => (b.basePower || 0) - (a.basePower || 0));
    } else if (!search.trim()) {
      const pop = new Set(VGC_POPULAR_MOVES);
      moves.sort((a, b) => {
        const aU = usageLookup.get(a.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? -1;
        const bU = usageLookup.get(b.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? -1;
        if (aU >= 0 || bU >= 0) return bU - aU; // Sort by usage desc
        const aP = pop.has(a.name) ? VGC_POPULAR_MOVES.indexOf(a.name) : 999;
        const bP = pop.has(b.name) ? VGC_POPULAR_MOVES.indexOf(b.name) : 999;
        return aP - bP;
      });
    }
    return moves;
  }, [learnset, search, catFilter, typeFilter, sortByPower, moveUsage]);

  const moveUsageLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    if (moveUsage) {
      for (const u of moveUsage) {
        lookup.set(u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.percent);
      }
    }
    return lookup;
  }, [moveUsage]);

  const usedTypes = useMemo(() => {
    const types = new Set(learnset.map(m => m.type));
    return ALL_TYPES.filter(t => types.has(t));
  }, [learnset]);

  const otherMoves = currentMoves.filter((_, i) => i !== slotIndex);

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
          <DialogTitle className="text-base">Select Move {slotIndex + 1}</DialogTitle>
        </DialogHeader>

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
          {/* Category */}
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
          {/* Types */}
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
          {/* Column headers — sticky */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 border-b sticky top-0 z-10 shrink-0">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ minWidth: 48 }}>Type</span>
            <span className="w-7 shrink-0" />{/* category icon placeholder */}
            <span className="flex-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Move</span>
            <div className="flex gap-2 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="w-8 text-right">PWR</span>
              <span className="w-8 text-right">ACC</span>
              <span className="w-7 text-right">PP</span>
            </div>
          </div>

          {!search && !catFilter && !typeFilter && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 shrink-0">
              VGC Popular · {filtered.length} moves
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No moves found</div>
          ) : (
            <div>
              {filtered.map(m => {
                const typeColor = TYPE_COLORS[m.type] || '#888';
                const alreadyUsed = otherMoves.includes(m.name);
                return (
                  <button
                    key={m.id}
                    onClick={() => { if (!alreadyUsed) { onSelect(m.name); onClose(); } }}
                    disabled={alreadyUsed}
                    className={`w-full text-left px-3 py-2 border-b border-border/40 last:border-0 hover:bg-accent transition-colors flex items-center gap-2 ${alreadyUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {/* Type badge */}
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase"
                      style={{ background: typeColor, color: '#fff', minWidth: 48, textAlign: 'center' }}
                    >
                      {m.type}
                    </span>
                    {/* Category icon */}
                    <img src={CATEGORY_ICONS[m.category]} alt={m.category} width={28} height={12} className="shrink-0 w-7" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm leading-tight">{m.name}</span>
                        {(() => {
                          const pct = moveUsageLookup.get(m.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
                          return pct != null && pct > 0 ? (
                            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded shrink-0">{pct}%</span>
                          ) : null;
                        })()}
                      </div>
                      {m.description && (
                        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{m.description}</span>
                      )}
                    </div>
                    {/* Stats */}
                    <div className="flex gap-2 text-[10px] shrink-0 items-center">
                      <span className="font-mono font-semibold w-8 text-right">{m.basePower > 0 ? m.basePower : '—'}</span>
                      <span className="text-muted-foreground w-8 text-right">{m.accuracy ? `${m.accuracy}%` : '—'}</span>
                      <span className="text-muted-foreground w-7 text-right">{m.pp}</span>
                    </div>
                    {alreadyUsed && <span className="text-[9px] text-muted-foreground ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
