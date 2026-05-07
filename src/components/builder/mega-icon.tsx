interface MegaIconProps {
  size?: number;
  active?: boolean;
  className?: string;
}

export function MegaIcon({ size = 20, active = false, className }: MegaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Rainbow iridescent background gradient */}
        <radialGradient id="mega-bg" cx="45%" cy="38%" r="65%">
          <stop offset="0%" stopColor={active ? '#f0a0e0' : '#c8b0d0'} />
          <stop offset="22%" stopColor={active ? '#a060d8' : '#8878b0'} />
          <stop offset="44%" stopColor={active ? '#60a8f0' : '#7898c8'} />
          <stop offset="66%" stopColor={active ? '#50d0b0' : '#70b0a0'} />
          <stop offset="85%" stopColor={active ? '#80e060' : '#90b878'} />
          <stop offset="100%" stopColor={active ? '#e0d040' : '#b0a860'} />
        </radialGradient>
        {/* Shine overlay */}
        <radialGradient id="mega-shine" cx="35%" cy="25%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* DNA path gradient */}
        <linearGradient id="dna-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? '#1a1a2e' : '#2a2a3e'} />
          <stop offset="100%" stopColor={active ? '#0d0d1a' : '#1a1a2e'} />
        </linearGradient>
      </defs>

      {/* Outer dark rim */}
      <circle cx="20" cy="20" r="19.5" fill="#1a1a2e" />

      {/* Rainbow background fill */}
      <circle cx="20" cy="20" r="17" fill="url(#mega-bg)" />

      {/* Shine */}
      <circle cx="20" cy="20" r="17" fill="url(#mega-shine)" />

      {/* DNA double helix — strand 1 (S-curve left) */}
      <path
        d="M 14 8
           C 14 11, 18 13, 20 16
           C 22 19, 26 21, 26 24
           C 26 27, 22 29, 20 32"
        fill="none"
        stroke="url(#dna-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* DNA double helix — strand 2 (S-curve right) */}
      <path
        d="M 26 8
           C 26 11, 22 13, 20 16
           C 18 19, 14 21, 14 24
           C 14 27, 18 29, 20 32"
        fill="none"
        stroke="url(#dna-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Crossbars */}
      <line x1="15.5" y1="11.5" x2="24.5" y2="13" stroke="url(#dna-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16.5" y1="16.5" x2="23.5" y2="16.5" stroke="url(#dna-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16.5" y1="23.5" x2="23.5" y2="23.5" stroke="url(#dna-grad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="15.5" y1="27" x2="24.5" y2="28.5" stroke="url(#dna-grad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
