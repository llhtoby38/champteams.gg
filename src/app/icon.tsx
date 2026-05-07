import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * ChampTeams hex-crest favicon — 32×32 PNG.
 * Uses inline SVG elements (not clipPath polygon, which Satori ignores).
 */
export default function Icon() {
  const s = 32;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: 'flex', background: 'transparent' }}>
        <svg viewBox="0 0 48 48" width={s} height={s}>
          {/* Hex shield backdrop */}
          <path d="M24 1.5 L43 11 L43 37 L24 46.5 L5 37 L5 11 Z" fill="#0f0f1a" stroke="#d4a017" stroke-width="2.5" stroke-linejoin="miter" />
          {/* Pokeball red top half */}
          <path d="M11 24 A13 13 0 0 1 37 24 Z" fill="#c0392b" />
          {/* Pokeball dark bottom half */}
          <path d="M37 24 A13 13 0 0 1 11 24 Z" fill="#1a1a2e" />
          {/* Horizontal gold band */}
          <rect x="11" y="23" width="26" height="2" fill="#d4a017" />
          {/* Ball outline */}
          <circle cx="24" cy="24" r="13" fill="none" stroke="#d4a017" stroke-width="1.4" />
          {/* Center button */}
          <circle cx="24" cy="24" r="4.5" fill="#d4a017" />
          <circle cx="24" cy="24" r="3.3" fill="#0f0f1a" />
          <circle cx="24" cy="24" r="2.2" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
