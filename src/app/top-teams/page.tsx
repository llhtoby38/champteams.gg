'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Copy, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { speciesToSpriteId } from '@/lib/sprites';
import { TEAM_TAGS } from '@/lib/constants/template-teams';
import { ImportConfirmDialog } from '@/components/ui/import-confirm-dialog';
import { TeamScoreBadge } from '@/components/team-score-badge';

const PAGE_SIZE = 12;

interface BrowseTeam {
  id: string;
  name: string;
  description: string | null;
  pokemonSets: { species: string; item?: string }[];
  authorName: string | null;
  source: string | null;
  tags: string[] | null;
  teamMetaScore?: number;
  memberScores?: { name: string; score: number | null }[];
  createdAt: string;
}

function toSpriteId(species: string) {
  return speciesToSpriteId(species);
}

function scoreColor(score: number): string {
  if (score >= 70) return '#d4a017';
  if (score >= 45) return '#c0392b';
  if (score >= 25) return '#3b82f6';
  if (score >= 10) return '#6b7280';
  return '#374151';
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="p-1.5 rounded border disabled:opacity-30 hover:bg-muted transition-colors">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded border disabled:opacity-30 hover:bg-muted transition-colors">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function TagFilters({ selected, onChange, availableTags }: { selected: string[]; onChange: (tags: string[]) => void; availableTags?: string[] }) {
  const visibleTags = availableTags
    ? TEAM_TAGS.filter(t => t.id !== 'goodstuffs' && availableTags.includes(t.id))
    : TEAM_TAGS.filter(t => t.id !== 'goodstuffs');
  if (visibleTags.length === 0) return null;
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(t => t !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange([])}
        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${selected.length === 0 ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}
      >
        All
      </button>
      {visibleTags.map(tag => (
        <button key={tag.id} onClick={() => toggle(tag.id)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${selected.includes(tag.id) ? 'text-white border-transparent' : 'border-border hover:opacity-80'}`}
          style={selected.includes(tag.id) ? { backgroundColor: tag.color } : {}}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

function TeamCard({ team, rank, onImport }: {
  team: BrowseTeam;
  rank: number;
  onImport: (payload: object, onProceed: () => void) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleAddToBuilder = () => {
    onImport({ name: team.name, pokemon: team.pokemonSets }, () => {
      setCopied(true);
      setTimeout(() => { window.location.href = '/builder'; }, 300);
    });
  };

  const metaScore = team.teamMetaScore ?? 0;

  return (
    <div className="border rounded-lg p-4 hover:border-primary/30 transition-colors flex flex-col bg-card">
      <div className="flex gap-0.5 mb-3 items-center">
        <span className="text-[11px] font-bold text-muted-foreground w-6 text-center shrink-0">
          #{rank}
        </span>
        {Array.isArray(team.pokemonSets) && team.pokemonSets.slice(0, 6).map((p, i) => (
          <PokemonMiniSprite key={i} spriteId={toSpriteId(p.species || '')} name={p.species || '?'} size={36} />
        ))}
        {metaScore > 0 && (
          <div className="ml-auto">
            <TeamScoreBadge
              score={metaScore}
              members={team.memberScores || team.pokemonSets.map(p => ({ name: p.species || '', score: null }))}
              bg={scoreColor(metaScore)}
              footerLink={{ href: '/tier-list', label: 'See full tier list →' }}
            />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm leading-tight">{team.name}</h3>
        {team.authorName && <p className="text-[10px] text-muted-foreground mt-0.5">by {team.authorName}</p>}
        {team.description && <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{team.description}</p>}
        {team.tags && team.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {team.tags.map(tagId => {
              const tag = TEAM_TAGS.find(t => t.id === tagId);
              return tag ? <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tag.color }}>{tag.label}</span> : null;
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        <Link href={`/teams/${team.id}`} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
          View Details
        </Link>
        <Button size="sm" onClick={handleAddToBuilder} className="ml-auto shrink-0">
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          {copied ? 'Opening...' : 'Add to Builder'}
        </Button>
      </div>
    </div>
  );
}

export default function TopTournamentTeamsPage() {
  const [teams, setTeams] = useState<BrowseTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[] | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    slotCount: number;
    payload: object | null;
    onProceed: (() => void) | null;
  }>({ open: false, slotCount: 0, payload: null, onProceed: null });

  const safeImportToBuilder = useCallback((payload: object, onProceed: () => void) => {
    const incoming = Array.isArray((payload as { pokemon?: unknown[] }).pokemon)
      ? (payload as { pokemon: unknown[] }).pokemon.length
      : 0;

    let draftFilled = 0;
    try {
      const draft = localStorage.getItem('poketeam_draft_team');
      if (draft) {
        const data = JSON.parse(draft);
        draftFilled = Array.isArray(data.slots) ? data.slots.length : 0;
      }
    } catch { /* ignore */ }

    const empty = 6 - draftFilled;

    if (incoming <= empty) {
      localStorage.setItem('poketeam_import_template', JSON.stringify({
        ...payload, _mode: 'merge', _startSlot: draftFilled,
      }));
      onProceed();
      return;
    }

    setImportDialog({ open: true, slotCount: draftFilled, payload, onProceed });
  }, []);

  const confirmImport = useCallback(() => {
    if (importDialog.payload && importDialog.onProceed) {
      localStorage.setItem('poketeam_import_template', JSON.stringify({
        ...importDialog.payload, _mode: 'replace', _startSlot: 0,
      }));
      importDialog.onProceed();
    }
    setImportDialog({ open: false, slotCount: 0, payload: null, onProceed: null });
  }, [importDialog]);

  const cancelImport = useCallback(() => {
    setImportDialog({ open: false, slotCount: 0, payload: null, onProceed: null });
  }, []);

  const fetchTeams = useCallback(async (p: number, q: string, tags: string[]) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_SIZE),
        sort: 'meta',
        tournamentOnly: '1',
      });
      if (q) params.set('pokemon', q);
      if (tags.length > 0) params.set('tags', tags.join(','));
      const res = await fetch(`/api/browse?${params}`);
      const data = await res.json();
      setTeams(data.teams || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.availableTags) setAvailableTags(data.availableTags);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeams(page, pokemonSearch, selectedTags); }, [page, pokemonSearch, selectedTags, fetchTeams]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border" style={{ background: 'linear-gradient(180deg, rgba(212,160,23,0.06) 0%, transparent 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/browse" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Browse
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Best <span className="text-[#d4a017]">Pokémon Champions Teams</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top VGC Reg M-A teams ranked by tournament results from Limitless — full sets with movesets, items, and spreads
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (setPokemonSearch(searchInput), setPage(1))}
                placeholder="Search by Pokémon (e.g. Garchomp)"
                className="w-full pl-8 pr-3 h-8 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={() => { setPokemonSearch(searchInput); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary">Go</button>
            </div>
          </div>
          <TagFilters selected={selectedTags} onChange={t => { setSelectedTags(t); setPage(1); }} availableTags={availableTags} />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No tournament teams match this filter.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{total} team{total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {teams.map((team, i) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  rank={(page - 1) * PAGE_SIZE + i + 1}
                  onImport={safeImportToBuilder}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

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
