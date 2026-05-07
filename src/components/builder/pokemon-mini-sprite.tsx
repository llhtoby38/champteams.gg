'use client';

import { useState, useEffect } from 'react';
import { getSerebiiMegaSprite } from '@/lib/sprites';

/**
 * Small Pokemon sprite — static only (gen5/dex PNG).
 * Used in team lists, damage calc panels, speed tiers, dropdowns.
 */
export function PokemonMiniSprite({
  spriteId,
  name,
  size = 32,
  className = '',
}: {
  spriteId: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const [errCount, setErrCount] = useState(0);
  const safeSpriteId = spriteId || '';
  const safeName = name || '?';

  // Reset when species changes
  useEffect(() => { setErrCount(0); }, [safeSpriteId]);

  if (!safeSpriteId) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-muted rounded text-[8px] font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {safeName.charAt(0)}
      </span>
    );
  }

  // Derive base spriteId for fallback (strip -mega/-megax/-megay/-megaz suffix)
  const baseSpriteId = safeSpriteId.replace(/-mega[xyz]?$/, '');
  const dashlessSpriteId = safeSpriteId.replace(/-/g, '');
  const firstDashIdx = safeSpriteId.indexOf('-');
  const firstDashCollapsed = firstDashIdx >= 0
    ? safeSpriteId.slice(0, firstDashIdx + 1) + safeSpriteId.slice(firstDashIdx + 1).replace(/-/g, '')
    : safeSpriteId;
  const serebiiMega = getSerebiiMegaSprite(safeSpriteId);

  const variantCandidates = Array.from(new Set([
    safeSpriteId,
    firstDashCollapsed,
    dashlessSpriteId,
  ]));

  const PLACEHOLDER_HOME = new Set(['floette-eternal', 'floette-mega']);
  const skipHome = PLACEHOLDER_HOME.has(safeSpriteId);

  const srcs = [
    ...(skipHome ? [] : variantCandidates.map(v => `https://play.pokemonshowdown.com/sprites/home/${v}.png`)),
    ...variantCandidates.map(v => `https://play.pokemonshowdown.com/sprites/gen5/${v}.png`),
    ...variantCandidates.map(v => `https://play.pokemonshowdown.com/sprites/dex/${v}.png`),
    ...(serebiiMega ? [serebiiMega] : []),
    ...(baseSpriteId !== safeSpriteId ? [
      `https://play.pokemonshowdown.com/sprites/home/${baseSpriteId}.png`,
      `https://play.pokemonshowdown.com/sprites/gen5/${baseSpriteId}.png`,
    ] : []),
  ];

  if (errCount >= srcs.length) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-muted rounded text-[8px] font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {safeName.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={srcs[errCount]}
      alt={safeName}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setErrCount(errCount + 1)}
      loading="lazy"
    />
  );
}
