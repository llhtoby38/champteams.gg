'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PokemonMiniSprite } from '@/components/builder/pokemon-mini-sprite';
import { getAuthSession } from '@/hooks/use-local-storage';
import { toast } from 'sonner';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Trash2, CornerDownRight, Copy, ExternalLink, ClipboardCopy, Check, Pencil, Globe, Lock, Save, X, Share2, Link2 } from 'lucide-react';
import { ImportConfirmDialog } from '@/components/ui/import-confirm-dialog';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { computeTeamTags } from '@/lib/pokemon/team-tags';
import { speciesToSpriteId } from '@/lib/sprites';
import { normalizeToSp } from '@/lib/pokemon/stats';
import { exportTeamToShowdown } from '@/lib/pokemon/export';
import type { PokemonSet, StatsTable } from '@/types/pokemon';

function toStatsTable(raw: Record<string, number> | undefined): StatsTable {
  return {
    hp: raw?.hp ?? 0, atk: raw?.atk ?? 0, def: raw?.def ?? 0,
    spa: raw?.spa ?? 0, spd: raw?.spd ?? 0, spe: raw?.spe ?? 0,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  format: string | null;
  pokemonSets: { species: string; item?: string; ability?: string; nature?: string; moves?: string[]; evs?: Record<string, number>; ivs?: Record<string, number>; level?: number }[];
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
  authorName?: string | null;
  authorId?: string | null;
  source?: string | null;
  tags?: string[] | null;
  voteScore?: number;
  userVote?: number;
}

interface Comment {
  id: string;
  teamId: string;
  parentId: string | null;
  body: string;
  score: number;
  isDeleted: boolean;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
  userVote: number;
  children?: Comment[];
}

// ─── Comment tree builder ─────────────────────────────────────────────────────

function buildTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  flat.forEach(c => map.set(c.id, { ...c, children: [] }));
  map.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children!.push(c);
    } else {
      roots.push(c);
    }
  });
  // Sort children by score desc
  const sortChildren = (nodes: Comment[]) => {
    nodes.sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    nodes.forEach(n => n.children && sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Comment vote buttons ─────────────────────────────────────────────────────

function CommentVoteButtons({
  commentId, score, userVote, session, onVote, onAuthRequired,
}: {
  commentId: string;
  score: number;
  userVote: number;
  session: { userId: string } | null;
  onVote: (id: string, v: 1 | -1, newScore: number) => void;
  onAuthRequired?: () => void;
}) {
  const handleVote = async (v: 1 | -1) => {
    if (!session) { onAuthRequired?.(); return; }
    const res = await fetch(`/api/comments/${commentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ value: v }),
    });
    if (res.ok) {
      const data = await res.json();
      onVote(commentId, v, data.score);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        title={session ? 'Upvote' : 'Sign in to vote'}
        className={`p-0.5 rounded transition-colors ${userVote === 1 ? 'text-[#d4a017]' : 'text-muted-foreground hover:text-[#d4a017]'}`}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <span className={`text-[11px] font-semibold min-w-[12px] text-center ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        title={session ? 'Downvote' : 'Sign in to vote'}
        className={`p-0.5 rounded transition-colors ${userVote === -1 ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Comment input ────────────────────────────────────────────────────────────

function CommentInput({
  onSubmit, placeholder = 'Write a comment...', autoFocus = false, onCancel,
}: {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setBody('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !body.trim()}>
          {submitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}

// ─── Single comment node ──────────────────────────────────────────────────────

function CommentNode({
  comment, session, teamId, onPostReply, onVote, onDelete, onAuthRequired, depth = 0,
}: {
  comment: Comment;
  session: { userId: string; username: string } | null;
  teamId: string;
  onPostReply: (parentId: string, body: string) => Promise<void>;
  onVote: (id: string, v: 1 | -1, newScore: number) => void;
  onDelete: (id: string) => Promise<void>;
  onAuthRequired?: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);

  const isOwn = session && comment.authorId === session.userId;
  const maxDepth = 6;
  const indentClass = depth > 0 ? 'border-l-2 border-muted pl-3 sm:pl-4' : '';

  return (
    <div className={indentClass}>
      <div className="py-2">
        {/* Author + time */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-foreground">
            {comment.isDeleted ? '[deleted]' : (comment.authorName ?? 'Anonymous')}
          </span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          {isOwn && !comment.isDeleted && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete comment"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Body */}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${comment.isDeleted ? 'text-muted-foreground italic' : ''}`}>
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5">
          <CommentVoteButtons
            commentId={comment.id}
            score={comment.score}
            userVote={comment.userVote}
            session={session}
            onVote={onVote}
            onAuthRequired={onAuthRequired}
          />
          {session && !comment.isDeleted && depth < maxDepth && (
            <button
              onClick={() => setReplying(r => !r)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-2">
            <CommentInput
              placeholder={`Reply to ${comment.authorName ?? 'Anonymous'}...`}
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={async (body) => {
                await onPostReply(comment.id, body);
                setReplying(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-1">
          {comment.children.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              session={session}
              teamId={teamId}
              onPostReply={onPostReply}
              onVote={onVote}
              onDelete={onDelete}
              onAuthRequired={onAuthRequired}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const session = getAuthSession();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [importDialog, setImportDialog] = useState<{ open: boolean; slotCount: number } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [showdownCopied, setShowdownCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePrompt, setSharePrompt] = useState(false);

  // Owner editing state
  const [editingDescription, setEditingDescription] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        headers: session ? { 'x-user-id': session.userId } : {},
      });
      if (!res.ok) { router.replace('/browse'); return; }
      const data = await res.json();
      setTeam(data);
    } finally { setLoadingTeam(false); }
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/comments`, {
      headers: session ? { 'x-user-id': session.userId } : {},
    });
    if (res.ok) setComments(await res.json());
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTeam();
    fetchComments();
  }, [fetchTeam, fetchComments]);

  const handlePostComment = async (body: string, parentId?: string) => {
    if (!session) return;
    const res = await fetch(`/api/teams/${teamId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ body, parentId: parentId ?? null }),
    });
    if (res.ok) fetchComments();
  };

  const handleVote = (id: string, _v: 1 | -1, newScore: number) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, score: newScore, userVote: _v === (c.userVote === _v ? 0 : _v) ? 0 : _v } : c));
    // Refetch for accuracy
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': session.userId },
    });
    fetchComments();
  };

  const handleAddToBuilder = () => {
    if (!team) return;
    const incoming = team.pokemonSets.length;
    let draftFilled = 0;
    try {
      const draft = localStorage.getItem('poketeam_draft_team');
      if (draft) {
        const data = JSON.parse(draft);
        // Draft slots are compacted (no nulls), length = filled count
        draftFilled = Array.isArray(data.slots) ? data.slots.length : 0;
      }
    } catch { /* ignore */ }

    const empty = 6 - draftFilled;

    if (incoming <= empty) {
      // Enough room — merge into empty slots, no warning needed
      doImport('merge', draftFilled);
      return;
    }

    if (draftFilled > 0) {
      // Not enough room — warn the user
      setImportDialog({ open: true, slotCount: draftFilled });
      return;
    }

    // Builder is empty — just replace
    doImport('replace', 0);
  };

  const doImport = (mode: 'replace' | 'merge' = 'replace', startSlot = 0) => {
    if (!team) return;
    localStorage.setItem('poketeam_import_template', JSON.stringify({
      name: team.name,
      pokemon: team.pokemonSets,
      _mode: mode,
      _startSlot: startSlot,
    }));
    window.location.href = '/builder';
  };

  // Owner-only: save description
  const handleSaveDescription = async () => {
    if (!session || !team) return;
    setSavingDesc(true);
    const res = await fetch(`/api/teams/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ description: descDraft }),
    });
    if (res.ok) {
      setTeam(prev => prev ? { ...prev, description: descDraft } : prev);
      setEditingDescription(false);
    }
    setSavingDesc(false);
  };

  // Owner-only: toggle publish
  const handleTogglePublish = async () => {
    if (!session || !team) return;
    setTogglingPublish(true);
    const newPublic = !team.isPublic;
    const res = await fetch(`/api/teams/${teamId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ isPublic: newPublic }),
    });
    if (res.ok) {
      setTeam(prev => prev ? { ...prev, isPublic: newPublic } : prev);
    }
    setTogglingPublish(false);
  };

  // Owner-only: delete team
  const handleDeleteTeam = async () => {
    if (!session || !team) return;
    if (!confirm('Delete this team? This cannot be undone.')) return;
    setDeletingTeam(true);
    const res = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': session.userId },
    });
    if (res.ok) {
      router.push('/teams');
    }
    setDeletingTeam(false);
  };

  const handleCopyShowdown = () => {
    if (!team) return;
    const sets: PokemonSet[] = team.pokemonSets.map(p => {
      const sps = normalizeToSp(toStatsTable(p.evs));
      return {
        species: p.species,
        nickname: '',
        item: p.item ?? '',
        ability: p.ability ?? '',
        nature: p.nature ?? '',
        level: p.level ?? 50,
        moves: ([0,1,2,3].map(i => p.moves?.[i] ?? '') as [string,string,string,string]),
        evs: sps,
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      } as PokemonSet;
    });
    navigator.clipboard.writeText(exportTeamToShowdown(sets)).then(() => {
      setShowdownCopied(true);
      setTimeout(() => setShowdownCopied(false), 2000);
      toast.success('Showdown paste copied');
    });
  };

  const handleShare = async () => {
    if (!team) return;
    // Auto-publish if private (owner only) — sharing implies publishing
    if (!team.isPublic && session && session.userId === team.authorId) {
      await fetch(`/api/teams/${teamId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
        body: JSON.stringify({ isPublic: true }),
      });
      setTeam({ ...team, isPublic: true });
      toast.success('Team published');
    } else if (!team.isPublic) {
      setSharePrompt(true);
      setTimeout(() => setSharePrompt(false), 3000);
      return;
    }
    const url = `${window.location.origin}/teams/${teamId}`;
    const shareData = {
      title: `${team.name} — ChampTeams`,
      text: `Check out this VGC team: ${team.name}`,
      url,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const tree = buildTree(comments);
  const totalComments = comments.filter(c => !c.isDeleted).length;
  const isOwner = !!(session && team && session.userId === team.authorId);

  if (loadingTeam) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading team...
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Back nav */}
        <div className="flex items-center gap-3">
          {isOwner ? (
            <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              My Teams
            </Link>
          ) : (
            <Link href="/browse" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Browse
            </Link>
          )}
          {isOwner && (
            <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
              Your Team
            </span>
          )}
        </div>

        {/* Team header */}
        <div className="border rounded-xl p-5 space-y-4">
          {/* Team name */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{team.name}</h1>
              {isOwner && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${team.isPublic ? 'text-green-600 border-green-200 bg-green-50' : 'text-muted-foreground border-border'}`}>
                  {team.isPublic ? 'Published' : 'Private'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
              {team.authorName && !isOwner && <span>by <span className="font-medium text-foreground">{team.authorName}</span></span>}
              <span>Updated {new Date(team.updatedAt || team.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(team.updatedAt || team.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
              <span className="inline-flex items-center gap-1 border border-[#d4a017]/40 text-[#d4a017] px-1.5 py-0.5 rounded text-[10px]">
                {team.format === 'champions-all' ? 'All Pokemon' : 'Season M-1'}
              </span>
              {team.source && (
                <a href={team.source} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#d4a017] hover:underline">
                  <ExternalLink className="h-3 w-3" /> Source
                </a>
              )}
            </div>
            {(() => {
              const TEAM_TAGS_MAP: Record<string, { label: string; color: string }> = {
                'weather-sun': { label: 'Sun', color: '#EE8130' },
                'weather-rain': { label: 'Rain', color: '#6390F0' },
                'weather-sand': { label: 'Sand', color: '#E2BF65' },
                'weather-snow': { label: 'Snow', color: '#96D9D6' },
                'trick-room': { label: 'Trick Room', color: '#F95587' },
                'tailwind': { label: 'Tailwind', color: '#A98FF3' },
                'hyper-offense': { label: 'Hyper Offense', color: '#C22E28' },
                'balanced': { label: 'Balanced', color: '#7AC74C' },
                'goodstuffs': { label: 'Goodstuffs', color: '#A8A77A' },
                'mega-focused': { label: 'Mega', color: '#6F35FC' },
                'bulky-offense': { label: 'Bulky Offense', color: '#B7B7CE' },
                'semi-trick-room': { label: 'Semi-TR', color: '#D685AD' },
                'terrain-electric': { label: 'Elec Terrain', color: '#F7D02C' },
                'terrain-psychic': { label: 'Psychic Terrain', color: '#F95587' },
                'terrain-grassy': { label: 'Grassy Terrain', color: '#7AC74C' },
                'perish-trap': { label: 'Perish Trap', color: '#735797' },
                'commander': { label: 'Commander', color: '#2196F3' },
                'screens': { label: 'Screens', color: '#4FC3F7' },
                'intimidate': { label: 'Intimidate', color: '#FF7043' },
                'fake-out': { label: 'Fake Out', color: '#26A69A' },
                'redirection': { label: 'Redirection', color: '#AB47BC' },
              };
              const computedTags = computeTeamTags(team.pokemonSets.map(p => ({
                species: p.species,
                ability: p.ability,
                item: p.item,
                moves: p.moves,
              })));
              const allTags = Array.from(new Set([...(team.tags ?? []), ...computedTags]));
              return allTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {allTags.map(tagId => {
                    const tag = TEAM_TAGS_MAP[tagId];
                    return tag ? <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tag.color }}>{tag.label}</span> : null;
                  })}
                </div>
              ) : null;
            })()}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleCopyShowdown} className="shrink-0">
              {showdownCopied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />}
              {showdownCopied ? 'Copied!' : 'Copy Paste'}
            </Button>
            <div className="relative">
              <Button size="sm" variant="outline" onClick={handleShare} className="shrink-0">
                {shareCopied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5 mr-1.5" />}
                {shareCopied ? 'Link Copied!' : 'Share'}
              </Button>
              {sharePrompt && (
                <span className="absolute top-full left-0 mt-1 text-[10px] text-amber-500 whitespace-nowrap">
                  Publish your team first to share it
                </span>
              )}
            </div>
            {isOwner ? (
              <Link href={`/builder/${teamId}`}>
                <Button size="sm" className="shrink-0">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit in Builder
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={handleAddToBuilder} className="shrink-0">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Add to Builder
              </Button>
            )}
          </div>

          {/* Pokemon grid — 3 per row */}
          <div className="grid grid-cols-3 gap-3">
            {team.pokemonSets.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <PokemonMiniSprite spriteId={speciesToSpriteId(p.species)} name={p.species} size={56} />
                <span className="text-[10px] text-center text-muted-foreground leading-tight max-w-[72px]">{p.species}</span>
                {p.item && <span className="text-[9px] text-center text-muted-foreground/70 max-w-[72px] leading-tight">{p.item}</span>}
              </div>
            ))}
          </div>

          {/* Description — editable if owner, otherwise read-only */}
          {isOwner ? (
            <div className="border-t pt-3">
              {editingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    rows={3}
                    placeholder="Describe your team strategy, win conditions, key synergies…"
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription} disabled={savingDesc}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {savingDesc ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingDescription(false); setDescDraft(team.description ?? ''); }}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setDescDraft(team.description ?? ''); setEditingDescription(true); }}
                  className="w-full text-left text-sm rounded-lg border border-dashed p-3 hover:border-primary/50 hover:bg-accent/30 transition-colors group"
                >
                  {team.description
                    ? <span className="text-muted-foreground">{team.description}</span>
                    : <span className="text-muted-foreground/50 italic flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Add a description of your team strategy…</span>
                  }
                </button>
              )}
            </div>
          ) : (
            team.description && (
              <p className="text-sm text-muted-foreground border-t pt-3 leading-relaxed">{team.description}</p>
            )
          )}

          {/* Owner actions: publish toggle + delete */}
          {isOwner && (
            <div className="border-t pt-3 flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                variant={team.isPublic ? 'outline' : 'default'}
                onClick={handleTogglePublish}
                disabled={togglingPublish}
                className={team.isPublic ? 'border-green-200 text-green-700 hover:border-red-200 hover:text-red-600 hover:bg-red-50 dark:border-green-800 dark:text-green-400 dark:hover:border-red-800 dark:hover:text-red-400 dark:hover:bg-red-950/30' : undefined}
              >
                {team.isPublic
                  ? <><Globe className="h-3.5 w-3.5 mr-1.5" />{togglingPublish ? 'Updating…' : 'Published — click to unpublish'}</>
                  : <><Globe className="h-3.5 w-3.5 mr-1.5" />{togglingPublish ? 'Publishing…' : 'Publish to Community'}</>
                }
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={handleDeleteTeam}
                disabled={deletingTeam}
                className="text-muted-foreground hover:text-destructive ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {deletingTeam ? 'Deleting…' : 'Delete Team'}
              </Button>
            </div>
          )}

          {/* Moves / sets detail */}
          {team.pokemonSets.some(p => p.moves && p.moves.filter(Boolean).length > 0) && (
            <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.pokemonSets.map((p, i) => {
                const statNames: Record<string, string> = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
                const sps = p.evs ? normalizeToSp(toStatsTable(p.evs)) : null;
                const spParts = sps
                  ? (['hp','atk','def','spa','spd','spe'] as const)
                      .filter(k => (sps[k] ?? 0) > 0)
                      .map(k => `${sps[k]} ${statNames[k]}`)
                  : [];
                return (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="font-semibold">{p.species} <span className="text-muted-foreground font-normal">@ {p.item || '—'}</span></div>
                    {p.ability && <div className="text-muted-foreground">Ability: {p.ability}</div>}
                    {spParts.length > 0 && <div className="text-muted-foreground">SPs: {spParts.join(' / ')}</div>}
                    {p.nature && <div className="text-muted-foreground">{p.nature} Nature</div>}
                    {p.moves?.filter(Boolean).map((m, mi) => (
                      <div key={mi} className="text-muted-foreground pl-2">- {m}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments section */}
        <section id="comments" className="scroll-mt-20">
          <h2 className="font-semibold text-base flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4" />
            {totalComments} Comment{totalComments !== 1 ? 's' : ''}
          </h2>

          {/* Post a comment */}
          {session ? (
            <div className="mb-6 border rounded-lg p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-2">Commenting as <span className="font-medium text-foreground">{session.username}</span></p>
              <CommentInput
                placeholder="Share your thoughts on this team..."
                onSubmit={(body) => handlePostComment(body)}
              />
            </div>
          ) : (
            <div className="mb-6 border rounded-lg p-4 text-sm text-muted-foreground bg-muted/20 text-center">
              <button onClick={() => setAuthOpen(true)} className="text-primary underline">Sign in</button> to leave a comment.
            </div>
          )}

          {/* Comment tree */}
          {tree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-1 divide-y">
              {tree.map(c => (
                <CommentNode
                  key={c.id}
                  comment={c}
                  session={session}
                  teamId={teamId}
                  onPostReply={(parentId, body) => handlePostComment(body, parentId)}
                  onVote={handleVote}
                  onDelete={handleDelete}
                  onAuthRequired={() => setAuthOpen(true)}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {importDialog?.open && (
        <ImportConfirmDialog
          slotCount={importDialog.slotCount}
          onConfirm={() => { setImportDialog(null); doImport('replace', 0); }}
          onCancel={() => setImportDialog(null)}
        />
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={(_session) => { setAuthOpen(false); window.location.reload(); }}
      />
    </div>
  );
}
