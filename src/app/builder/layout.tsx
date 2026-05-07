import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon Champions Team Builder — Build VGC Teams | ChampTeams.gg',
  description:
    'Build competitive Pokémon Champions teams with our free VGC team builder. Reg M-A roster, Mega Evolution, type coverage, damage calculator, meta scores, and Showdown export. Doubles format.',
  keywords: [
    'Pokemon Champions team builder',
    'VGC team builder',
    'Pokemon Champions teams',
    'Reg M-A team builder',
    'competitive Pokemon team builder',
    'Pokemon Champions VGC',
    'Mega Evolution team builder',
    'doubles team builder',
    'Pokemon Showdown export',
  ],
  alternates: {
    canonical: '/builder',
  },
  openGraph: {
    title: 'Pokémon Champions Team Builder | ChampTeams.gg',
    description:
      'Free VGC team builder for Pokémon Champions Reg M-A. Full roster, Mega Evolution, meta scores, type coverage, and Showdown export.',
    type: 'website',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
