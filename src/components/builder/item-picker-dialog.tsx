'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ItemIcon } from './item-icon';
import { Search, X } from 'lucide-react';
import { MEGA_STONE_MAP } from '@/lib/constants/mega-stones';

const POPULAR_ITEMS = [
  'Focus Sash', 'Choice Scarf', 'Leftovers', 'Sitrus Berry', 'Lum Berry',
  'Mental Herb', 'White Herb', 'Scope Lens', 'Shell Bell', 'Charcoal',
  'Mystic Water', 'Magnet', 'Black Glasses', 'Miracle Seed', 'Dragon Fang',
  'Fairy Feather', 'Black Belt', 'Sharp Beak', 'Never-Melt Ice', 'Silk Scarf',
  'Focus Band', 'BrightPowder', 'Quick Claw', 'King\'s Rock', 'Light Ball',
  'Metal Coat',
];

const ITEM_CATEGORIES: Record<string, string[]> = {
  'Offensive': ['Charcoal', 'Mystic Water', 'Magnet', 'Miracle Seed', 'Black Glasses', 'Dragon Fang', 'Fairy Feather', 'Black Belt', 'Sharp Beak', 'Never-Melt Ice', 'Silk Scarf', 'Hard Stone', 'Poison Barb', 'Soft Sand', 'TwistedSpoon', 'SilverPowder', 'Spell Tag', 'Metal Coat', 'Scope Lens'],
  'Defensive': ['Focus Sash', 'Focus Band', 'Leftovers', 'Sitrus Berry', 'Shell Bell', 'Lum Berry', 'Oran Berry'],
  'Berries': ['Occa Berry', 'Wacan Berry', 'Rindo Berry', 'Yache Berry', 'Chople Berry', 'Shuca Berry', 'Coba Berry', 'Babiri Berry', 'Roseli Berry', 'Haban Berry', 'Kasib Berry', 'Colbur Berry', 'Chilan Berry'],
  'Support': ['Mental Herb', 'White Herb', 'Choice Scarf', 'BrightPowder', 'Quick Claw', 'King\'s Rock', 'Light Ball'],
};

/** Check if an item is a mega stone */
function isMegaStone(item: { name: string; description?: string | null }): boolean {
  return !!(item.description?.includes('Mega Evolve') ||
    (/ite( [XYZ])?$/i.test(item.name) && item.name.toLowerCase() !== 'eviolite'));
}

/** Get the mega stone name(s) for a given species using the authoritative Showdown map */
function getMegaStonesForSpecies(speciesName: string): string[] {
  if (!speciesName) return [];
  const base = speciesName.replace(/-Mega(-[XYZ])?$/, '');
  const entries = MEGA_STONE_MAP[base];
  if (entries) return entries.map(e => e.stone);
  return [];
}

interface Item {
  id: string;
  name: string;
  description?: string | null;
}

interface UsageEntry { name: string; percent: number; }

interface ItemPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: string) => void;
  canMegaEvolve: boolean;
  /** Species name for filtering mega stones to only the relevant one */
  speciesName?: string;
  currentItem?: string;
  itemUsage?: UsageEntry[];
}

export function ItemPickerDialog({ open, onClose, onSelect, canMegaEvolve, speciesName, currentItem, itemUsage }: ItemPickerDialogProps) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/items?vgc=true&limit=500')
      .then(r => r.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setCatFilter(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Mega stones belonging to this specific Pokemon
  const myMegaStones = useMemo(() => {
    if (!speciesName || !canMegaEvolve) return new Set<string>();
    return new Set(getMegaStonesForSpecies(speciesName).map(s => s.toLowerCase()));
  }, [speciesName, canMegaEvolve]);

  const filtered = useMemo(() => {
    let result = items.filter(i => {
      const mega = isMegaStone(i);
      const isMyStone = mega && myMegaStones.has(i.name.toLowerCase());

      // When "Mega Stones" category is selected, show ALL mega stones
      if (catFilter === 'Mega Stones') {
        return mega && (!search.trim() || i.name.toLowerCase().includes(search.toLowerCase()));
      }

      // In other views: only show this Pokemon's mega stone, hide all others
      if (mega && !isMyStone) {
        // Only show other mega stones if actively searching for them
        if (!search.trim()) return false;
      }

      if (search.trim() && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter) {
        const catItems = ITEM_CATEGORIES[catFilter] || [];
        if (!catItems.some(n => n.toLowerCase() === i.name.toLowerCase())) return false;
      }
      return true;
    });

    // Build usage lookup
    const usageLookup = new Map<string, number>();
    if (itemUsage) {
      for (const u of itemUsage) {
        usageLookup.set(u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.percent);
      }
    }

    if (!search.trim() && !catFilter) {
      result.sort((a, b) => {
        // Sort by usage % first if available
        const aU = usageLookup.get(a.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? -1;
        const bU = usageLookup.get(b.name.toLowerCase().replace(/[^a-z0-9]/g, '')) ?? -1;
        if (aU >= 0 || bU >= 0) return bU - aU;
        const popOrder = POPULAR_ITEMS.map(n => n.toLowerCase());
        const ai = popOrder.indexOf(a.name.toLowerCase());
        const bi = popOrder.indexOf(b.name.toLowerCase());
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [items, search, catFilter, canMegaEvolve, myMegaStones, itemUsage]);

  const itemUsageLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    if (itemUsage) {
      for (const u of itemUsage) {
        lookup.set(u.name.toLowerCase().replace(/[^a-z0-9]/g, ''), u.percent);
      }
    }
    return lookup;
  }, [itemUsage]);

  const popularFiltered = filtered.filter(i => POPULAR_ITEMS.some(n => n.toLowerCase() === i.name.toLowerCase()));
  const showSections = !search.trim() && !catFilter;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="
        !fixed !top-14 !bottom-0 !left-0 !right-0
        !translate-x-0 !translate-y-0
        !max-w-none !rounded-none !rounded-t-xl
        sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
        sm:!-translate-x-1/2 sm:!-translate-y-1/2
        sm:!max-w-lg sm:!max-h-[90vh] sm:!rounded-xl
        flex flex-col gap-0 !p-0
      ">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Select Item</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full h-9 pl-9 pr-8 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="px-4 pb-2 shrink-0 flex gap-1 flex-wrap">
          <button
            onClick={() => setCatFilter(null)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${!catFilter ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
          >
            All
          </button>
          {canMegaEvolve && (
            <button
              onClick={() => setCatFilter(catFilter === 'Mega Stones' ? null : 'Mega Stones')}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${catFilter === 'Mega Stones' ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
            >
              Mega Stones
            </button>
          )}
          {Object.keys(ITEM_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${catFilter === cat ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto border-t">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No items found</div>
          ) : showSections ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                Popular Items
              </div>
              {popularFiltered.map(item => (
                <ItemRow key={item.id} item={item} current={currentItem} onSelect={onSelect} onClose={onClose} usageLookup={itemUsageLookup} />
              ))}
              {filtered.length > popularFiltered.length && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border-t">
                    All Items
                  </div>
                  {filtered.filter(i => !POPULAR_ITEMS.some(n => n.toLowerCase() === i.name.toLowerCase())).map(item => (
                    <ItemRow key={item.id} item={item} current={currentItem} onSelect={onSelect} onClose={onClose} usageLookup={itemUsageLookup} />
                  ))}
                </>
              )}
            </>
          ) : (
            filtered.map(item => (
              <ItemRow key={item.id} item={item} current={currentItem} onSelect={onSelect} onClose={onClose} usageLookup={itemUsageLookup} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemRow({ item, current, onSelect, onClose, usageLookup }: { item: { id: string; name: string; description?: string | null }; current?: string; onSelect: (n: string) => void; onClose: () => void; usageLookup?: Map<string, number> }) {
  const isSelected = current?.toLowerCase() === item.name.toLowerCase();
  return (
    <button
      onClick={() => { onSelect(item.name); onClose(); }}
      className={`w-full text-left px-3 py-2 border-b border-border/40 last:border-0 hover:bg-accent transition-colors flex items-center gap-2.5 ${isSelected ? 'bg-[#d4a017]/10' : ''}`}
    >
      <ItemIcon itemName={item.name} size={28} />
      <div className="min-w-0 flex-1">
        <div className={`font-medium text-sm flex items-center gap-1.5 ${isSelected ? 'text-[#d4a017]' : ''}`}>
          {item.name}
          {(() => {
            const pct = usageLookup?.get(item.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
            return pct != null && pct > 0 ? (
              <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded">{pct}%</span>
            ) : null;
          })()}
        </div>
        {item.description && <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>}
      </div>
      {isSelected && <span className="text-[10px] text-[#d4a017] shrink-0">✓</span>}
    </button>
  );
}
