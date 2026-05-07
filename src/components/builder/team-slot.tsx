'use client';

import { PokemonSprite } from './pokemon-sprite';
import { ItemIcon } from './item-icon';
import { TypeBadge } from './type-badge';
import { Plus, X } from 'lucide-react';
import type { PokemonSet, PokemonSpecies } from '@/types/pokemon';

interface TeamSlotProps {
  slot: number;
  pokemonSet: PokemonSet | null;
  speciesData: PokemonSpecies | null;
  isSelected: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onRemove: () => void;
}

export function TeamSlot({
  slot,
  pokemonSet,
  speciesData,
  isSelected,
  onSelect,
  onAdd,
  onRemove,
}: TeamSlotProps) {
  if (!pokemonSet || !speciesData) {
    return (
      <button
        onClick={onAdd}
        className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-colors"
      >
        <Plus className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground mt-1">Slot {slot + 1}</span>
      </button>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/30'
      }`}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Sprite with item icon overlay */}
      <div className="relative">
        <PokemonSprite
          spriteId={speciesData.spriteId}
          dexNum={speciesData.dexNum}
          name={speciesData.name}
          size={56}
        />
        {pokemonSet.item && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <ItemIcon itemName={pokemonSet.item} size={20} />
          </div>
        )}
      </div>

      <div className="text-xs font-medium truncate max-w-full mt-0.5">{speciesData.name}</div>
      <div className="flex gap-0.5 mt-0.5">
        {speciesData.types.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </div>
    </div>
  );
}
