import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Monitor, Smartphone, FolderOpen, Globe } from 'lucide-react';
import { Footer } from '@/components/layout/footer';
import { Slideshow } from '@/components/landing/slideshow';
import type { Slide } from '@/components/landing/slideshow';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

export const metadata: Metadata = {
  title: 'Pokemon Champions Team Builder & Damage Calculator | ChampTeams.gg',
  description:
    'The best free Pokemon Champions team builder with built-in damage calculator, speed tiers, type coverage analysis, and Showdown import/export. Build competitive VGC teams for Regulation M-A with Mega Evolution support. Works on mobile.',
  keywords: [
    'Pokemon Champions team builder',
    'Pokemon Champions damage calculator',
    'VGC team builder',
    'VGC damage calc',
    'Pokemon Champions competitive',
    'Reg M-A teams',
    'Pokemon Champions Mega Evolution',
    'VGC 2026',
    'Pokemon Champions speed tiers',
    'competitive Pokemon teams',
    'Pokémon Champions',
    'VGC doubles',
    'Pokemon Champions teambuilder',
    'Pokemon Champions calculator',
    'Pokemon Champions speed tiers',
    'best VGC team builder',
    'Pokemon Champions EV calculator',
    'Pokemon Champions type coverage',
  ],
  alternates: {
    canonical: 'https://champteams.gg/landing',
  },
  openGraph: {
    title: 'Pokemon Champions Team Builder & Damage Calculator | ChampTeams.gg',
    description:
      'Free all-in-one VGC team builder for Pokemon Champions. Damage calculator, speed tiers, type coverage, Showdown import/export, and community teams. Reg M-A · Doubles · Mega Evolution.',
    type: 'website',
    siteName: 'ChampTeams.gg',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ChampTeamsGG',
    title: 'Pokemon Champions Team Builder & Damage Calculator',
    description: 'Free all-in-one VGC team builder for Pokemon Champions Reg M-A.',
    images: ['/og-image.png'],
  },
};

/* Collect all screenshot URLs for preloading */
const ALL_SCREENSHOTS = [
  '/screenshots/landing/s1-offensive-calcs.png',
  '/screenshots/landing/s1-mega-stats.png',
  '/screenshots/landing/s1-defensive-calcs.png',
  '/screenshots/landing/s1-speed-tiers.png',
  '/screenshots/landing/s2-mobile-pokemon.png',
  '/screenshots/landing/s2-mobile-items.png',
  '/screenshots/landing/s2-mobile-moves.png',
  '/screenshots/landing/s2-mobile-coverage.png',
  '/screenshots/landing/s3-import.png',
  '/screenshots/landing/s3-export.png',
  '/screenshots/landing/s3-my-teams.png',
  '/screenshots/landing/s3-team-detail.png',
  '/screenshots/landing/s4-creator-teams.png',
  '/screenshots/landing/s4-community-teams.png',
  '/screenshots/landing/s4-top-cores.png',
];

const SECTION_1_SLIDES: Slide[] = [
  {
    src: '/screenshots/landing/s1-offensive-calcs.png',
    alt: 'Garchomp offensive damage calcs against meta threats showing Earthquake, Dragon Claw, Bulldoze, and Rock Slide ranges',
    caption: 'Check damage ranges against every meta threat during your battles',
  },
  {
    src: '/screenshots/landing/s1-mega-stats.png',
    alt: 'Charizard-Mega-X with updated mega stats and damage calculations against the meta',
    caption: 'Toggle mega evolution — stats and calcs update instantly',
  },
  {
    src: '/screenshots/landing/s1-defensive-calcs.png',
    alt: 'Kingambit defensive calcs showing what moves it survives from Incineroar, Garchomp, and Basculegion',
    caption: 'Know exactly what hits you survive before committing to a play',
  },
  {
    src: '/screenshots/landing/s1-speed-tiers.png',
    alt: 'Gengar-Mega speed tier comparison chart showing where it sits against Dragapult, Greninja, and other fast threats',
    caption: 'Speed tier chart — know if you move first or need to play around it',
  },
];

const SECTION_2_SLIDES: Slide[] = [
  {
    src: '/screenshots/landing/s2-mobile-pokemon.png',
    alt: 'Mobile Pokemon selector with type and generation filters, showing the full Champions roster',
    caption: 'Browse the full Champions roster — filter by type or generation',
    mobile: true,
  },
  {
    src: '/screenshots/landing/s2-mobile-items.png',
    alt: 'Mobile item selector with category filters for Offensive, Defensive, Berries, and Support',
    caption: 'Browse items by category — Offensive, Defensive, Berries, Support',
    mobile: true,
  },
  {
    src: '/screenshots/landing/s2-mobile-moves.png',
    alt: 'Mobile move selector with Physical, Special, Status filters and type-based filtering',
    caption: 'Filter moves by type, category, and power — VGC popular moves first',
    mobile: true,
  },
  {
    src: '/screenshots/landing/s2-mobile-coverage.png',
    alt: 'Type coverage analysis showing team defense and STAB coverage across all 18 types',
    caption: 'Full type coverage analysis — team defense and STAB coverage at a glance',
    mobile: true,
  },
];

const SECTION_3_SLIDES: Slide[] = [
  {
    src: '/screenshots/landing/s3-import.png',
    alt: 'Showdown import dialog with a pasted team in standard Showdown format',
    caption: 'Import any Showdown paste — your existing teams work instantly',
  },
  {
    src: '/screenshots/landing/s3-export.png',
    alt: 'Export dialog showing a team in Showdown format with a copy button',
    caption: 'Export back to Showdown format with one click',
  },
  {
    src: '/screenshots/landing/s3-my-teams.png',
    alt: 'My Teams page showing saved teams with Published and Private badges, sprite previews, and action buttons',
    caption: 'Save your teams to the cloud — access them from any device',
  },
  {
    src: '/screenshots/landing/s3-team-detail.png',
    alt: 'Team detail page with Copy Paste, Share, and Edit in Builder buttons, showing Pokemon sprites and Showdown paste',
    caption: 'Share teams with the community or send links to friends',
  },
];

const SECTION_4_SLIDES: Slide[] = [
  {
    src: '/screenshots/landing/s4-creator-teams.png',
    alt: 'Browse page showing content creator teams with archetype tags, vote counts, and Add to Builder button',
    caption: 'Explore top teams from content creators — add them to your builder instantly',
  },
  {
    src: '/screenshots/landing/s4-community-teams.png',
    alt: 'Community teams tab showing user-submitted teams with archetype filters',
    caption: 'Browse teams shared by the community — filter by archetype or Pokemon',
  },
  {
    src: '/screenshots/landing/s4-top-cores.png',
    alt: 'Top Cores tab showing popular 2-3 Pokemon combinations like Sand Rush Core, Rain + Steel Core, and Trick Room Core',
    caption: 'Explore the strongest cores voted by the community — start building from a proven pair',
  },
];

type SectionProps = {
  label: string;
  title: string;
  desc: string;
  slides: Slide[];
  accentColor: string;
  icon: React.ElementType;
  reversed?: boolean;
};

function FeatureSection({ label, title, desc, slides, accentColor, icon: Icon, reversed }: SectionProps) {
  return (
    <div
      style={{
        padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 6vw, 5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-14`}
        style={{ maxWidth: '76rem', margin: '0 auto' }}
      >
        {/* Text side */}
        <ScrollReveal direction={reversed ? 'right' : 'left'} className="flex-shrink-0 lg:w-[340px]">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: `${accentColor}20`,
                borderRadius: '4px',
              }}
            >
              <Icon style={{ width: '1rem', height: '1rem', color: accentColor }} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-saira-condensed), "Saira Condensed", sans-serif',
                fontWeight: 600,
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: accentColor,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-saira-condensed), "Saira Condensed", sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
              lineHeight: 1.05,
              color: '#ffffff',
              textTransform: 'uppercase',
              margin: '0 0 1rem 0',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.9rem',
              lineHeight: 1.75,
            }}
          >
            {desc}
          </p>
        </ScrollReveal>

        {/* Slideshow side */}
        <ScrollReveal direction={reversed ? 'left' : 'right'} delay={150} className="flex-1 min-w-0 w-full">
          <Slideshow slides={slides} accentColor={accentColor} />
        </ScrollReveal>
      </div>
    </div>
  );
}

/* JSON-LD structured data for Google rich results */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ChampTeams.gg',
  url: 'https://champteams.gg',
  description:
    'Free all-in-one VGC team builder for Pokemon Champions with built-in damage calculator, speed tiers, type coverage analysis, and Showdown import/export.',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'ChampTeams.gg',
    url: 'https://champteams.gg',
    sameAs: ['https://x.com/ChampTeamsGG', 'https://ko-fi.com/champteamsgg'],
  },
  featureList: [
    'Pokemon Champions team builder',
    'VGC damage calculator',
    'Speed tier chart with Tailwind and Trick Room',
    'Type coverage analysis',
    'Showdown import and export',
    'Community team browser',
    'Mega Evolution support',
    'Mobile-friendly design',
  ],
};

export default function LandingPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Preload all screenshots so they're ready when user scrolls */}
      {ALL_SCREENSHOTS.map((src) => (
        <link key={src} rel="preload" as="image" href={src} />
      ))}

      {/* ── Hero — tournament broadcast / fight-card aesthetic ───────────── */}
      <section
        style={{
          background: '#0f0f1a',
          backgroundImage:
            'radial-gradient(ellipse at 85% 20%, rgba(192,57,43,0.22) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 10% 90%, rgba(212,160,23,0.08) 0%, transparent 50%),' +
            'linear-gradient(180deg, #15152a 0%, #0f0f1a 100%)',
          padding: 'clamp(2.25rem, 6vw, 6rem) clamp(1.5rem, 6vw, 5rem) clamp(2.5rem, 6vw, 6rem)',
          /* Leave ~20px of the feature section's top divider visible below as a scroll hint */
          minHeight: 'calc(100vh - 56px - 20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Diagonal scan lines — subtle texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(110deg, transparent 0 3px, rgba(255,255,255,0.012) 3px 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Giant outline wordmark — sits behind everything */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 'clamp(-4rem, -3vw, -1rem)',
            top: '8%',
            fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(10rem, 26vw, 22rem)',
            lineHeight: 0.8,
            letterSpacing: '-0.04em',
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(212,160,23,0.09)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          CHAMP
        </div>

        {/* Diagonal red slash */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-10%',
            right: '18%',
            width: '2px',
            height: '140%',
            background: 'linear-gradient(180deg, transparent 0%, #c0392b 30%, #c0392b 70%, transparent 100%)',
            transform: 'rotate(15deg)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-10%',
            right: '17.2%',
            width: '18px',
            height: '140%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(192,57,43,0.15) 40%, transparent 100%)',
            transform: 'rotate(15deg)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '76rem',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* TOP DATA STRIP — fight card metadata */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              flexWrap: 'wrap',
              marginBottom: 'clamp(1.25rem, 3vw, 2.25rem)',
              fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
              fontWeight: 600,
              fontSize: '0.7rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#c0392b',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#c0392b',
                  borderRadius: '50%',
                  boxShadow: '0 0 12px #c0392b',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              LIVE · EARLY ACCESS
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>//</span>
            <span style={{ color: 'rgba(212,160,23,0.9)' }}>REG M-A</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>//</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>DOUBLES 2v2</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>//</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>MEGA EVOLUTION ON</span>
          </div>

          {/* Headline — layered condensed display type */}
          <h1
            style={{
              fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 10vw, 7.5rem)',
              lineHeight: 0.85,
              color: '#ffffff',
              letterSpacing: '-0.015em',
              textTransform: 'uppercase',
              margin: 0,
              textShadow: '0 2px 40px rgba(0,0,0,0.4)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '0.45em',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.08em',
                marginBottom: '0.4em',
              }}
            >
              The all-in-one
            </span>
            VGC team{' '}
            <span
              style={{
                display: 'inline-block',
                position: 'relative',
                color: '#ffffff',
              }}
            >
              hub
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '-0.1em',
                  right: '-0.1em',
                  bottom: '0.08em',
                  height: '0.18em',
                  background: '#c0392b',
                  zIndex: -1,
                  transform: 'skewX(-12deg)',
                }}
              />
            </span>
            <br />
            <span
              style={{
                color: '#d4a017',
                textShadow: '0 0 60px rgba(212,160,23,0.3)',
              }}
            >
              for Champions.
            </span>
          </h1>

          {/* Subheading + CTAs row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(1.75rem, 3vw, 2.25rem)',
              marginTop: 'clamp(1.75rem, 3vw, 2.5rem)',
              maxWidth: '560px',
            }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.58)',
                fontSize: 'clamp(0.95rem, 1.6vw, 1.08rem)',
                lineHeight: 1.65,
                margin: 0,
                paddingLeft: '1rem',
                borderLeft: '2px solid rgba(212,160,23,0.55)',
              }}
            >
              Builder, damage calculator, type coverage, speed tiers, and community teams — forged for <span style={{ color: '#d4a017', fontWeight: 600 }}>Pokémon Champions</span>.
            </p>

            {/* CTAs — angled clip, no rounded corners */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
              <Link href="/builder" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    background: '#c0392b',
                    color: 'white',
                    padding: '1rem 2.1rem',
                    fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                    boxShadow: '0 0 0 1px rgba(212,160,23,0.4), 0 12px 30px -8px rgba(192,57,43,0.55)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1)',
                  }}
                >
                  Enter the Builder
                  <ArrowRight style={{ width: '1.1rem', height: '1.1rem' }} />
                </span>
              </Link>
              <Link href="/browse" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#d4a017',
                    padding: '1rem 2.1rem 1rem 2.3rem',
                    fontFamily: '"Saira Condensed", var(--font-saira-condensed), sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(212,160,23,0.55)',
                    background: 'rgba(212,160,23,0.04)',
                    clipPath: 'polygon(14px 0, 100% 0, 100% 100%, 0 100%)',
                    cursor: 'pointer',
                  }}
                >
                  Browse Teams
                </span>
              </Link>
            </div>
          </div>

        </div>

        {/* Keyframes for pulse dot */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.85); }
          }
        `}</style>
      </section>

      {/* ── Accent bar ───────────────────────────────────── */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #c0392b 0%, #d4a017 50%, transparent 100%)' }} />

      {/* ── Feature sections with slideshows + scroll reveals ── */}
      <div style={{ background: '#13132a' }}>
        <FeatureSection
          label="Battle Companion"
          title="Have it opened during your battles."
          desc="The real power is having ChampTeams on a second screen while you play. Check damage ranges mid-match, verify speed tiers, toggle mega stats instantly, and know whether you survive a hit — all without leaving the game."
          slides={SECTION_1_SLIDES}
          accentColor="#d4a017"
          icon={Monitor}
        />

        <FeatureSection
          label="Mobile-First Builder"
          title="A Pokémon Champions team builder that works on your phone."
          desc="Updated with the full Champions roster, items, and movesets. Full-screen pickers, type-based move filters, item categories, and EV sliders — all designed for touch from day one."
          slides={SECTION_2_SLIDES}
          accentColor="#c0392b"
          icon={Smartphone}
          reversed
        />

        <FeatureSection
          label="Team Management"
          title="Import, export, save, and share."
          desc="Paste any Showdown team and it loads instantly. Export back with one click. Save teams to the cloud so you can access them on any device. Publish to the community or share via link."
          slides={SECTION_3_SLIDES}
          accentColor="#d4a017"
          icon={FolderOpen}
        />

        <FeatureSection
          label="Browse & Explore"
          title="See what the community is running."
          desc="Content creator teams, community builds, and top-rated cores — all searchable by Pokemon, archetype, or playstyle. Copy any team straight into the builder. Vote on builds to surface the best ones."
          slides={SECTION_4_SLIDES}
          accentColor="#c0392b"
          icon={Globe}
          reversed
        />
      </div>

      {/* ── CTA banner ────────────────────────────────────── */}
      <section
        style={{
          background: '#1a1a2e',
          padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 6vw, 5rem)',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <ScrollReveal>
          <div style={{ maxWidth: '540px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-saira-condensed), "Saira Condensed", sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                color: '#ffffff',
                textTransform: 'uppercase',
                lineHeight: 1.05,
                margin: '0 0 0.75rem 0',
              }}
            >
              Ready to build?
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.9rem',
                lineHeight: 1.65,
                marginBottom: '1.75rem',
              }}
            >
              Start from scratch, import a Showdown paste, or copy a community team and make it yours.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link href="/builder" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#c0392b',
                    color: 'white',
                    padding: '0.72rem 2rem',
                    fontFamily: 'var(--font-saira-condensed), "Saira Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.07em',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  OPEN THE BUILDER
                  <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </span>
              </Link>
              <Link href="/browse" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: '#d4a017',
                    padding: '0.72rem 2rem',
                    fontFamily: 'var(--font-saira-condensed), "Saira Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.07em',
                    border: '1px solid rgba(212,160,23,0.45)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  BROWSE TEAMS
                </span>
              </Link>
            </div>

            {/* Community + Support strip */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '1.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  color: 'rgba(255,255,255,0.38)',
                  fontSize: '0.82rem',
                  lineHeight: 1.7,
                  maxWidth: '400px',
                  margin: 0,
                }}
              >
                ChampTeams is in early access. Got a bug or feature request?{' '}
                <a
                  href="https://x.com/ChampTeamsGG"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(212,160,23,0.85)', textDecoration: 'none' }}
                >
                  Message us on X
                </a>
                {' '}— your feedback shapes what gets built next.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a
                  href="https://x.com/ChampTeamsGG"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.78rem',
                    textDecoration: 'none',
                    padding: '0.45rem 1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Follow for updates
                </a>
                <a
                  href="https://ko-fi.com/champteamsgg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: '#d4a017',
                    fontSize: '0.78rem',
                    textDecoration: 'none',
                    padding: '0.45rem 1rem',
                    border: '1px solid rgba(212,160,23,0.35)',
                    borderRadius: '2px',
                    background: 'rgba(212,160,23,0.06)',
                    transition: 'background 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Support the project
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
