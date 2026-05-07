'use client';

import { useMemo } from 'react';
import itemPositions from '@/data/item-sprites.json';

const SHEET_URL = 'https://play.pokemonshowdown.com/sprites/itemicons-sheet.png';
const positions = itemPositions as unknown as Record<string, [number, number]>;

export function ItemIcon({ itemName, size = 24 }: { itemName: string; size?: number }) {
  if (!itemName) return null;

  const key = useMemo(() => itemName.toLowerCase().replace(/[^a-z0-9]/g, ''), [itemName]);
  const pos = positions[key];

  if (!pos) {
    // Unknown item — show nothing
    return null;
  }

  const scale = size / 24;

  return (
    <div
      className="shrink-0 inline-block"
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        backgroundImage: `url(${SHEET_URL})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${pos[0] * scale}px ${pos[1] * scale}px`,
        backgroundSize: `${384 * scale}px`,
      }}
      title={itemName}
    />
  );
}
