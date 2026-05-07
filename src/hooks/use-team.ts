'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PokemonSet, PokemonSpecies, StatsTable } from '@/types/pokemon';
import { createEmptySet } from '@/types/pokemon';

export type TeamSlotData = {
  set: PokemonSet;
  species: PokemonSpecies;
} | null;

export function useTeam() {
  const [slots, setSlots] = useState<TeamSlotData[]>(Array(6).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('Untitled Team');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Restore draft team from localStorage on mount (playground mode only)
  useEffect(() => {
    if (restored) return;
    setRestored(true);
    try {
      // If a replace-mode template import is pending, skip draft restore entirely.
      // The template import effect will own all slots, so restoring the draft would race.
      const templateJson = localStorage.getItem('poketeam_import_template');
      if (templateJson) {
        const t = JSON.parse(templateJson);
        if ((t._mode ?? 'replace') === 'replace') return;
        // merge mode: draft restore runs for the LOWER slots,
        // template import will target HIGHER slots (_startSlot and above) — no overlap.
      }

      const draft = localStorage.getItem('poketeam_draft_team');
      if (!draft) return;
      const data = JSON.parse(draft);
      if (data.name) setTeamName(data.name);
      if (data.teamId) setTeamId(data.teamId);
      if (Array.isArray(data.slots) && data.slots.length > 0) {
        // Fetch all species in parallel, then set all slots atomically
        setIsRestoring(true);
        type SavedSlot = { slot: { set: PokemonSet; speciesId: string }; i: number };
        const validSlots: SavedSlot[] = data.slots
          .slice(0, 6)
          .map((slot: { set: PokemonSet; speciesId: string }, i: number) => ({ slot, i }))
          .filter(({ slot }: SavedSlot) => slot.speciesId);

        Promise.all(
          validSlots.map(async ({ slot, i }: SavedSlot) => {
            try {
              const res = await fetch(`/api/pokemon?q=${encodeURIComponent(slot.speciesId)}&limit=5`);
              const results = await res.json();
              const species = results.find((p: PokemonSpecies) => p.id === slot.speciesId) || results[0];
              return species ? { i, set: slot.set, species } : null;
            } catch { return null; }
          })
        ).then((results) => {
          const resolved = results.filter(Boolean) as { i: number; set: PokemonSet; species: PokemonSpecies }[];
          if (resolved.length > 0) {
            setSlots(prev => {
              const next = [...prev];
              resolved.forEach(({ i, set, species }) => { next[i] = { set, species }; });
              return next;
            });
          }
          setIsRestoring(false);
        });
      }
    } catch {}
  }, [restored]);

  const addPokemon = useCallback((slotIndex: number, species: PokemonSpecies) => {
    const defaultAbility = species.abilities['0'] || Object.values(species.abilities)[0] || '';
    const set = createEmptySet(species.name, defaultAbility);

    // Auto-assign mega stone if this is a Mega Pokemon
    const isMega = species.name.includes('-Mega') || species.tags?.includes('Mega Evolution');
    if (isMega && species.baseSpecies) {
      // Common mega stone naming: species name + "ite" (e.g., "Charizardite X", "Garchompite")
      const baseName = species.baseSpecies;
      if (species.name.includes('-Mega-X')) {
        set.item = `${baseName}ite X`;
      } else if (species.name.includes('-Mega-Y')) {
        set.item = `${baseName}ite Y`;
      } else if (species.name.includes('-Mega-Z')) {
        set.item = `${baseName}ite Z`;
      } else {
        set.item = `${baseName}ite`;
      }
      // Special cases
      const stoneOverrides: Record<string, string> = {
        'Venusaur-Mega': 'Venusaurite',
        'Blastoise-Mega': 'Blastoisinite',
        'Alakazam-Mega': 'Alakazite',
        'Kangaskhan-Mega': 'Kangaskhanite',
        'Aerodactyl-Mega': 'Aerodactylite',
        'Ampharos-Mega': 'Ampharosite',
        'Heracross-Mega': 'Heracrossite',
        'Tyranitar-Mega': 'Tyranitarite',
        'Gardevoir-Mega': 'Gardevoirite',
        'Aggron-Mega': 'Aggronite',
        'Metagross-Mega': 'Metagrossite',
        'Lopunny-Mega': 'Lopunnite',
        'Abomasnow-Mega': 'Abomasite',
        'Audino-Mega': 'Audinite',
        'Steelix-Mega': 'Steelixite',
        'Scizor-Mega': 'Scizorite',
        'Gengar-Mega': 'Gengarite',
        'Gyarados-Mega': 'Gyaradosite',
        'Charizard-Mega-X': 'Charizardite X',
        'Charizard-Mega-Y': 'Charizardite Y',
        'Mewtwo-Mega-X': 'Mewtwonite X',
        'Mewtwo-Mega-Y': 'Mewtwonite Y',
      };
      if (stoneOverrides[species.name]) {
        set.item = stoneOverrides[species.name];
      }
    }

    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { set, species };
      return next;
    });
    setSelectedSlot(slotIndex);
  }, []);

  const removePokemon = useCallback((slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setSelectedSlot((prev) => (prev === slotIndex ? null : prev));
  }, []);

  const updateSet = useCallback((slotIndex: number, updates: Partial<PokemonSet>) => {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[slotIndex];
      if (!slot) return prev;
      next[slotIndex] = {
        ...slot,
        set: { ...slot.set, ...updates },
      };
      return next;
    });
  }, []);

  const updateMove = useCallback((slotIndex: number, moveIndex: number, move: string) => {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[slotIndex];
      if (!slot) return prev;
      const moves = [...slot.set.moves] as [string, string, string, string];
      moves[moveIndex] = move;
      next[slotIndex] = { ...slot, set: { ...slot.set, moves } };
      return next;
    });
  }, []);

  const updateEv = useCallback((slotIndex: number, stat: keyof StatsTable, value: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[slotIndex];
      if (!slot) return prev;
      const evs = { ...slot.set.evs, [stat]: Math.min(32, Math.max(0, value)) };
      // Safety cap: 66 total stat points (Champions system)
      const total = Object.values(evs).reduce((a, b) => a + b, 0);
      if (total > 66) {
        const excess = total - 66;
        evs[stat] = Math.max(0, evs[stat] - excess);
      }
      next[slotIndex] = { ...slot, set: { ...slot.set, evs } };
      return next;
    });
  }, []);

  const getFirstEmptySlot = useCallback(() => {
    return slots.findIndex((s) => s === null);
  }, [slots]);

  const toExportArray = useCallback(() => {
    return slots.filter((s): s is TeamSlotData & {} => s !== null).map((s) => s.set);
  }, [slots]);

  // Auto-save to localStorage on any change (debounced).
  // Skip while isRestoring so an empty initial slot array (before fetch resolves)
  // can't overwrite a draft that's about to be hydrated.
  useEffect(() => {
    if (isRestoring) return;
    const timer = setTimeout(() => {
      try {
        const data = slots
          .filter((s): s is NonNullable<TeamSlotData> => s !== null)
          .map(s => ({ set: s.set, speciesId: s.species.id }));
        localStorage.setItem('poketeam_draft_team', JSON.stringify({
          name: teamName,
          teamId,
          slots: data,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [slots, teamName, teamId, isRestoring]);

  return {
    slots,
    setSlots,
    selectedSlot,
    setSelectedSlot,
    teamName,
    setTeamName,
    teamId,
    setTeamId,
    isRestoring,
    addPokemon,
    removePokemon,
    updateSet,
    updateMove,
    updateEv,
    getFirstEmptySlot,
    toExportArray,
  };
}
