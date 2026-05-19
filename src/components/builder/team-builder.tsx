'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTeam } from '@/hooks/use-team';
import { useLocalStorage, getAuthSession } from '@/hooks/use-local-storage';
import { useDefaultMetaThreats } from '@/hooks/use-default-meta-threats';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { TeamSlot } from './team-slot';
import { PokemonSelector } from './pokemon-selector';
import { PokemonEditor, NATURES } from './pokemon-editor';
import { StatDisplay } from './stat-display';
import { EvEditor } from './ev-editor';
import { Separator } from '@/components/ui/separator';
import { ShowdownExport } from '@/components/team/showdown-export';
import { TypeCoverage } from '@/components/analysis/type-coverage';
import { TypeMatchupChart } from '@/components/analysis/type-matchup-chart';
import { SpeedTiers } from '@/components/analysis/speed-tiers';
import { DamageCalcPanel } from '@/components/analysis/damage-calc-panel';
import { MetaThreatEditor } from '@/components/analysis/meta-threat-editor';
import { TeamScoreBadge } from '@/components/team-score-badge';
import { computeTeamTags } from '@/lib/pokemon/team-tags';
import { normalizeEvsToSp } from '@/lib/pokemon/stats';
import { useFormat } from '@/hooks/use-format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Download, Shield, Gauge, GripVertical, AlertTriangle, X, ChevronDown, ChevronUp, Undo2, Trash2, PanelRightOpen, PanelRightClose, Plus, MousePointerClick, Share2, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';
import type { PokemonSpecies, StatsTable } from '@/types/pokemon';
import { createEmptySet } from '@/types/pokemon';
import type { MetaThreat, CalcConditions } from '@/types/calc';
import { DEFAULT_META_THREATS, DEFAULT_CALC_CONDITIONS } from '@/types/calc';
import { importTeamFromShowdown } from '@/lib/pokemon/export';
import { prefetchLearnsets } from '@/lib/pokemon/learnset-cache';
import { validateTeam, type TeamViolation } from '@/lib/pokemon/validate-team';
import { TeamValidationDialog } from './team-validation-dialog';
import { MEGA_STONE_MAP } from '@/lib/constants/mega-stones';

/** Content equality for meta threats — ignores `id` since defaults use
 *  server-generated ids that may differ between revisions. */
function threatsEqual(a: MetaThreat, b: MetaThreat): boolean {
  return a.species === b.species
    && a.item === b.item
    && a.ability === b.ability
    && a.nature === b.nature
    && a.role === b.role
    && JSON.stringify(a.evs) === JSON.stringify(b.evs)
    && JSON.stringify(a.moves) === JSON.stringify(b.moves);
}

/** Normalize meta threat EVs: convert old 0-252 values to SP 0-32 */
function normalizeMetaThreats(threats: MetaThreat[]): MetaThreat[] {
  return threats.map(t => {
    if (!t.evs) return t;
    const maxVal = Math.max(...Object.values(t.evs).map(v => v ?? 0));
    if (maxVal <= 32) return t; // Already SP
    const normalized = normalizeEvsToSp({
      hp: t.evs.hp ?? 0, atk: t.evs.atk ?? 0, def: t.evs.def ?? 0,
      spa: t.evs.spa ?? 0, spd: t.evs.spd ?? 0, spe: t.evs.spe ?? 0,
    });
    return { ...t, evs: normalized };
  });
}

interface TeamBuilderProps {
  initialTeamId?: string;
  initialTeamData?: { name: string; pokemonSets: unknown[]; metaThreats?: unknown[] | null } | null;
}

export function TeamBuilder({ initialTeamId, initialTeamData }: TeamBuilderProps = {}) {
  const team = useTeam();
  const { formatId } = useFormat();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSlot, setSelectorSlot] = useState(0);
  const [showdownOpen, setShowdownOpen] = useState(false);
  const [showdownTab, setShowdownTab] = useState<'export' | 'import'>('export');
  const [saving, setSaving] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [calcPanelWidth, setCalcPanelWidth] = useState(520);
  const [midPanelWidth, setMidPanelWidth] = useState(360);
  const [selectedDisplaySpecies, setSelectedDisplaySpecies] = useState<PokemonSpecies | null>(null);
  const [teamGridCollapsed, setTeamGridCollapsed] = useState(false);
  const [statsPanelExpanded, setStatsPanelExpanded] = useState(false);
  const [session, setSession] = useState<{ userId: string; username: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [coverageTab, setCoverageTab] = useState<'team' | 'chart'>('team');
  const [speedOpen, setSpeedOpen] = useState(false);
  const [threatEditorOpen, setThreatEditorOpen] = useState(false);
  const [threatEditorFocusId, setThreatEditorFocusId] = useState<string | null>(null);
  const [calcConditions, setCalcConditions] = useState<CalcConditions>({ ...DEFAULT_CALC_CONDITIONS });
  const [metaThreats, setMetaThreats] = useLocalStorage<MetaThreat[]>('poketeam_meta_threats', DEFAULT_META_THREATS);
  // Tracks whether the user has explicitly saved their own list. When false,
  // the current list is auto-refreshed from the server defaults on every load.
  const [metaThreatsCustomized, setMetaThreatsCustomized] = useLocalStorage<boolean>('poketeam_meta_threats_customized', false);
  const defaultMetaThreats = useDefaultMetaThreats();
  const [validationViolations, setValidationViolations] = useState<TeamViolation[]>([]);
  const [validationContext, setValidationContext] = useState<'load' | 'save'>('load');
  const [validationOpen, setValidationOpen] = useState(false);

  // Default sets from tournament data (for auto-fill on add)
  const [defaultSetsMap, setDefaultSetsMap] = useState<Record<string, { name: string; item: string; ability: string; moves: string[]; nature: string; evs: Record<string, number>; role: string | null }>>({});

  // Undo state for remove/clear actions
  type UndoSnapshot = { slots: typeof team.slots; selectedSlot: number | null; label: string };
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Meta scores from tier list (for team score badge)
  const [metaScores, setMetaScores] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    fetch('/api/tier-list')
      .then(r => r.json())
      .then((d: { tiers?: { pokemon: { id: string; metaScore: number }[] }[] }) => {
        const map = new Map<string, number>();
        d.tiers?.forEach(t => t.pokemon.forEach(p => map.set(p.id, p.metaScore)));
        setMetaScores(map);
      })
      .catch(() => { /* ignore */ });
  }, []);

  // Fetch default sets for auto-fill and meta threats fallback
  useEffect(() => {
    fetch('/api/default-sets')
      .then(r => r.json())
      .then((data: Record<string, { name: string; item: string; ability: string; moves: string[]; nature: string; evs: Record<string, number>; role: string | null }>) => {
        if (data && typeof data === 'object') {
          setDefaultSetsMap(data);
        }
      })
      .catch(() => {});
  }, []);

  // The canonical default list comes from /api/default-meta-threats (cached).
  // Exposed as a function so the editor's "Restore Defaults" button can reuse
  // the exact same list the user sees on first load.
  const buildDbDefaultThreats = useCallback((): MetaThreat[] => {
    return defaultMetaThreats?.threats ?? [];
  }, [defaultMetaThreats]);

  // One-shot migration for pre-flag users: if a non-trivial list is in
  // localStorage but the customized flag was never written, decide now.
  // Lists that still exactly match the old hardcoded DEFAULT_META_THREATS are
  // treated as uncustomized (eligible for auto-refresh); anything else is
  // preserved by setting customized=true.
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (migrationDoneRef.current) return;
    if (typeof window === 'undefined') return;
    migrationDoneRef.current = true;
    const flagRaw = localStorage.getItem('poketeam_meta_threats_customized');
    if (flagRaw !== null) return; // already migrated or explicitly set
    const isHardcodedDefault = metaThreats.length === DEFAULT_META_THREATS.length
      && metaThreats.every((t, i) => threatsEqual(t, DEFAULT_META_THREATS[i]));
    if (!isHardcodedDefault && metaThreats.length > 0) {
      setMetaThreatsCustomized(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh for uncustomized users: whenever the server list arrives, if
  // the user has never saved their own edits — or still has the old hardcoded
  // stock list sitting in localStorage — replace it with the fresh server
  // defaults. Users who have explicitly saved are left untouched.
  useEffect(() => {
    if (!defaultMetaThreats || defaultMetaThreats.threats.length === 0) return;
    if (metaThreatsCustomized) return;
    // Avoid no-op writes that thrash localStorage subscribers
    const sameLength = metaThreats.length === defaultMetaThreats.threats.length;
    const sameFirst = metaThreats[0]?.id === defaultMetaThreats.threats[0]?.id
      && metaThreats[0]?.nature === defaultMetaThreats.threats[0]?.nature;
    if (sameLength && sameFirst) return;
    setMetaThreats(defaultMetaThreats.threats);
  }, [defaultMetaThreats, metaThreatsCustomized]); // eslint-disable-line react-hooks/exhaustive-deps

  const pushUndo = useCallback((snapshot: UndoSnapshot) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnapshot(snapshot);
    undoTimerRef.current = setTimeout(() => setUndoSnapshot(null), 8000);
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    team.setSlots(undoSnapshot.slots);
    if (undoSnapshot.selectedSlot !== null) team.setSelectedSlot(undoSnapshot.selectedSlot);
    setUndoSnapshot(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoSnapshot, team]);

  const handleRemovePokemon = useCallback((slotIndex: number) => {
    const removedSlot = team.slots[slotIndex];
    if (!removedSlot) return;
    pushUndo({ slots: [...team.slots], selectedSlot: team.selectedSlot, label: `Removed ${removedSlot.species.name}` });
    team.removePokemon(slotIndex);
  }, [team, pushUndo]);

  const handleClearAll = useCallback(() => {
    const hasAny = team.slots.some(s => s !== null);
    if (!hasAny) return;
    pushUndo({ slots: [...team.slots], selectedSlot: team.selectedSlot, label: 'Cleared all Pokémon' });
    team.setSlots(Array(6).fill(null));
    team.setSelectedSlot(null);
  }, [team, pushUndo]);

  // Load meta threats from user account (if logged in), or normalize local cache.
  // A DB-saved list implies the user explicitly customized at some point — so
  // we mark the localStorage flag accordingly, preventing the default-refresh
  // effect from stomping on it on subsequent loads.
  useEffect(() => {
    const s = getAuthSession();
    if (s?.userId) {
      fetch('/api/user/meta-threats', { headers: { 'x-user-id': s.userId } })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Treat any DB list as customized UNLESS it looks exactly like the old
            // hardcoded DEFAULT_META_THREATS (first entry = Incineroar id '1') —
            // in which case the user never actually customized; they inherited
            // the stock list from a prior session and we want to auto-refresh.
            const looksLikeOldStock = (data as MetaThreat[])[0]?.id === '1'
              && (data as MetaThreat[])[0]?.species === 'Incineroar';
            if (!looksLikeOldStock) {
              setMetaThreats(normalizeMetaThreats(data as MetaThreat[]));
              setMetaThreatsCustomized(true);
            }
          }
        })
        .catch(() => {}); // fall back to localStorage
    }
    // Normalize local cache
    const normalized = normalizeMetaThreats(metaThreats);
    const changed = JSON.stringify(normalized) !== JSON.stringify(metaThreats);
    if (changed) setMetaThreats(normalized);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save meta threats to user account whenever they change.
  // If the saved list is byte-for-byte identical to the current server
  // defaults, keep customized=false so future tournament rotations continue
  // to auto-refresh this user. Any drift flips customized=true and freezes
  // their list until they hit Restore Defaults.
  const saveMetaThreatsToUser = useCallback((threats: MetaThreat[]) => {
    const serverDefaults = defaultMetaThreats?.threats ?? [];
    const matchesDefaults = serverDefaults.length > 0
      && threats.length === serverDefaults.length
      && threats.every((t, i) => threatsEqual(t, serverDefaults[i]));
    setMetaThreatsCustomized(!matchesDefaults);
    setMetaThreats(threats);
    const s = getAuthSession();
    if (s?.userId) {
      fetch('/api/user/meta-threats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': s.userId },
        body: JSON.stringify(matchesDefaults ? [] : threats),
      }).catch(() => {}); // best-effort
    }
  }, [defaultMetaThreats, setMetaThreats, setMetaThreatsCustomized]);

  const updateSingleThreat = useCallback((id: string, patch: Partial<MetaThreat>) => {
    saveMetaThreatsToUser(metaThreats.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [metaThreats, saveMetaThreatsToUser]);

  const openThreatInEditor = useCallback((id: string) => {
    setThreatEditorFocusId(id);
    setThreatEditorOpen(true);
  }, []);

  // On fresh builder (no URL teamId), clear any stale teamId from draft restore
  // so saves always create a new team rather than overwriting an old one.
  useEffect(() => {
    if (!initialTeamId) team.setTeamId(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch learnsets for all loaded team members so switching tabs is instant
  useEffect(() => {
    const ids = team.slots
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => s.species.id);
    if (ids.length > 0) prefetchLearnsets(ids);
  }, [team.slots]);

  // Load initial team data (when loading a saved team via /builder/[teamId])
  useEffect(() => {
    if (!initialTeamData || !initialTeamId) return;
    team.setTeamId(initialTeamId);
    team.setTeamName(initialTeamData.name || 'Untitled Team');

    // Load all Pokemon in parallel, then set all slots atomically
    const sets = initialTeamData.pokemonSets as { species: string; [key: string]: unknown }[];
    if (Array.isArray(sets)) {
      const validSets = sets.slice(0, 6).map((set, i) => ({ set, i })).filter(({ set }) => set.species);
      Promise.all(
        validSets.map(async ({ set, i }) => {
          try {
            const res = await fetch(`/api/pokemon?q=${encodeURIComponent(set.species)}&limit=10`);
            const data = await res.json();
            if (!data.length) return null;
            // Prefer exact name match over partial match (e.g., "Froslass" should match "Froslass", not "Froslass-Mega")
            const exact = data.find((p: PokemonSpecies) => p.name.toLowerCase() === set.species.toLowerCase()) || data[0];
            return { i, species: exact, set };
          } catch { return null; }
        })
      ).then(async (results) => {
        const resolved = results.filter(Boolean) as { i: number; species: PokemonSpecies; set: { species: string; ability?: string; item?: string; nature?: string; moves?: unknown; evs?: unknown; ivs?: unknown } }[];
        if (resolved.length === 0) return;

        // If template species differs from API species (mega→base conversion), re-fetch base form
        const fixedResults = await Promise.all(resolved.map(async (r) => {
          if (r.set.species && r.set.species.toLowerCase() !== r.species.name.toLowerCase()) {
            try {
              const res2 = await fetch(`/api/pokemon?q=${encodeURIComponent(r.set.species)}&limit=5&format=${formatId}`);
              const data2 = await res2.json();
              const baseMatch = data2.find((p: PokemonSpecies) => p.name.toLowerCase() === r.set.species.toLowerCase());
              if (baseMatch) return { ...r, species: baseMatch };
            } catch { /* use original */ }
          }
          return r;
        }));

        team.setSlots(prev => {
          const next = Array(6).fill(null) as typeof prev;
          fixedResults.forEach(({ i, species, set }) => {
            const defaultAbility = species.abilities['0'] || Object.values(species.abilities)[0] || '';
            const emptySet = { ...createEmptySet(species.name, defaultAbility) };
            if (set.ability) emptySet.ability = set.ability as string;
            if (set.item) emptySet.item = set.item as string;
            if (set.nature) emptySet.nature = set.nature as string;
            if (set.moves) emptySet.moves = set.moves as [string, string, string, string];
            if (set.evs) emptySet.evs = normalizeEvsToSp(set.evs as typeof emptySet.evs);
            if (set.ivs) emptySet.ivs = set.ivs as typeof emptySet.ivs;
            next[i] = { set: emptySet, species };
          });
          return next;
        });
      }).then(() => {
        // Validate loaded team against format
        const pokemonSlots = sets.slice(0, 6).filter((s: any) => s.species).map((s: any) => ({
          species: s.species,
          item: s.item,
          moves: s.moves,
        }));
        validateTeam(pokemonSlots, formatId).then(v => {
          if (v.length > 0) {
            setValidationViolations(v);
            setValidationContext('load');
            setValidationOpen(true);
          }
        });
      });
    }
  }, [initialTeamId, initialTeamData]);

  // Check for template import from browse / team detail pages
  useEffect(() => {
    if (initialTeamId) return; // Don't import template when loading a saved team
    try {
      const templateJson = localStorage.getItem('poketeam_import_template');
      if (!templateJson) return;
      localStorage.removeItem('poketeam_import_template');
      const template = JSON.parse(templateJson);
      if (!Array.isArray(template.pokemon) || template.pokemon.length === 0) return;

      if (template.name) team.setTeamName(template.name);

      const mode: 'replace' | 'merge' = template._mode ?? 'replace';
      // In replace mode, clear all slots first to prevent any stale state
      if (mode === 'replace') {
        team.setSlots(Array(6).fill(null));
      }

      // Start slot: 0 for replace, or the first slot after existing Pokemon for merge
      const startSlot: number = mode === 'merge' ? (template._startSlot ?? 0) : 0;

      // Mega stone → base form mapping for import conversion
      const MEGA_IMPORT_MAP: Record<string, { base: string; stone: string }> = {
        'Froslass-Mega': { base: 'Froslass', stone: 'Froslassite' },
        'Tyranitar-Mega': { base: 'Tyranitar', stone: 'Tyranitarite' },
        'Gengar-Mega': { base: 'Gengar', stone: 'Gengarite' },
        'Charizard-Mega-X': { base: 'Charizard', stone: 'Charizardite X' },
        'Charizard-Mega-Y': { base: 'Charizard', stone: 'Charizardite Y' },
        'Garchomp-Mega': { base: 'Garchomp', stone: 'Garchompite' },
        'Scizor-Mega': { base: 'Scizor', stone: 'Scizorite' },
        'Gardevoir-Mega': { base: 'Gardevoir', stone: 'Gardevoirite' },
        'Dragonite-Mega': { base: 'Dragonite', stone: 'Dragoninite' },
        'Starmie-Mega': { base: 'Starmie', stone: 'Starminite' },
        'Floette-Mega': { base: 'Floette-Eternal', stone: 'Floettite' },
        'Delphox-Mega': { base: 'Delphox', stone: 'Delphoxite' },
        'Glimmora-Mega': { base: 'Glimmora', stone: 'Glimmoranite' },
        'Venusaur-Mega': { base: 'Venusaur', stone: 'Venusaurite' },
        'Aggron-Mega': { base: 'Aggron', stone: 'Aggronite' },
        'Golurk-Mega': { base: 'Golurk', stone: 'Golurkite' },
        'Altaria-Mega': { base: 'Altaria', stone: 'Altarianite' },
        'Audino-Mega': { base: 'Audino', stone: 'Audinite' },
        'Gyarados-Mega': { base: 'Gyarados', stone: 'Gyaradosite' },
        'Kangaskhan-Mega': { base: 'Kangaskhan', stone: 'Kangaskhanite' },
        'Aerodactyl-Mega': { base: 'Aerodactyl', stone: 'Aerodactylite' },
        'Meganium-Mega': { base: 'Meganium', stone: 'Meganiumite' },
        'Ampharos-Mega': { base: 'Ampharos', stone: 'Ampharosite' },
      };

      // Resolve all Pokemon in parallel, then commit slots atomically so the
      // user sees the team appear all at once instead of trickling in.
      Promise.all(
        template.pokemon.map(async (rawSet: { species: string; [key: string]: unknown }, i: number) => {
          const targetSlot = startSlot + i;
          if (targetSlot >= 6 || !rawSet.species) return null;
          const megaInfo = MEGA_IMPORT_MAP[rawSet.species as string];
          const set = megaInfo
            ? { ...rawSet, species: megaInfo.base, item: megaInfo.stone }
            : rawSet;
          try {
            const res = await fetch(`/api/pokemon?q=${encodeURIComponent(set.species as string)}&limit=5&format=${formatId}`);
            const data = await res.json();
            const match = data.find((p: PokemonSpecies) => p.name.toLowerCase() === (set.species as string).toLowerCase()) || data[0];
            if (!match) return null;
            return { targetSlot, set, match, megaInfo };
          } catch { return null; }
        })
      ).then((resolved) => {
        const slots = resolved.filter((r): r is NonNullable<typeof r> => r !== null);
        if (slots.length === 0) return;
        team.setSlots(prev => {
          const next = [...prev];
          for (const { targetSlot, set, match, megaInfo } of slots) {
            const defaultAbility = match.abilities['0'] || Object.values(match.abilities)[0] || '';
            const finalSet = createEmptySet(match.name, defaultAbility);
            if (set.ability) finalSet.ability = set.ability as string;
            if (set.item) finalSet.item = set.item as string;
            if (set.nature) finalSet.nature = set.nature as string;
            if (set.moves) finalSet.moves = set.moves as [string, string, string, string];
            if (set.evs) finalSet.evs = normalizeEvsToSp(set.evs as StatsTable);
            if (set.ivs) finalSet.ivs = set.ivs as typeof finalSet.ivs;
            // Auto-fill from default sets when nothing was provided
            if (!set.moves && !set.item && !set.ability && defaultSetsMap) {
              const dsId = (set.species as string).toLowerCase().replace(/[^a-z0-9]/g, '');
              const ds = defaultSetsMap[dsId];
              if (ds) {
                if (ds.moves?.length) finalSet.moves = ds.moves.slice(0, 4) as [string, string, string, string];
                if (ds.item && !megaInfo) finalSet.item = ds.item;
                if (ds.ability) finalSet.ability = ds.ability;
                if (ds.nature) finalSet.nature = ds.nature;
                if (ds.evs) finalSet.evs = normalizeEvsToSp(ds.evs as unknown as StatsTable);
              }
            }
            // Re-apply mega stone after default-sets pass (default item shouldn't override the mega stone)
            if (megaInfo) finalSet.item = megaInfo.stone;
            next[targetSlot] = { set: finalSet, species: match };
          }
          return next;
        });
      });

      // Validate imported template against format
      const pokemonSlots = template.pokemon.slice(0, 6).filter((s: any) => s.species).map((s: any) => ({
        species: s.species,
        item: s.item,
        moves: s.moves,
      }));
      validateTeam(pokemonSlots, formatId).then(v => {
        if (v.length > 0) {
          setValidationViolations(v);
          setValidationContext('load');
          setValidationOpen(true);
        }
      });
    } catch {}
  }, [initialTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check auth on mount and show warning if not logged in
  useEffect(() => {
    const s = getAuthSession();
    setSession(s);
    if (!s) {
      // Show warning after a short delay (don't interrupt initial load)
      const timer = setTimeout(() => setShowWarning(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAddPokemon = (slotIndex: number) => {
    setSelectorSlot(slotIndex);
    setSelectorOpen(true);
  };

  const handleSelectPokemon = async (species: PokemonSpecies, targetSlot?: number) => {
    // Caller-supplied slot wins (Suggested Partners passes the first empty slot
    // directly). Falls back to selectorSlot for the PokemonSelector path.
    const slot = targetSlot ?? selectorSlot;

    // If the user picked a Mega form directly, convert to base form + auto-equip mega stone
    const megaMatch = species.name.match(/^(.+?)-Mega(?:-([XYZ]))?$/);
    if (megaMatch) {
      const baseName = megaMatch[1]; // e.g. "Ampharos", "Charizard"
      const suffix = megaMatch[2];   // "X", "Y", "Z" or undefined

      // Look up the mega stone from the static map (authoritative Showdown data)
      // Check both the regex-extracted base name and the species' baseSpecies field
      const entries = MEGA_STONE_MAP[baseName]
        || (species.baseSpecies ? MEGA_STONE_MAP[species.baseSpecies] : null);
      const stoneEntry = entries && suffix
        ? entries.find(e => e.mega.endsWith(`-${suffix}`)) || entries[0]
        : entries?.[0];

      // Fetch the base form species — try both baseName and species.baseSpecies
      const fetchBase = species.baseSpecies || baseName;
      try {
        const res = await fetch(`/api/pokemon?q=${encodeURIComponent(fetchBase)}&limit=10`);
        const data: PokemonSpecies[] = await res.json();
        const baseSpecies = data.find(p => p.name === fetchBase) || data.find(p => p.name === baseName) || data[0];
        if (baseSpecies) {
          team.addPokemon(slot, baseSpecies);
          if (stoneEntry) team.updateSet(slot, { item: stoneEntry.stone });
          // Auto-fill from default set (but keep mega stone if already assigned)
          const megaId = species.id.replace(/-/g, '').toLowerCase();
          const ds = defaultSetsMap[megaId] || defaultSetsMap[baseSpecies.id];
          if (ds) {
            const updates: Record<string, unknown> = {};
            if (ds.ability) updates.ability = ds.ability;
            if (ds.nature) updates.nature = ds.nature;
            if (ds.moves && ds.moves.length > 0) updates.moves = [...ds.moves.slice(0, 4), ...Array(4 - Math.min(4, ds.moves.length)).fill('')].slice(0, 4);
            if (ds.evs) updates.evs = ds.evs;
            // Don't override item if mega stone was set
            if (!stoneEntry && ds.item) updates.item = ds.item;
            team.updateSet(slot, updates);
          }
          team.setSelectedSlot(slot);
          setTeamGridCollapsed(true);
          return;
        }
      } catch { /* fall through to normal add */ }
    }

    team.addPokemon(slot, species);
    // Auto-fill from default set for non-mega Pokemon
    const ds = defaultSetsMap[species.id];
    if (ds) {
      const updates: Record<string, unknown> = {};
      if (ds.item) updates.item = ds.item;
      if (ds.ability) updates.ability = ds.ability;
      if (ds.nature) updates.nature = ds.nature;
      if (ds.moves && ds.moves.length > 0) updates.moves = [...ds.moves.slice(0, 4), ...Array(4 - Math.min(4, ds.moves.length)).fill('')].slice(0, 4);
      if (ds.evs) updates.evs = ds.evs;
      team.updateSet(slot, updates);
    }
    team.setSelectedSlot(slot);
    setTeamGridCollapsed(true);
  };


  const handleSave = async () => {
    // Always cache to localStorage first
    try {
      localStorage.setItem('poketeam_current_team', JSON.stringify({
        name: team.teamName,
        pokemon: team.toExportArray(),
      }));
      // Always cache meta threats (overwrite global cache)
      localStorage.setItem('poketeam_meta_threats', JSON.stringify(metaThreats));
    } catch {}

    if (!session) {
      setAuthMessage('Sign in to save your team to the cloud. Your team is cached locally but may be lost if you clear browser data.');
      setAuthDialogOpen(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const exportedPokemon = team.toExportArray();

      // Validate team legality before saving
      const slotsForValidation = exportedPokemon.map(p => ({
        species: p.species,
        item: p.item,
        moves: p.moves,
      }));
      const violations = await validateTeam(slotsForValidation, formatId);
      if (violations.length > 0) {
        setValidationViolations(violations);
        setValidationContext('save');
        setValidationOpen(true);
        setSaving(false);
        return;
      }
      const computedTags = computeTeamTags(exportedPokemon.map(p => ({
        species: p.species,
        ability: p.ability,
        item: p.item,
        moves: p.moves,
      })));
      const body = { name: team.teamName, pokemon: exportedPokemon, tags: computedTags, format: formatId };
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.userId) authHeaders['x-user-id'] = session.userId;

      let savedId = team.teamId;
      if (team.teamId) {
        await fetch(`/api/teams/${team.teamId}`, {
          method: 'PUT', headers: authHeaders,
          body: JSON.stringify({ ...body, pokemonSets: body.pokemon }),
        });
      } else {
        const res = await fetch('/api/teams', {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify(body),
        });
        const data = await res.json();
        savedId = data.id;
        team.setTeamId(data.id);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      toast.success('Team saved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save team');
    }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    if (!session) {
      setAuthMessage('Sign in to share your team with a link.');
      setAuthDialogOpen(true);
      return;
    }
    // Save first if not yet saved
    if (!team.teamId) {
      await doSave();
    }
    const id = team.teamId;
    if (!id) return;
    // Auto-publish
    await fetch(`/api/teams/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.userId },
      body: JSON.stringify({ isPublic: true }),
    });
    const url = `${window.location.origin}/teams/${id}`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${team.teamName} — ChampTeams`,
        text: `Check out my VGC team: ${team.teamName}`,
        url: shareUrl,
      });
    } catch { /* user cancelled */ }
  };

  // After successful auth, re-trigger save
  const handleAuthSuccess = (s: { userId: string; username: string }) => {
    setSession(s);
    setShowWarning(false);
    // Auto-save after login
    doSave();
  };

  const handleImport = async (importText: string) => {
    const sets = importTeamFromShowdown(importText);

    // Fetch all species in parallel, then apply sequentially to avoid state races
    const resolved = await Promise.all(
      sets.slice(0, 6).map(async (set) => {
        if (!set.species) return null;
        try {
          const res = await fetch(`/api/pokemon?q=${encodeURIComponent(set.species)}&limit=10`);
          const data = await res.json();
          // Prefer exact name match (e.g., "Floette" not "Floette-Mega")
          const exact = data.find((p: PokemonSpecies) => p.name === set.species) || data[0];
          return exact ? { species: exact, set } : null;
        } catch { return null; }
      }),
    );

    // Apply all at once — each slot gets set sequentially
    for (let i = 0; i < resolved.length; i++) {
      const r = resolved[i];
      if (!r) continue;
      team.addPokemon(i, r.species);
      const updates: Partial<typeof r.set> = {};
      if (r.set.ability) updates.ability = r.set.ability;
      if (r.set.item) updates.item = r.set.item;
      if (r.set.nature) updates.nature = r.set.nature;
      if (r.set.moves) updates.moves = r.set.moves as [string, string, string, string];
      if (r.set.evs) updates.evs = normalizeEvsToSp(r.set.evs as StatsTable);
      team.updateSet(i, updates);
    }
  };

  // Reset display species when selected slot changes
  useEffect(() => { setSelectedDisplaySpecies(null); }, [team.selectedSlot]);

  const selectedData = team.selectedSlot !== null ? team.slots[team.selectedSlot] : null;
  const activeTeamMembers = team.slots.filter((s): s is NonNullable<typeof s> => s !== null);

  // Compute team meta score (average of active Pokemon scores)
  const teamScoreBreakdown = (() => {
    if (!activeTeamMembers.length || !metaScores.size) return null;
    const members = activeTeamMembers.map(m => {
      const id = (m.species?.id || m.species?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const score = metaScores.get(id);
      return { name: m.species?.name || '?', score: score == null ? null : Math.round(score * 10) / 10 };
    });
    const scored = members.filter((m): m is { name: string; score: number } => m.score != null);
    if (!scored.length) return null;
    const avg = Math.round((scored.reduce((a, b) => a + b.score, 0) / scored.length) * 10) / 10;
    return { avg, members };
  })();
  const teamMetaScore = teamScoreBreakdown?.avg ?? null;

  const metaScoreColor = (s: number) =>
    s >= 55 ? '#d4a017' : s >= 35 ? '#c0392b' : s >= 20 ? '#3b82f6' : '#6b7280';

  if (team.isRestoring) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4a017] border-t-transparent animate-spin" />
        <span className="text-sm">Loading team...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 border-b flex-wrap shrink-0">
        <Input
          value={team.teamName}
          onChange={(e) => team.setTeamName(e.target.value)}
          className="h-8 max-w-[160px] sm:max-w-xs font-medium text-sm"
          placeholder="Team name..."
        />
        <div className="flex gap-1.5 ml-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setCoverageOpen(true)}>
            <Shield className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Coverage</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSpeedOpen(true)}>
            <Gauge className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Speed</span>
          </Button>
          <div className="w-px h-6 bg-border hidden sm:block" />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}
            className={saveSuccess ? 'border-green-400 text-green-600' : ''}>
            <Save className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          {saveSuccess && team.teamId && (
            <Link href={`/teams/${team.teamId}`}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#d4a017] hover:underline font-medium">
              View Details →
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => { setShowdownTab('export'); setShowdownOpen(true); }}>
            <Download className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Showdown</span>
          </Button>
        </div>
      </div>

      {/* Warning banner for non-logged-in users */}
      {showWarning && !session && (
        <div className="px-3 pt-2 shrink-0">
          <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">
              Your team is saved in your browser. <strong>Sign in</strong> to keep it across devices and sessions.
            </span>
            <button onClick={() => { setAuthDialogOpen(true); setAuthMessage(''); }} className="text-[#d4a017] font-medium hover:underline shrink-0">Sign in</button>
            <button onClick={() => setShowWarning(false)} className="text-amber-400 hover:text-amber-600 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Team grid — collapsible on mobile only */}
      <div className="shrink-0">
        {/* Toggle bar */}
        <div className="w-full flex items-center px-3 py-1.5 border-b text-xs text-muted-foreground">
          {/* Collapse toggle — mobile only, fills left side so tapping anywhere on it works */}
          <button
            className="lg:hidden flex-1 flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => setTeamGridCollapsed(c => !c)}
          >
            {teamGridCollapsed
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronUp className="h-3.5 w-3.5" />}
            <span className="font-medium">
              {activeTeamMembers.length}/6 Pokémon
            </span>
          </button>
          {/* Static label — desktop/tablet */}
          <span className="hidden lg:inline font-medium">
            {activeTeamMembers.length}/6 Pokémon
          </span>
          {teamMetaScore != null && teamScoreBreakdown && (
            <div className="ml-2">
              <TeamScoreBadge
                score={teamMetaScore}
                members={teamScoreBreakdown.members}
                bg={metaScoreColor(teamMetaScore)}
                footerLink={{ href: '/tier-list', label: 'See full tier list →' }}
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {undoSnapshot && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#d4a017]/10 text-[#d4a017] hover:bg-[#d4a017]/20 transition-colors font-medium animate-in fade-in slide-in-from-right-2 duration-200"
              >
                <Undo2 className="h-3 w-3" /> Undo
              </button>
            )}
            {activeTeamMembers.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                title="Clear all Pokémon"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>
        </div>
        {/* Grid: always visible on lg+, collapsible on mobile */}
        <div className={`p-3 ${teamGridCollapsed ? 'hidden lg:block' : ''}`}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {team.slots.map((slot, i) => (
              <TeamSlot key={i} slot={i}
                pokemonSet={slot?.set || null} speciesData={slot?.species || null}
                isSelected={team.selectedSlot === i}
                onSelect={() => { team.setSelectedSlot(i); setTeamGridCollapsed(true); }}
                onAdd={() => handleAddPokemon(i)}
                onRemove={() => handleRemovePokemon(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 border-t flex min-h-0">

        {/* Unified empty state — spans full width when no Pokemon selected */}
        {!selectedData && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
            {activeTeamMembers.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Start building your team</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap a <span className="font-medium">+</span> slot above to add your first Pokémon
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Select a Pokémon to configure</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose one of your team members above to edit its moves, item, and stats
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* LEFT: sprite, ability, item, nature, moves — only when a Pokemon is selected */}
        {selectedData && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-lg xl:max-w-none relative p-3">
              {/* Close button — mobile only, top-right corner */}
              <button
                className="lg:hidden absolute top-0 right-0 z-10 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { team.setSelectedSlot(null); setTeamGridCollapsed(false); }}
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <PokemonEditor
                pokemonSet={selectedData.set}
                species={selectedData.species}
                onUpdate={(updates) => team.updateSet(team.selectedSlot!, updates)}
                onMoveUpdate={(moveIndex, move) => team.updateMove(team.selectedSlot!, moveIndex, move)}
                onEvUpdate={(stat, value) => team.updateEv(team.selectedSlot!, stat, value)}
                onDisplaySpeciesChange={setSelectedDisplaySpecies}
                statsPanelExpanded={statsPanelExpanded}
                onExpandStatsPanel={() => setStatsPanelExpanded(true)}
              />
            </div>

            {/* Mobile only: damage calcs inline — no parent padding so sticky top-0 is flush */}
            <div className="lg:hidden border-t">
              <DamageCalcPanel
                selectedSlot={selectedData}
                displaySpeciesName={selectedDisplaySpecies?.name}
                displaySpecies={selectedDisplaySpecies}
                metaThreats={metaThreats}
                conditions={calcConditions}
                onConditionsChange={setCalcConditions}
                onEditThreats={() => { setThreatEditorFocusId(null); setThreatEditorOpen(true); }}
                onUpdateThreat={updateSingleThreat}
                onOpenThreatInEditor={openThreatInEditor}
              />
            </div>
          </div>
        )}

        {/* Side panels — only shown when a Pokemon is selected */}
        {selectedData && (
          <>
            {/* Left↔Middle resize handle — visible when stats panel is expanded on lg+ */}
            {statsPanelExpanded && (
              <div
                className="hidden lg:flex w-2 cursor-col-resize items-center justify-center hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startWidth = midPanelWidth;
                  const onMouseMove = (ev: MouseEvent) => {
                    const delta = ev.clientX - startX;
                    setMidPanelWidth(Math.max(240, Math.min(600, startWidth - delta)));
                  };
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
                onTouchStart={(e) => {
                  const startX = e.touches[0].clientX;
                  const startWidth = midPanelWidth;
                  const onTouchMove = (ev: TouchEvent) => {
                    ev.preventDefault();
                    const delta = ev.touches[0].clientX - startX;
                    setMidPanelWidth(Math.max(240, Math.min(600, startWidth - delta)));
                  };
                  const onTouchEnd = () => {
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                  };
                  document.addEventListener('touchmove', onTouchMove, { passive: false });
                  document.addEventListener('touchend', onTouchEnd);
                }}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}

            {/* MIDDLE: Stats + EVs — visible when expanded on lg+ */}
            {statsPanelExpanded && (
              <div className="hidden lg:flex flex-col shrink-0 border-r overflow-y-auto p-3 gap-4" style={{ width: midPanelWidth }}>
                {(() => {
                  const displaySpecies = selectedDisplaySpecies ?? selectedData.species;
                  const nature = NATURES.find(n => n.name === selectedData.set.nature) ?? { plus: null, minus: null };
                  const isMega = displaySpecies.id !== selectedData.species.id;
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          Stats (Lv. 50){isMega ? ' — Mega Form' : ''}
                        </p>
                        <button
                          onClick={() => setStatsPanelExpanded(false)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Collapse stats panel"
                        >
                          <PanelRightClose className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <StatDisplay
                        baseStats={displaySpecies.baseStats}
                        evs={selectedData.set.evs}
                        nature={nature}
                      />
                      <Separator />
                      <EvEditor
                        evs={selectedData.set.evs}
                        onEvChange={(stat, value) => team.updateEv(team.selectedSlot!, stat, value)}
                      />
                    </>
                  );
                })()}
              </div>
            )}

            {/* Middle↔Right resize handle — desktop only */}
            <div
              className="hidden lg:flex w-2 cursor-col-resize items-center justify-center hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-none"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = calcPanelWidth;
                const onMouseMove = (ev: MouseEvent) => {
                  const delta = startX - ev.clientX;
                  setCalcPanelWidth(Math.max(280, Math.min(1100, startWidth + delta)));
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX;
                const startWidth = calcPanelWidth;
                const onTouchMove = (ev: TouchEvent) => {
                  ev.preventDefault();
                  const delta = startX - ev.touches[0].clientX;
                  setCalcPanelWidth(Math.max(280, Math.min(1100, startWidth + delta)));
                };
                const onTouchEnd = () => {
                  document.removeEventListener('touchmove', onTouchMove);
                  document.removeEventListener('touchend', onTouchEnd);
                };
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
              }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            </div>

            {/* RIGHT: Damage calc — desktop only, resizable */}
            <div className="hidden lg:block overflow-y-auto shrink-0" style={{ width: calcPanelWidth }}>
              <DamageCalcPanel
                selectedSlot={selectedData}
                displaySpeciesName={selectedDisplaySpecies?.name}
                displaySpecies={selectedDisplaySpecies}
                metaThreats={metaThreats}
                conditions={calcConditions}
                onConditionsChange={setCalcConditions}
                onEditThreats={() => { setThreatEditorFocusId(null); setThreatEditorOpen(true); }}
                onUpdateThreat={updateSingleThreat}
                onOpenThreatInEditor={openThreatInEditor}
              />
            </div>
          </>
        )}

      </div>

      {/* Team validation dialog */}
      <TeamValidationDialog
        open={validationOpen}
        onClose={() => setValidationOpen(false)}
        violations={validationViolations}
        context={validationContext}
      />

      {/* Auth dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
        message={authMessage}
      />

      {/* Type Coverage popup */}
      <Dialog open={coverageOpen} onOpenChange={setCoverageOpen}>
        <DialogContent className="
          !fixed !top-14 !bottom-0 !left-0 !right-0
          !translate-x-0 !translate-y-0
          !max-w-none !rounded-none !rounded-t-xl
          sm:!top-[5vh] sm:!bottom-auto sm:!left-1/2 sm:!right-auto
          sm:!-translate-x-1/2 sm:!translate-y-0
          sm:!w-[92vw] sm:!max-w-[1400px] sm:!max-h-[90vh] sm:!rounded-2xl
          flex flex-col gap-0 !p-0 overflow-y-auto
        ">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0"><DialogTitle>Type Analysis</DialogTitle></DialogHeader>
          {/* Tabs */}
          <div className="flex gap-1 border-b pb-2 px-4">
            <button
              onClick={() => setCoverageTab('team')}
              className={`text-xs px-3 py-1.5 rounded-t border-b-2 transition-colors ${coverageTab === 'team' ? 'border-[#d4a017] text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Team Coverage
            </button>
            <button
              onClick={() => setCoverageTab('chart')}
              className={`text-xs px-3 py-1.5 rounded-t border-b-2 transition-colors ${coverageTab === 'chart' ? 'border-[#d4a017] text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Type Chart
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {coverageTab === 'team' ? (
              <TypeCoverage team={activeTeamMembers.map((s) => ({ species: s.species, moves: s.set.moves.filter(Boolean), ability: s.set.ability }))} />
            ) : (
              <TypeMatchupChart />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Speed Tiers popup */}
      <Dialog open={speedOpen} onOpenChange={setSpeedOpen}>
        <DialogContent className="
          !fixed !top-14 !bottom-0 !left-0 !right-0
          !translate-x-0 !translate-y-0
          !max-w-none !rounded-none !rounded-t-xl
          sm:!top-1/2 sm:!bottom-auto sm:!left-1/2 sm:!right-auto
          sm:!-translate-x-1/2 sm:!-translate-y-1/2
          sm:!max-w-3xl sm:!max-h-[80vh] sm:!rounded-xl
          flex flex-col gap-0 !p-0
        ">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0"><DialogTitle>Speed Tier Comparison</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <SpeedTiers team={activeTeamMembers} conditions={calcConditions} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Meta Threat Editor popup */}
      <MetaThreatEditor
        open={threatEditorOpen}
        onOpenChange={(open) => { setThreatEditorOpen(open); if (!open) setThreatEditorFocusId(null); }}
        threats={metaThreats}
        onSave={saveMetaThreatsToUser}
        onRestoreDefaults={buildDbDefaultThreats}
        initialFocusThreatId={threatEditorFocusId}
      />

      {/* Dialogs */}
      <PokemonSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectPokemon}
        formatId={formatId}
        teamSpecies={activeTeamMembers.map(m => m.species)}
      />
      <ShowdownExport open={showdownOpen} onOpenChange={setShowdownOpen} pokemon={team.toExportArray()} teamName={team.teamName} initialTab={showdownTab} onImport={handleImport} />

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="!max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Team</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your team is now public. Share it with others!
          </p>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2 min-w-0">
            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
              className="text-xs flex-1 min-w-0 bg-transparent border-0 outline-none font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleCopyLink} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button variant="outline" onClick={handleNativeShare} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Share to...
              </Button>
            )}
            <Link href={`/teams/${team.teamId}`}
              className="inline-flex items-center justify-center w-full text-sm text-[#d4a017] hover:underline font-medium py-1">
              View Team Page →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
