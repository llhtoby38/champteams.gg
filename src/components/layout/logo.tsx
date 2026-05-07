// No 'use client' needed — pure SVG, no hooks

interface PokeballLogoProps {
  size?: number;
  className?: string;
}

/**
 * ChampTeams crest: a hexagonal shield framing a pokeball core.
 * Gold outer ring / red-to-black gradient bisect / white center eye.
 * Designed to read as a VGC tournament crest, not a plain pokeball.
 */
export function PokeballLogo({ size = 32, className }: PokeballLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ct-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c040" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="ct-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e04a39" />
          <stop offset="100%" stopColor="#8a2419" />
        </linearGradient>
      </defs>

      {/* Hexagonal shield backdrop */}
      <path
        d="M24 1.5 L43 11 L43 37 L24 46.5 L5 37 L5 11 Z"
        fill="#0f0f1a"
        stroke="url(#ct-gold)"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />

      {/* Inner hex frame — thin */}
      <path
        d="M24 5 L39.5 12.8 L39.5 35.2 L24 43 L8.5 35.2 L8.5 12.8 Z"
        fill="none"
        stroke="#d4a017"
        strokeWidth="0.6"
        strokeOpacity="0.35"
      />

      {/* Pokeball — top red half (sharper, with gradient) */}
      <path
        d="M11 24 A13 13 0 0 1 37 24 Z"
        fill="url(#ct-red)"
      />
      {/* Pokeball — bottom black half */}
      <path
        d="M37 24 A13 13 0 0 1 11 24 Z"
        fill="#1a1a2e"
      />
      {/* Horizontal band — gold */}
      <rect x="11" y="23.1" width="26" height="1.8" fill="#d4a017" />

      {/* Ball outline */}
      <circle cx="24" cy="24" r="13" fill="none" stroke="#d4a017" strokeWidth="1.2" />

      {/* Center button — gold ring / dark ring / white core */}
      <circle cx="24" cy="24" r="4.2" fill="#d4a017" />
      <circle cx="24" cy="24" r="3.2" fill="#0f0f1a" />
      <circle cx="24" cy="24" r="2.1" fill="#ffffff" />

      {/* Chevron notches at top/bottom of hex — crest marker */}
      <path d="M20 2.5 L24 5.5 L28 2.5 Z" fill="#c0392b" />
      <path d="M20 45.5 L24 42.5 L28 45.5 Z" fill="#c0392b" />
    </svg>
  );
}

interface ChampTeamsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { ball: 28, fontSize: '1rem' },
  md: { ball: 32, fontSize: '1.15rem' },
  lg: { ball: 52, fontSize: '1.75rem' },
};

export function ChampTeamsLogo({ className, size = 'md' }: ChampTeamsLogoProps) {
  const { ball, fontSize } = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ''}`}
      style={{ lineHeight: 1 }}
    >
      <PokeballLogo size={ball} />
      <span
        className="hidden sm:inline"
        style={{
          fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
          fontWeight: 900,
          fontSize,
          letterSpacing: '0.02em',
          color: 'white',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        Champ<span style={{ color: '#d4a017' }}>Teams</span>
        <span style={{ color: '#d4a017', fontWeight: 500, fontSize: '0.78em', opacity: 0.8 }}>
          .gg
        </span>
      </span>
    </span>
  );
}
