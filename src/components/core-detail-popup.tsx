'use client';

import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEAM_TAGS } from '@/lib/constants/template-teams';
import { resolveCoreItems } from '@/lib/import-to-builder';
import { CoreScoreBadge } from '@/components/core-score-badge';

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0', Electric: '#F7D02C',
  Grass: '#7AC74C', Ice: '#96D9D6', Fighting: '#C22E28', Poison: '#A33EA1',
  Ground: '#E2BF65', Flying: '#A98FF3', Psychic: '#F95587', Bug: '#A6B91A',
  Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC', Dark: '#705746',
  Steel: '#B7B7CE', Fairy: '#D685AD',
};

interface CorePokemon {
  id: string;
  name: string;
  spriteId: string;
  types: string[];
}

interface DefaultSetInfo {
  item: string;
  itemPool?: { name: string; percent: number }[];
  ability: string;
  moves: string[];
  nature: string;
}


interface Props {
  pokemon: CorePokemon[];
  description: string;
  tags: string[];
  coOccurrence: number;
  coreScore: number;
  synergyPercent?: number;
  winRate?: number;
  defaultSets: Record<string, DefaultSetInfo>;
  onClose: () => void;
  onAddToBuilder: () => void;
}

export function CoreDetailPopup({
  pokemon,
  description,
  tags,
  coOccurrence,
  coreScore,
  synergyPercent = 0,
  winRate = 50,
  defaultSets,
  onClose,
  onAddToBuilder,
}: Props) {
  const names = pokemon.map(p => p.name).join(' + ');
  const resolvedItems = resolveCoreItems(pokemon, defaultSets);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 z-10">
          <div className="flex -space-x-2">
            {pokemon.map(p => (
              <img
                key={p.id}
                src={`https://play.pokemonshowdown.com/sprites/ani/${p.spriteId}.gif`}
                alt={p.name}
                className="w-14 h-14 object-contain border-2 border-card rounded bg-muted/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://play.pokemonshowdown.com/sprites/dex/${p.spriteId}.png`;
                }}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold leading-tight">{names}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <CoreScoreBadge
                score={coreScore}
                synergyPercent={synergyPercent}
                winRate={winRate}
                coOccurrence={coOccurrence}
                isTrio={pokemon.length >= 3}
                label="Score"
                bg={coreScore >= 70 ? '#d4a017' : coreScore >= 45 ? '#c0392b' : coreScore >= 25 ? '#3b82f6' : '#6b7280'}
              />
              {coOccurrence > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {coOccurrence.toFixed(0)}% co-usage
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Description */}
          {description && (
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.map(tagId => {
                const tag = TEAM_TAGS.find(t => t.id === tagId);
                return tag ? (
                  <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: tag.color }}>
                    {tag.label}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Per-Pokemon set details */}
          <div className="space-y-3">
            {pokemon.map(p => {
              const setKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const ds = defaultSets[setKey];
              return (
                <div key={p.id} className="border rounded-lg p-3 bg-card/50">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={`https://play.pokemonshowdown.com/sprites/ani/${p.spriteId}.gif`}
                      alt={p.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://play.pokemonshowdown.com/sprites/dex/${p.spriteId}.png`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {p.types.map(t => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-[1px] rounded text-white font-medium"
                            style={{ background: TYPE_COLORS[t] || '#6b7280' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {ds ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-x-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Item: </span>
                          <span className="font-medium">{resolvedItems[p.id] || ds.item || '---'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ability: </span>
                          <span className="font-medium">{ds.ability || '---'}</span>
                        </div>
                      </div>
                      {ds.nature && (
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Nature: </span>
                          <span className="font-medium">{ds.nature}</span>
                        </div>
                      )}
                      {ds.moves.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ds.moves.slice(0, 4).map((move, i) => (
                            <span key={i} className="text-[10px] bg-muted/60 px-1.5 py-0.5 rounded">
                              {move}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">No default set data available</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add to Builder */}
          <div className="pt-2 border-t">
            <Button
              size="sm"
              className="w-full gap-1.5 bg-[#d4a017] hover:bg-[#b8891a] text-black font-semibold"
              onClick={onAddToBuilder}
            >
              <Plus className="w-3.5 h-3.5" /> Add to Builder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
