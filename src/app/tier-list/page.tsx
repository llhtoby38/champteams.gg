'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Info, TrendingUp, X } from 'lucide-react';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { PokemonDetailPopup } from '@/components/pokemon-detail-popup';
import { importToBuilder, buildSetFromUsage, addToMetaThreats, type DefaultSet } from '@/lib/import-to-builder';
import { Button } from '@/components/ui/button';

interface TierPokemon {
  id: string;
  name: string;
  types: string[];
  spriteId: string;
  metaScore: number;
  tournamentUsage: number | null;
  winRate: number | null;
  ladderUsage: number | null;
  momentum: number;
  description?: string | null;
  previousTier?: string | null;
  movementNote?: string | null;
  moves?: { name: string; percent: number; type: string | null; category: string | null }[] | null;
  items?: { name: string; percent: number }[] | null;
  usageAbilities?: { name: string; percent: number }[] | null;
  spreads?: { nature: string; evs: string; percent: number }[] | null;
  teammates?: { name: string; percent: number }[] | null;
}

interface TierGroup {
  tier: string;
  pokemon: TierPokemon[];
}

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  S: { bg: 'bg-[#d4a017]', text: 'text-[#0f0f1a]', label: 'S — Meta Defining' },
  A: { bg: 'bg-[#c0392b]', text: 'text-white', label: 'A — Strong' },
  B: { bg: 'bg-[#3b82f6]', text: 'text-white', label: 'B — Viable' },
  C: { bg: 'bg-[#6b7280]', text: 'text-white', label: 'C — Niche' },
  D: { bg: 'bg-[#374151]', text: 'text-white', label: 'D — Situational' },
};

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0', Electric: '#F7D02C',
  Grass: '#7AC74C', Ice: '#96D9D6', Fighting: '#C22E28', Poison: '#A33EA1',
  Ground: '#E2BF65', Flying: '#A98FF3', Psychic: '#F95587', Bug: '#A6B91A',
  Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC', Dark: '#705746',
  Steel: '#B7B7CE', Fairy: '#D685AD',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#d4a017';
  if (score >= 45) return '#c0392b';
  if (score >= 25) return '#3b82f6';
  if (score >= 10) return '#6b7280';
  return '#374151';
}

const TIER_ORDER = 'SABCD';

function TierListPageInner() {
  const searchParams = useSearchParams();
  const pokemonParam = searchParams.get('pokemon');
  const [tiers, setTiers] = useState<TierGroup[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [formula, setFormula] = useState<string>('');
  const [selectedPokemon, setSelectedPokemon] = useState<TierPokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [showD, setShowD] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dataRange, setDataRange] = useState<{ earliest: string; latest: string; tournamentCount: number; teamCount: number } | null>(null);
  const [defaultSetsMap, setDefaultSetsMap] = useState<Record<string, DefaultSet>>({});
  const [formulaOpen, setFormulaOpen] = useState(false);
  const formulaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!formulaOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (formulaRef.current && !formulaRef.current.contains(e.target as Node)) setFormulaOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [formulaOpen]);
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  useEffect(() => {
    fetch('/api/tier-list')
      .then(r => r.json())
      .then(data => {
        setTiers(data.tiers || []);
        setSnapshotDate(data.snapshotDate);
        setFormula(data.formula || '');
        setDataRange(data.dataRange || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch default sets for auto-fill
    fetch('/api/default-sets')
      .then(r => r.json())
      .then(data => setDefaultSetsMap(data || {}))
      .catch(() => {});
  }, []);

  // Auto-scroll to Pokemon and open popup when linked from browse page
  useEffect(() => {
    if (!pokemonParam || loading || didAutoOpen || tiers.length === 0) return;

    for (const group of tiers) {
      const found = group.pokemon.find(p => p.id === pokemonParam);
      if (found) {
        // If it's in D tier, make sure D tier is visible
        if (group.tier === 'D') setShowD(true);

        setSelectedPokemon(found);
        setDidAutoOpen(true);

        // Scroll to the tier section after a brief delay for render
        setTimeout(() => {
          const el = document.getElementById(`tier-${group.tier}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      }
    }
  }, [pokemonParam, loading, tiers, didAutoOpen]);

  const visibleTiers = showD ? tiers : tiers.filter(t => t.tier !== 'D');

  function handleAddToBuilder(p: TierPokemon, spreadIndex: number) {
    const ds = defaultSetsMap[p.id] || null;
    const set = buildSetFromUsage(p, spreadIndex, ds);
    importToBuilder({ name: `${p.name} Set`, pokemon: [set] });
  }

  function handleAddToMetaThreats(p: TierPokemon, spreadIndex: number) {
    const ds = defaultSetsMap[p.id] || null;
    addToMetaThreats(p, spreadIndex, ds);
    setSelectedPokemon(null);
    setToastMsg(`${p.name} added to Meta Threats`);
    setTimeout(() => setToastMsg(null), 2000);
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground">← Back to Browse</Link>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-7 h-7 text-[#d4a017]" />
                  Pokémon Champions Tier List
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Reg M-A — VGC Doubles · {snapshotDate ? `Updated ${snapshotDate}` : 'Loading…'}
                </p>
                {dataRange && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on {dataRange.teamCount.toLocaleString()} teams across {dataRange.tournamentCount} tournaments ({dataRange.earliest} → {dataRange.latest})
                  </p>
                )}
              </div>
              <div ref={formulaRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFormulaOpen(v => !v)}
                  aria-expanded={formulaOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors"
                >
                  <Info className="w-3.5 h-3.5" /> How scores are calculated
                </button>
                {formulaOpen && (
                  <div
                    role="dialog"
                    className="absolute right-0 mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-3 text-xs leading-relaxed"
                  >
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={() => setFormulaOpen(false)}
                      className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-accent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="pr-4">
                      {formula || 'Meta score = tournament usage + win rate score'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && <div className="text-center py-12 text-muted-foreground">Loading tier list…</div>}

          <div className="space-y-4">
            {visibleTiers.map(group => (
              <section key={group.tier} id={`tier-${group.tier}`} className="border border-border rounded-lg overflow-hidden">
                <div className={`flex items-center gap-3 px-4 py-2 ${TIER_STYLES[group.tier]?.bg} ${TIER_STYLES[group.tier]?.text}`}>
                  <span className="text-2xl font-bold w-8">{group.tier}</span>
                  <span className="text-sm font-medium opacity-90">{TIER_STYLES[group.tier]?.label}</span>
                  <span className="ml-auto text-xs opacity-80">{group.pokemon.length}</span>
                </div>
                <div className="p-3 bg-card">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {group.pokemon.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPokemon(p)}
                        className="border border-border rounded-md bg-background hover:border-[#d4a017] hover:shadow-md transition-all p-2 flex items-center gap-2 text-left"
                      >
                        <PokemonMiniSprite spriteId={p.spriteId} name={p.name} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="flex gap-1 mt-0.5">
                            {p.types.map(t => (
                              <span key={t} className="text-[9px] px-1 py-[1px] rounded text-white font-medium" style={{ background: TYPE_COLORS[t] || '#6b7280' }}>{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                              <div className="h-full rounded transition-all" style={{ width: `${Math.min(100, p.metaScore)}%`, background: scoreColor(p.metaScore) }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{p.metaScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          {!showD && tiers.some(t => t.tier === 'D' && t.pokemon.length > 0) && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => setShowD(true)} className="gap-1.5">
                <ChevronDown className="w-4 h-4" /> Show D Tier (situational picks)
              </Button>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
            <p>
              <strong>Data sources:</strong> Tournament data scraped from{' '}
              <a href="https://play.limitlesstcg.com/tournaments/completed?game=VGC" target="_blank" rel="noopener" className="text-[#d4a017] hover:underline">Limitless VGC</a>{' '}
              {dataRange && `(${dataRange.teamCount.toLocaleString()} teams, ${dataRange.tournamentCount} tournaments with 50+ players)`}. Updated daily via automated pipeline.
            </p>
            <p className="mt-2">
              Meta score = 55% normalized tournament usage + 45% win rate score. Based entirely on tournament results. Ladder data will be weighted in once Smogon publishes Pokémon Champions usage reports.
            </p>
          </div>
        </div>

        {/* Pokemon Detail Popup */}
        {selectedPokemon && (
          <PokemonDetailPopup
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
            onAddToBuilder={(spreadIdx) => handleAddToBuilder(selectedPokemon, spreadIdx)}
            onAddToMetaThreats={(spreadIdx) => handleAddToMetaThreats(selectedPokemon, spreadIdx)}
          />
        )}

        {/* Toast notification */}
        {toastMsg && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#d4a017] text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
            {toastMsg}
          </div>
        )}
      </div>
  );
}

export default function TierListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading tier list…</div>}>
      <TierListPageInner />
    </Suspense>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-muted/50 rounded px-1 py-0.5">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className="text-xs font-mono font-medium">{value != null ? value.toFixed(1) : '—'}</div>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide">{title}</div>
      <div className="text-[11px] text-foreground/80 leading-snug">{items.join(' · ')}</div>
    </div>
  );
}

function MoveList({ moves }: { moves: { name: string; percent: number; type: string | null; category: string | null }[] }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide mb-1">Top Moves</div>
      <ul className="space-y-1">
        {moves.map((m, i) => (
          <li key={i} className="flex items-center gap-1.5 bg-muted/40 rounded px-1.5 py-1">
            <span className="text-[11px] font-medium flex-1 truncate">{m.name}</span>
            {m.type && <img src={`https://play.pokemonshowdown.com/sprites/types/${m.type}.png`} alt={m.type} width={32} height={14} className="shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            {m.category && <img src={`https://play.pokemonshowdown.com/sprites/categories/${m.category}.png`} alt={m.category} width={32} height={14} className="shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <span className="text-[10px] font-mono text-muted-foreground ml-0.5 shrink-0">{m.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
