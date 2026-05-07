import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon Champions Team Builder & Damage Calculator | ChampTeams.gg',
  description:
    'The all-in-one team hub for Pokémon Champions. Build VGC teams, browse tier lists, check meta cores, and share builds. Free team builder with full Reg M-A roster, Mega Evolution, and Showdown export.',
  keywords: [
    'Pokemon Champions',
    'Pokemon Champions team builder',
    'VGC team builder',
    'Pokemon Champions tier list',
    'Pokemon Champions meta',
    'Reg M-A teams',
    'Mega Evolution VGC',
    'Pokemon Champions damage calculator',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pokémon Champions Team Builder & Damage Calculator | ChampTeams.gg',
    description:
      'The all-in-one competitive hub for Pokémon Champions. Build teams, browse tier lists, and share builds.',
    type: 'website',
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
