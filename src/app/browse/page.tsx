'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { speciesToSpriteId } from '@/lib/sprites';
import { TEAM_TAGS } from '@/lib/constants/template-teams';
import { getAuthSession, setAuthSession } from '@/hooks/use-local-storage';
import {
  Copy, ChevronLeft, ChevronRight,
  ThumbsUp, ThumbsDown, Search, Globe, TrendingUp, ArrowRight, MessageCircle,
} from 'lucide-react';
import { ImportConfirmDialog } from '@/components/ui/import-confirm-dialog';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { buildSetFromUsage, resolveCoreItems, type DefaultSet } from '@/lib/import-to-builder';
import { CoreDetailPopup } from '@/components/core-detail-popup';
import { CoreScoreBadge } from '@/components/core-score-badge';
import { TeamScoreBadge } from '@/components/team-score-badge';

const PAGE_SIZE = 12;

// ── Types ──────────────────────────────────────────────────────────────────

interface VoteData { score: number; userVote: number }
type VoteMap = Record<string, VoteData>;

interface BrowseTeam {
  id: string;
  name: string;
  description: string | null;
  pokemonSets: { species: string; item?: string }[];
  authorName: string | null;
  source: string | null;
  tags: string[] | null;
  voteScore: number;
  userVote: number;
  commentCount?: number;
  teamMetaScore?: number;
  memberScores?: { name: string; score: number | null }[];
  createdAt: string;
}

interface TierPokemon {
  id: string;
  name: string;
  types: string[];
  spriteId: string;
  metaScore: number;
  tournamentUsage: number | null;
  winRate: number | null;
}

interface TierGroup { tier: string; pokemon: TierPokemon[] }

interface MetaCore {
  id: string;
  pokemon1: { id: string; name: string; types: string[]; spriteId: string };
  pokemon2: { id: string; name: string; types: string[]; spriteId: string };
  pokemon3?: { id: string; name: string; types: string[]; spriteId: string } | null;
  coreScore: number;
  coOccurrence: number;
  synergyPercent: number | null;
  avgMetaScore?: number | null;
  description: string | null;
  tags: string[];
  voteScore: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Vote buttons ───────────────────────────────────────────────────────────

function VoteButtons({
  id, score, userVote, session, onVote, onAuthRequired,
}: { id: string; score: number; userVote: number; session: { userId: string } | null; onVote: (id: string, v: 1 | -1) => void; onAuthRequired?: () => void }) {
  const handleClick = (v: 1 | -1) => {
    if (!session) { onAuthRequired?.(); return; }
    onVote(id, v);
  };
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleClick(1)}
        title={session ? 'Upvote' : 'Sign in to vote'}
        className={`p-1 rounded transition-colors ${userVote === 1 ? 'text-green-600 bg-green-50' : 'text-muted-foreground hover:text-green-600'}`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <span className={`text-xs font-medium w-5 text-center ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
        {score}
      </span>
      <button
        onClick={() => handleClick(-1)}
        title={session ? 'Downvote' : 'Sign in to vote'}
        className={`p-1 rounded transition-colors ${userVote === -1 ? 'text-red-500 bg-red-50' : 'text-muted-foreground hover:text-red-500'}`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

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

// ── Team card ──────────────────────────────────────────────────────────────

function TeamCard({ team, session, onVote, onImport, onAuthRequired, showVotes = true }: {
  team: BrowseTeam;
  session: { userId: string } | null;
  onVote: (id: string, v: 1 | -1) => void;
  onImport: (payload: object, onProceed: () => void) => void;
  onAuthRequired?: () => void;
  showVotes?: boolean;
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
    <div className="border rounded-lg p-4 hover:border-primary/30 transition-colors flex flex-col">
      <div className="flex gap-0.5 mb-3 items-center">
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
        {showVotes && (
          <VoteButtons id={team.id} score={team.voteScore} userVote={team.userVote} session={session} onVote={onVote} onAuthRequired={onAuthRequired} />
        )}
        <Link
          href={`/teams/${team.id}#comments`}
          title={`${team.commentCount ?? 0} comment${(team.commentCount ?? 0) === 1 ? '' : 's'}`}
          className={`inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors ${showVotes ? '' : 'ml-auto'}`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{team.commentCount ?? 0}</span>
        </Link>
        <Link href={`/teams/${team.id}`} className={`${showVotes ? 'ml-auto' : ''} text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap`}>
          View Details
        </Link>
        <Button size="sm" onClick={handleAddToBuilder} className={`${showVotes ? '' : 'ml-auto'} shrink-0`}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          {copied ? 'Opening...' : 'Add to Builder'}
        </Button>
      </div>
    </div>
  );
}

// ── Section 1: Tier List Preview ───────────────────────────────────────────

function TierListSection() {
  const [tiers, setTiers] = useState<TierGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tier-list')
      .then(r => r.json())
      .then(d => { setTiers(d.tiers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tierStyles: Record<string, string> = {
    S: 'bg-[#d4a017] text-[#0f0f1a]',
    A: 'bg-[#c0392b] text-white',
    B: 'bg-[#3b82f6] text-white',
    C: 'bg-[#6b7280] text-white',
  };

  const visibleTiers = tiers.filter(t => t.tier !== 'D' && t.pokemon.length > 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#d4a017]" />
            Tier List
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data-driven rankings from tournament + ladder data
          </p>
        </div>
        <Link
          href="/tier-list"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#d4a017] hover:underline"
        >
          Full Tier List <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading tiers…</div>
      ) : (
        <div className="space-y-1.5">
          {visibleTiers.map(group => (
            <div key={group.tier} className="flex items-stretch rounded-lg overflow-hidden border border-border/50">
              <div className={`flex items-center justify-center w-10 sm:w-14 shrink-0 text-2xl font-black ${tierStyles[group.tier] || 'bg-muted'}`}>
                {group.tier}
              </div>
              <div className="flex-1 py-2 px-2 sm:px-3 bg-card/50 flex flex-wrap items-center gap-0.5">
                {group.pokemon.slice(0, 30).map(p => (
                  <Link
                    key={p.id}
                    href={`/tier-list?pokemon=${p.id}`}
                    className="hover:scale-110 transition-transform"
                    title={`${p.name} — ${p.metaScore.toFixed(1)}`}
                  >
                    <PokemonMiniSprite spriteId={p.spriteId} name={p.name} size={36} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Section 2: Top Cores ───────────────────────────────────────────────────

function TopCoresSection({ onImport, onAuthRequired, session, onVote, votes, compact }: {
  onImport: (payload: object, onProceed: () => void) => void;
  onAuthRequired?: () => void;
  session: { userId: string } | null;
  onVote: (id: string, v: 1 | -1) => void;
  votes: VoteMap;
  compact?: boolean;
}) {
  const [cores, setCores] = useState<MetaCore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [defaultSetsMap, setDefaultSetsMap] = useState<Record<string, DefaultSet>>({});
  const [selectedCore, setSelectedCore] = useState<MetaCore | null>(null);

  useEffect(() => {
    fetch('/api/default-sets').then(r => r.json()).then(d => setDefaultSetsMap(d || {})).catch(() => {});
    fetch('/api/cores?limit=30')
      .then(r => r.json())
      .then(d => { setCores(d.cores || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = compact ? cores.slice(0, 6) : showAll ? cores : cores.slice(0, 9);

  return (
    <>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading cores…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((core, index) => {
              return (
                <div key={core.id} className="border rounded-lg p-3 hover:border-primary/30 transition-colors flex flex-col gap-2 bg-card cursor-pointer" onClick={() => setSelectedCore(core)}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-muted-foreground w-5 text-center shrink-0">
                      #{index + 1}
                    </span>
                    <div className="flex -space-x-1.5">
                      <PokemonMiniSprite spriteId={core.pokemon1.spriteId} name={core.pokemon1.name} size={40} className="border-2 border-card rounded" />
                      <PokemonMiniSprite spriteId={core.pokemon2.spriteId} name={core.pokemon2.name} size={40} className="border-2 border-card rounded" />
                      {core.pokemon3 && <PokemonMiniSprite spriteId={core.pokemon3.spriteId} name={core.pokemon3.name} size={40} className="border-2 border-card rounded" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight">
                        {[core.pokemon1.name, core.pokemon2.name, core.pokemon3?.name].filter(Boolean).join(' + ')}
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
                  <div className="flex items-center justify-end gap-2 pt-2 border-t mt-auto" onClick={e => e.stopPropagation()}>
                    <button
                      className="text-[10px] px-2 py-1 rounded border border-border hover:border-[#d4a017] hover:text-[#d4a017] transition-colors font-medium"
                      onClick={(e) => { e.stopPropagation();
                        const allPokemon = [core.pokemon1, core.pokemon2, core.pokemon3].filter(Boolean) as { id: string; name: string }[];
                        const resolved = resolveCoreItems(allPokemon, defaultSetsMap);
                        const pokemon = allPokemon.map(p => {
                          const id = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const ds = defaultSetsMap[id] || null;
                          const set = buildSetFromUsage({ name: p.name }, 0, ds);
                          const clauseItem = resolved[p.id];
                          return clauseItem ? { ...set, item: clauseItem } : set;
                        });
                        const coreName = allPokemon.map(p => p.name).join(' + ');
                        onImport({ name: `${coreName} Core`, pokemon }, () => { window.location.href = '/builder'; });
                      }}
                    >
                      Add to Builder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!compact && cores.length > 9 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Show less' : `Show all ${cores.length} cores`}
              </Button>
            </div>
          )}
        </>
      )}

      {selectedCore && (() => {
        const allP = [selectedCore.pokemon1, selectedCore.pokemon2, selectedCore.pokemon3].filter(Boolean) as { id: string; name: string; types: string[]; spriteId: string }[];
        return (
          <CoreDetailPopup
            pokemon={allP}
            description={selectedCore.description || ''}
            tags={selectedCore.tags}
            coOccurrence={selectedCore.coOccurrence || 0}
            coreScore={selectedCore.coreScore}
            synergyPercent={selectedCore.synergyPercent ?? 0}
            winRate={selectedCore.avgMetaScore ?? 50}
            defaultSets={defaultSetsMap}
            onClose={() => setSelectedCore(null)}
            onAddToBuilder={() => {
              const resolved = resolveCoreItems(allP, defaultSetsMap);
              const pokemon = allP.map(p => {
                const id = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const ds = defaultSetsMap[id] || null;
                const set = buildSetFromUsage({ name: p.name }, 0, ds);
                const clauseItem = resolved[p.id];
                return clauseItem ? { ...set, item: clauseItem } : set;
              });
              const coreName = allP.map(p => p.name).join(' + ');
              onImport({ name: `${coreName} Core`, pokemon }, () => { window.location.href = '/builder'; });
              setSelectedCore(null);
            }}
          />
        );
      })()}
    </>
  );
}

// ── DB-backed team section ─────────────────────────────────────────────────

function TeamsSection({ title, subtitle, sort, communityOnly, creatorOnly, tournamentOnly, compact, onImport, onAuthRequired, session }: {
  title: string;
  subtitle: string;
  sort: 'top' | 'new' | 'meta';
  communityOnly?: boolean;
  creatorOnly?: boolean;
  tournamentOnly?: boolean;
  compact?: boolean;
  onImport: (payload: object, onProceed: () => void) => void;
  onAuthRequired?: () => void;
  session: { userId: string } | null;
}) {
  const [browseTeams, setBrowseTeams] = useState<BrowseTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[] | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const limit = compact ? 6 : PAGE_SIZE;

  const fetchTeams = useCallback(async (p: number, q: string, tags: string[]) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit), sort });
      if (q) params.set('pokemon', q);
      if (tags.length > 0) params.set('tags', tags.join(','));
      if (communityOnly) params.set('communityOnly', '1');
      if (creatorOnly) params.set('creatorOnly', '1');
      if (tournamentOnly) params.set('tournamentOnly', '1');
      const res = await fetch(`/api/browse?${params}`, {
        headers: session ? { 'x-user-id': session.userId } : {},
      });
      const data = await res.json();
      setBrowseTeams(data.teams || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.availableTags) setAvailableTags(data.availableTags);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [session?.userId, communityOnly, creatorOnly, tournamentOnly, sort, limit]);

  useEffect(() => { fetchTeams(page, pokemonSearch, selectedTags); }, [page, pokemonSearch, selectedTags, fetchTeams]);

  const votingRef = useRef<Set<string>>(new Set());
  const handleVote = async (teamId: string, value: 1 | -1) => {
    if (!session) return;
    if (votingRef.current.has(teamId)) return;
    votingRef.current.add(teamId);
    setBrowseTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;
      const wasVote = Number(t.userVote) || 0;
      const newVote = wasVote === value ? 0 : value;
      const scoreDelta = newVote - wasVote;
      return { ...t, userVote: newVote, voteScore: (Number(t.voteScore) || 0) + scoreDelta };
    }));
    fetch(`/api/teams/${teamId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ value }),
    }).finally(() => votingRef.current.delete(teamId));
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
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
        <div className="text-center py-12 text-muted-foreground text-sm">Loading teams…</div>
      ) : browseTeams.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No teams found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4">{total} team{total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {browseTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                session={session}
                onVote={handleVote}
                onImport={onImport}
                onAuthRequired={onAuthRequired}
                showVotes={!tournamentOnly}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

function BrowsePageInner() {
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

  const [coreVotes, setCoreVotes] = useState<VoteMap>({});
  const [session, setSession] = useState<{ userId: string; username: string } | null>(
    typeof window !== 'undefined' ? getAuthSession() : null,
  );
  const [authOpen, setAuthOpen] = useState(false);

  const promptAuth = useCallback(() => setAuthOpen(true), []);

  const handleCoreVote = async (id: string, value: 1 | -1) => {
    if (!session) { promptAuth(); return; }
    setCoreVotes(prev => {
      const cur = prev[id] ?? { score: 0, userVote: 0 };
      const wasVote = Number(cur.userVote) || 0;
      const newVote = wasVote === value ? 0 : value;
      const scoreDelta = newVote - wasVote;
      return { ...prev, [id]: { score: (Number(cur.score) || 0) + scoreDelta, userVote: newVote } };
    });
    fetch(`/api/templates/${encodeURIComponent(id)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ value }),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="border-b border-border" style={{ background: 'linear-gradient(180deg, rgba(212,160,23,0.06) 0%, transparent 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Browse
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Explore the Pok&eacute;mon Champions Reg M-A competitive meta &mdash; tier rankings,
            top synergy cores, and community teams to prepare for your next tournament.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#d4a017] border border-[#d4a017]/30 px-2.5 py-1 rounded-full">
              Season M-1 &middot; Doubles &middot; Mega Evolution
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-10">
        {/* 1. Tier List Preview */}
        <TierListSection />

        {/* 2. Top Meta Cores (preview — 6 items) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Top Pokémon Champions Cores</h2>
              <p className="text-xs text-muted-foreground mt-0.5">This week&apos;s best VGC pairs and trios from Limitless tournaments</p>
            </div>
            <Link href="/top-cores" className="text-sm font-medium text-[#d4a017] hover:underline">
              View All →
            </Link>
          </div>
          <TopCoresSection
            onImport={safeImportToBuilder}
            onAuthRequired={promptAuth}
            session={session}
            onVote={handleCoreVote}
            votes={coreVotes}
            compact
          />
        </section>

        {/* 3. Top Tournament Teams — ranked by our meta score */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Best Pokémon Champions Teams</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Top VGC Reg M-A teams ranked by recent Limitless tournament results</p>
            </div>
            <Link href="/top-teams" className="text-sm font-medium text-[#d4a017] hover:underline">
              View All →
            </Link>
          </div>
          <TeamsSection
            title=""
            subtitle=""
            sort="meta"
            tournamentOnly
            compact
            onImport={safeImportToBuilder}
            onAuthRequired={promptAuth}
            session={session}
          />
        </section>

        {/* 4. Community Teams (preview — 6 items) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Community Teams</h2>
              <p className="text-xs text-muted-foreground mt-0.5">User-submitted teams sorted by votes</p>
            </div>
            <Link href="/community-teams" className="text-sm font-medium text-[#d4a017] hover:underline">
              View All →
            </Link>
          </div>
          <TeamsSection
            title=""
            subtitle=""
            sort="top"
            communityOnly
            compact
            onImport={safeImportToBuilder}
            onAuthRequired={promptAuth}
            session={session}
          />
        </section>
      </div>

      {importDialog.open && (
        <ImportConfirmDialog
          slotCount={importDialog.slotCount}
          onConfirm={confirmImport}
          onCancel={cancelImport}
        />
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={(s) => {
          setAuthSession(s);
          setSession(s);
          setAuthOpen(false);
        }}
        message="Sign in to vote on teams"
      />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
      <BrowsePageInner />
    </Suspense>
  );
}
