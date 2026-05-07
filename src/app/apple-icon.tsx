import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon — hex crest at 180×180.
 * Uses inline SVG elements (Satori doesn't support clipPath polygon).
 */
export default function AppleIcon() {
  const s = 180;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: 'flex', background: 'transparent' }}>
        <svg viewBox="0 0 48 48" width={s} height={s}>
          {/* Hex shield backdrop */}
          <path d="M24 1.5 L43 11 L43 37 L24 46.5 L5 37 L5 11 Z" fill="#0f0f1a" stroke="#d4a017" stroke-width="2" stroke-linejoin="miter" />
          {/* Inner hex frame */}
          <path d="M24 5 L39.5 12.8 L39.5 35.2 L24 43 L8.5 35.2 L8.5 12.8 Z" fill="none" stroke="#d4a017" stroke-width="0.5" stroke-opacity="0.35" />
          {/* Pokeball red top half */}
          <path d="M11 24 A13 13 0 0 1 37 24 Z" fill="#c0392b" />
          {/* Pokeball dark bottom half */}
          <path d="M37 24 A13 13 0 0 1 11 24 Z" fill="#1a1a2e" />
          {/* Horizontal gold band */}
          <rect x="11" y="23.1" width="26" height="1.8" fill="#d4a017" />
          {/* Ball outline */}
          <circle cx="24" cy="24" r="13" fill="none" stroke="#d4a017" stroke-width="1.2" />
          {/* Center button */}
          <circle cx="24" cy="24" r="4.2" fill="#d4a017" />
          <circle cx="24" cy="24" r="3.2" fill="#0f0f1a" />
          <circle cx="24" cy="24" r="2.1" fill="#ffffff" />
          {/* Chevron notches */}
          <path d="M20 2.5 L24 5.5 L28 2.5 Z" fill="#c0392b" />
          <path d="M20 45.5 L24 42.5 L28 45.5 Z" fill="#c0392b" />
        </svg>
      </div>
    ),
    { width: s, height: s },
  );
}
