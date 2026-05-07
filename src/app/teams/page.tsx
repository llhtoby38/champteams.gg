'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { speciesToSpriteId } from '@/lib/sprites';
import { getAuthSession } from '@/hooks/use-local-storage';
import { Plus, Trash2, Globe, Lock, Pencil, Copy, ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamRow {
  id: string;
  name: string;
  format: string;
  pokemonSets: { species: string }[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

function toSpriteId(species: string): string {
  return speciesToSpriteId(species);
}

const PAGE_SIZE = 20;

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const session = getAuthSession();

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    fetch(`/api/teams?page=${page}&limit=${PAGE_SIZE}`, {
      signal: controller.signal,
      headers: { 'x-user-id': session.userId },
    })
      .then((r) => r.json())
      .then((data) => {
        // Backwards-compat: the API now returns { teams, total, totalPages }
        // but older clients may still see the array form.
        if (Array.isArray(data)) {
          setTeams(data);
          setTotal(data.length);
          setTotalPages(1);
        } else {
          setTeams(data.teams ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      })
      .catch(() => {})
      .finally(() => { clearTimeout(timer); setLoading(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [session?.userId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // The builder reads poketeam_draft_team on mount to restore an in-progress
  // team — useful if the user navigates away and comes back, but surprising
  // when they click "New Team" expecting a blank slate. Clear the draft so
  // the next /builder mount starts empty.
  const handleNewTeam = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('poketeam_draft_team');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    if (!confirm('Delete this team?')) return;
    await fetch(`/api/teams/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': session.userId },
    });
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = async (team: TeamRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({
        name: `${team.name} (copy)`,
        format: team.format,
        pokemon: team.pokemonSets,
        isPublic: false,
      }),
    });
    if (res.ok) {
      const newTeam = await res.json();
      setTeams(prev => [newTeam, ...prev]);
    }
  };

  const handleTogglePublish = async (team: TeamRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      alert('Sign in to publish teams to the community.');
      return;
    }
    const res = await fetch(`/api/teams/${team.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ isPublic: !team.isPublic }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, isPublic: updated.isPublic } : t));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">My Teams</h1>
            {!session && (
              <p className="text-xs text-muted-foreground mt-0.5">Sign in to publish teams to the community</p>
            )}
          </div>
          <Link href="/builder" onClick={handleNewTeam}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Team
            </Button>
          </Link>
        </div>

        {!session ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Sign in to view and manage your saved teams.</p>
          </div>
        ) : loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No teams saved yet.</p>
            <Link href="/builder" onClick={handleNewTeam}>
              <Button>Create Your First Team</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="block p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/50 transition-colors"
              >
                {/* Top row: badge + name + date */}
                <div className="flex items-center gap-2 mb-2">
                  {team.isPublic
                    ? <span className="text-[9px] font-semibold text-green-700 border border-green-300 bg-green-50 rounded px-1.5 py-0.5 shrink-0 uppercase tracking-wide">Published</span>
                    : <span className="text-[9px] font-semibold text-muted-foreground border rounded px-1.5 py-0.5 shrink-0 uppercase tracking-wide">Private</span>
                  }
                  <h3 className="font-semibold text-sm truncate flex-1">{team.name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(team.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(team.updatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>

                {/* Bottom row: sprites + actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1 flex-1 min-w-0">
                    {Array.isArray(team.pokemonSets) &&
                      team.pokemonSets.slice(0, 6).map((p, i) => (
                        <PokemonMiniSprite
                          key={i}
                          spriteId={toSpriteId(p.species || '')}
                          name={p.species || '?'}
                          size={32}
                          className="border-2 border-card rounded-sm"
                        />
                      ))}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.preventDefault()}>
                    <Link
                      href={`/builder/${team.id}`}
                      onClick={e => e.stopPropagation()}
                      title="Edit in builder"
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={(e) => handleDuplicate(team, e)}
                      title="Duplicate team"
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleTogglePublish(team, e)}
                      title={team.isPublic ? 'Unpublish' : 'Publish to community'}
                      className={`p-1.5 rounded transition-colors ${
                        team.isPublic ? 'text-green-600 hover:text-muted-foreground' : 'text-muted-foreground hover:text-green-600'
                      }`}
                    >
                      {team.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={(e) => handleDelete(team.id, e)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded border disabled:opacity-30 hover:bg-muted transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {total} team{total !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded border disabled:opacity-30 hover:bg-muted transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
