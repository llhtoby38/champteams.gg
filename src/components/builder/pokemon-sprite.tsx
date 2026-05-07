'use client';

import { useState, useEffect } from 'react';
import { getShowdownSprite, getPokeApiSprite, getPokeApiBasicSprite, getSerebiiMegaSprite } from '@/lib/sprites';

interface PokemonSpriteProps {
  spriteId: string;
  dexNum: number;
  name: string;
  size?: number;
  className?: string;
  /** When true, prefers animated GIF. Default false (static home/ sprite). */
  animated?: boolean;
}

/**
 * Pokemon sprite with fallback chain.
 * animated=false (default): home/ → gen5/ → dex/ → base-form home/ → PokeAPI
 * animated=true:  ani/ → home/ → gen5/ → dex/ → base-form ani/ → base-form home/ → PokeAPI
 */
export function PokemonSprite({
  spriteId,
  dexNum,
  name,
  size = 68,
  className = '',
  animated = false,
}: PokemonSpriteProps) {
  const [srcIndex, setSrcIndex] = useState(0);

  // Reset when species or animated mode changes
  useEffect(() => { setSrcIndex(0); }, [spriteId, animated]);

  // Derive base spriteId for fallback (strip -mega/-megax/-megay/-megaz suffix)
  const baseSpriteId = spriteId.replace(/-mega[xyz]?$/, '');
  // Champions-exclusive Mega forms live in Serebii's Legends Z-A pack.
  const serebiiMega = getSerebiiMegaSprite(spriteId);

  // Some Showdown home/ sprites are placeholder pokeball icons (200 OK but ~1.7KB).
  // Skip home/ for these and use gen5/dex which have the real sprites.
  const PLACEHOLDER_HOME = new Set(['floette-eternal', 'floette-mega']);
  const skipHome = PLACEHOLDER_HOME.has(spriteId);

  const homeUrl = getShowdownSprite(spriteId);
  const gen5Url = `https://play.pokemonshowdown.com/sprites/gen5/${spriteId}.png`;
  const dexUrl = `https://play.pokemonshowdown.com/sprites/dex/${spriteId}.png`;

  const srcs = animated
    ? [
        `https://play.pokemonshowdown.com/sprites/ani/${spriteId}.gif`,
        ...(skipHome ? [] : [homeUrl]),
        gen5Url,
        dexUrl,
        ...(serebiiMega ? [serebiiMega] : []),
        ...(baseSpriteId !== spriteId ? [
          `https://play.pokemonshowdown.com/sprites/ani/${baseSpriteId}.gif`,
          getShowdownSprite(baseSpriteId),
        ] : []),
        getPokeApiSprite(dexNum),
        getPokeApiBasicSprite(dexNum),
      ]
    : [
        ...(skipHome ? [] : [homeUrl]),
        gen5Url,
        dexUrl,
        ...(serebiiMega ? [serebiiMega] : []),
        ...(baseSpriteId !== spriteId ? [getShowdownSprite(baseSpriteId)] : []),
        getPokeApiSprite(dexNum),
        getPokeApiBasicSprite(dexNum),
      ];

  const handleError = () => {
    if (srcIndex < srcs.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setSrcIndex(-1); // show placeholder
    }
  };

  if (srcIndex === -1) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg text-muted-foreground font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={srcs[srcIndex]}
      alt={name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={handleError}
      loading="lazy"
    />
  );
}
