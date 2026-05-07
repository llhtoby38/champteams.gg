'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { TEAM_TAGS } from '@/lib/constants/template-teams';
import { buildSetFromUsage, resolveCoreItems, type DefaultSet } from '@/lib/import-to-builder';
import { ImportConfirmDialog } from '@/components/ui/import-confirm-dialog';
import { CoreDetailPopup } from '@/components/core-detail-popup';
import { CoreScoreBadge } from '@/components/core-score-badge';

function scoreColor(score: number): string {
  if (score >= 70) return '#d4a017';
  if (score >= 45) return '#c0392b';
  if (score >= 25) return '#3b82f6';
  if (score >= 10) return '#6b7280';
  return '#374151';
}

interface CorePokemon { id: string; name: string; types: string[]; spriteId: string }

interface MetaCore {
  id: string;
  pokemon1: CorePokemon;
  pokemon2: CorePokemon;
  pokemon3: CorePokemon | null;
  coreScore: number;
  coOccurrence: number;
  synergyPercent: number | null;
  avgMetaScore: number;
  description: string | null;
  tags: string[];
  voteScore: number;
}

const CORE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pairs', label: 'Pairs' },
  { id: 'trios', label: 'Trios' },
  { id: 'fake-out', label: 'Fake Out', color: '#22c55e' },
  { id: 'intimidate', label: 'Intimidate', color: '#f97316' },
  { id: 'tailwind', label: 'Tailwind', color: '#8b5cf6' },
  { id: 'trick-room', label: 'Trick Room', color: '#ec4899' },
  { id: 'rain', label: 'Rain', color: '#3b82f6' },
  { id: 'sun', label: 'Sun', color: '#eab308' },
  { id: 'sand', label: 'Sand', color: '#a16207' },
  { id: 'screens', label: 'Screens', color: '#06b6d4' },
  { id: 'redirection', label: 'Redirection', color: '#6366f1' },
  { id: 'mega', label: 'Mega', color: '#d4a017' },
  { id: 'defiant', label: 'Defiant', color: '#dc2626' },
];

export default function TopCoresPage() {
  const [cores, setCores] = useState<MetaCore[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultSets, setDefaultSets] = useState<Record<string, DefaultSet>>({});
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedCore, setSelectedCore] = useState<MetaCore | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    slotCount: number;
    payload: object | null;
    onProceed: (() => void) | null;
  }>({ open: false, slotCount: 0, payload: null, onProceed: null });

  useEffect(() => {
    fetch('/api/default-sets').then(r => r.json()).then(d => setDefaultSets(d || {})).catch(() => {});
    fetch('/api/cores?limit=20')
      .then(r => r.json())
      .then(d => { setCores(d.cores || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleAddCore(core: MetaCore) {
    setAddingId(core.id);
    const corePokemon = [core.pokemon1, core.pokemon2, ...(core.pokemon3 ? [core.pokemon3] : [])];
    const resolved = resolveCoreItems(corePokemon, defaultSets);
    const pokemon = corePokemon.map(p => {
      const id = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ds = defaultSets[id] || null;
      const set = buildSetFromUsage({ name: p.name }, 0, ds);
      const clauseItem = resolved[p.id];
      return clauseItem ? { ...set, item: clauseItem } : set;
    });
    const names = corePokemon.map(p => p.name).join(' + ');
    const payload = { name: `${names} Core`, pokemon };

    let draftFilled = 0;
    try {
      const draft = localStorage.getItem('poketeam_draft_team');
      if (draft) {
        const data = JSON.parse(draft);
        draftFilled = Array.isArray(data.slots) ? data.slots.length : 0;
      }
    } catch { /* ignore */ }

    const empty = 6 - draftFilled;
    if (pokemon.length <= empty) {
      localStorage.setItem('poketeam_import_template', JSON.stringify({
        ...payload, _mode: 'merge', _startSlot: draftFilled,
      }));
      window.location.href = '/builder';
      return;
    }

    setImportDialog({
      open: true,
      slotCount: draftFilled,
      payload,
      onProceed: () => { window.location.href = '/builder'; },
    });
  }

  function confirmImport() {
    if (importDialog.payload && importDialog.onProceed) {
      localStorage.setItem('poketeam_import_template', JSON.stringify({
        ...importDialog.payload, _mode: 'replace', _startSlot: 0,
      }));
      importDialog.onProceed();
    }
    setImportDialog({ open: false, slotCount: 0, payload: null, onProceed: null });
  }

  function cancelImport() {
    setAddingId(null);
    setImportDialog({ open: false, slotCount: 0, payload: null, onProceed: null });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Browse
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black mt-2">
          Top 20 <span className="text-[#d4a017]">Pokémon Champions Cores</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          This week&apos;s best VGC Reg M-A pairs and trios from Limitless tournament data
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {CORE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id === activeFilter ? 'all' : f.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                activeFilter === f.id
                  ? 'text-white border-transparent'
                  : 'border-border hover:opacity-80'
              }`}
              style={activeFilter === f.id ? { backgroundColor: f.color || '#1a1a2e' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {(() => {
          const filtered = cores.filter(core => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'pairs') return !core.pokemon3;
            if (activeFilter === 'trios') return !!core.pokemon3;
            return core.tags?.includes(activeFilter);
          });

          return loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No cores match this filter.</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((core, index) => (
              <div key={core.id} className="border rounded-lg p-3 hover:border-[#d4a017]/30 transition-colors flex flex-col gap-2 bg-card cursor-pointer" onClick={() => setSelectedCore(core)}>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold text-muted-foreground w-5 text-center shrink-0">
                    #{index + 1}
                  </span>
                  <div className="flex -space-x-1.5">
                    <PokemonMiniSprite spriteId={core.pokemon1.spriteId} name={core.pokemon1.name} size={40} className="border-2 border-card rounded" />
                    <PokemonMiniSprite spriteId={core.pokemon2.spriteId} name={core.pokemon2.name} size={40} className="border-2 border-card rounded" />
                    {core.pokemon3 && (
                      <PokemonMiniSprite spriteId={core.pokemon3.spriteId} name={core.pokemon3.name} size={40} className="border-2 border-card rounded" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight">
                      {[core.pokemon1.name, core.pokemon2.name, ...(core.pokemon3 ? [core.pokemon3.name] : [])].join(' + ')}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CoreScoreBadge
                        score={core.coreScore}
                        synergyPercent={core.synergyPercent ?? 0}
                        winRate={core.avgMetaScore ?? 50}
                        coOccurrence={core.coOccurrence ?? 0}
                        isTrio={!!core.pokemon3}
                        bg={scoreColor(core.coreScore * 1.3)}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {(core.coOccurrence || 0).toFixed(0)}% co-usage
                      </span>
                    </div>
                  </div>
                </div>
                {core.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {core.description}
                  </p>
                )}
                {core.tags && core.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {core.tags.map(tagId => {
                      const tag = TEAM_TAGS.find(t => t.id === tagId);
                      return tag ? <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tag.color }}>{tag.label}</span> : null;
                    })}
                  </div>
                )}
                <div className="flex items-center justify-end pt-2 border-t mt-auto" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleAddCore(core)}
                    disabled={addingId === core.id}
                    className="text-[10px] font-semibold px-2 py-1 rounded bg-[#1a1a2e] text-white hover:bg-[#c0392b] transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add to Builder
                  </button>
                </div>
              </div>
            ))}
          </div>
          );
        })()}
      </div>

      {selectedCore && (
        <CoreDetailPopup
          pokemon={[selectedCore.pokemon1, selectedCore.pokemon2, ...(selectedCore.pokemon3 ? [selectedCore.pokemon3] : [])]}
          description={selectedCore.description || ''}
          tags={selectedCore.tags}
          coOccurrence={selectedCore.coOccurrence || 0}
          coreScore={selectedCore.coreScore}
          synergyPercent={selectedCore.synergyPercent ?? 0}
          winRate={selectedCore.avgMetaScore ?? 50}
          defaultSets={defaultSets}
          onClose={() => setSelectedCore(null)}
          onAddToBuilder={() => {
            setSelectedCore(null);
            handleAddCore(selectedCore);
          }}
        />
      )}

      {importDialog.open && (
        <ImportConfirmDialog
          slotCount={importDialog.slotCount}
          onConfirm={confirmImport}
          onCancel={cancelImport}
        />
      )}
    </div>
  );
}
