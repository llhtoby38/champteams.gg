import Link from 'next/link';
import { PokeballLogo } from './logo';

export function Footer() {
  return (
    <footer
      style={{
        background: '#0f0f1a',
        borderTop: '1px solid rgba(212,160,23,0.22)',
        color: 'white',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent strip — gold → red bleed */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, #d4a017 20%, #c0392b 50%, #d4a017 80%, transparent 100%)',
        }}
      />

      {/* Giant outline wordmark bleed */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-0.5rem',
          bottom: '-2.5rem',
          fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(8rem, 22vw, 18rem)',
          lineHeight: 0.75,
          letterSpacing: '-0.04em',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(212,160,23,0.07)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        CHAMPTEAMS
      </div>

      <div
        className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-8 relative"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* ── Top row: brand + nav columns ────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-10">
          {/* Brand block */}
          <div style={{ maxWidth: '320px' }}>
            <div className="flex items-center gap-3 mb-4">
              <PokeballLogo size={38} />
              <div>
                <div
                  style={{
                    fontFamily: '"Saira Condensed", sans-serif',
                    fontWeight: 900,
                    fontSize: '1.3rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    lineHeight: 0.9,
                    color: 'white',
                  }}
                >
                  Champ<span style={{ color: '#d4a017' }}>Teams</span>
                  <span style={{ color: '#d4a017', opacity: 0.7, fontSize: '0.85em' }}>.gg</span>
                </div>
                <div
                  style={{
                    fontFamily: '"Saira Condensed", sans-serif',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    letterSpacing: '0.24em',
                    color: 'rgba(212,160,23,0.75)',
                    marginTop: '0.35rem',
                    textTransform: 'uppercase',
                  }}
                >
                  VGC · REG M-A · EST. 2026
                </div>
              </div>
            </div>
            <p
              style={{
                color: 'rgba(255,255,255,0.42)',
                fontSize: '0.82rem',
                lineHeight: 1.7,
                paddingLeft: '0.85rem',
                borderLeft: '2px solid rgba(212,160,23,0.45)',
              }}
            >
              The all-in-one team hub for Pokémon Champions competitive play. Built by players, for players.
            </p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-14">
            <FooterColumn
              label="Build"
              links={[
                { href: '/builder', label: 'Team Builder' },
                { href: '/teams', label: 'My Teams' },
                { href: '/templates', label: 'Templates' },
              ]}
            />
            <FooterColumn
              label="Explore"
              links={[
                { href: '/browse', label: 'Browse Teams' },
                { href: '/browse?tab=cores', label: 'Top Cores' },
                { href: '/browse?tab=creators', label: 'Creators' },
              ]}
            />
            <FooterColumn
              label="Community"
              links={[
                { href: 'https://x.com/ChampTeamsGG', label: 'X / Twitter', external: true },
                { href: 'https://ko-fi.com/champteamsgg', label: 'Support on Ko-fi', external: true },
                { href: '/landing', label: 'About Reg M-A' },
              ]}
            />
          </div>
        </div>

        {/* ── Divider with tournament frame ─────────────────── */}
        <div
          style={{
            position: 'relative',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.3) 50%, transparent 100%)',
            margin: '0 0 1.75rem 0',
          }}
        />

        {/* ── Credits & disclaimer — data sheet style ────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '0.75rem 1.25rem',
            fontFamily: '"Saira Condensed", sans-serif',
            fontSize: '0.72rem',
            lineHeight: 1.7,
            marginBottom: '1.25rem',
          }}
        >
          <DataLabel>SOURCE</DataLabel>
          <DataValue>
            Sprites & data from{' '}
            <FooterLink href="https://github.com/smogon/pokemon-showdown">Pokémon Showdown</FooterLink>{' '}
            (Smogon University) under{' '}
            <FooterLink href="https://github.com/smogon/pokemon-showdown/blob/master/LICENSE">MIT License</FooterLink>
            . Damage calcs by{' '}
            <FooterLink href="https://github.com/smogon/damage-calc">@smogon/calc</FooterLink>.
          </DataValue>

          <DataLabel>SUPPORT</DataLabel>
          <DataValue>
            ChampTeams is free and ad-free. Help keep it running —{' '}
            <FooterLink href="https://ko-fi.com/champteamsgg">buy us a coffee on Ko-fi</FooterLink>
            . Follow{' '}
            <FooterLink href="https://x.com/ChampTeamsGG">@ChampTeamsGG</FooterLink>
            {' '}for updates, bug reports, and feature requests.
          </DataValue>

          <DataLabel>LEGAL</DataLabel>
          <DataValue>
            Pokémon and all related properties are © The Pokémon Company, Nintendo, Game Freak, and
            Creatures. ChampTeams.gg is an independent fan project — not produced, endorsed,
            supported, or affiliated with Pokémon, Nintendo, Game Freak, or Creatures.
          </DataValue>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.5rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontFamily: '"Saira Condensed", sans-serif',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.32)',
          }}
        >
          <span>© {new Date().getFullYear()} ChampTeams.gg</span>
          <a
            href="https://x.com/ChampTeamsGG"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'rgba(255,255,255,0.4)',
              transition: 'color 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              letterSpacing: '0.14em',
            }}
            className="hover:!text-[#d4a017]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @ChampTeamsGG
          </a>
          <span>All trademarks belong to their owners</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Internals ─────────────────────────────────────── */

function FooterColumn({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <nav className="flex flex-col gap-2.5">
      <div
        style={{
          fontFamily: '"Saira Condensed", sans-serif',
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(212,160,23,0.8)',
          textTransform: 'uppercase',
          paddingBottom: '0.35rem',
          borderBottom: '1px solid rgba(212,160,23,0.2)',
          marginBottom: '0.25rem',
        }}
      >
        // {label}
      </div>
      {links.map((l) =>
        l.external ? (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.82rem',
              transition: 'color 0.15s',
              textDecoration: 'none',
            }}
            className="hover:!text-[#d4a017]"
          >
            {l.label}
          </a>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.82rem',
              transition: 'color 0.15s, transform 0.15s',
              textDecoration: 'none',
            }}
            className="hover:!text-[#d4a017] hover:translate-x-0.5"
          >
            {l.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function DataLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.22em',
        color: 'rgba(212,160,23,0.65)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        paddingTop: '0.15rem',
      }}
    >
      // {children}
    </div>
  );
}

function DataValue({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.74rem', lineHeight: 1.75 }}>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'rgba(212,160,23,0.85)', textDecoration: 'none' }}
      className="hover:!text-[#d4a017] hover:underline"
    >
      {children}
    </a>
  );
}
