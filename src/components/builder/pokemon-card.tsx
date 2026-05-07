'use client';

import { PokemonSprite } from './pokemon-sprite';
import { TypeBadge } from './type-badge';
import type { PokemonSpecies } from '@/types/pokemon';

interface PokemonCardProps {
  pokemon: PokemonSpecies;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function PokemonCard({ pokemon, onClick, selected, compact }: PokemonCardProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 p-2 rounded-lg border hover:bg-accent transition-colors w-full text-left ${
          selected ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <PokemonSprite
          spriteId={pokemon.spriteId}
          dexNum={pokemon.dexNum}
          name={pokemon.name}
          size={40}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{pokemon.name}</div>
          <div className="flex gap-1">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-2.5 rounded-lg border hover:bg-accent hover:border-primary/30 transition-all cursor-pointer ${
        selected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <PokemonSprite
        spriteId={pokemon.spriteId}
        dexNum={pokemon.dexNum}
        name={pokemon.name}
        size={72}
      />
      <div className="text-xs font-medium mt-1 truncate max-w-full">{pokemon.name}</div>
      <div className="flex gap-0.5 mt-1">
        {pokemon.types.map((t) => (
          <TypeBadge key={t} type={t} size="sm" />
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        #{String(pokemon.dexNum).padStart(3, '0')}
      </div>
    </button>
  );
}
