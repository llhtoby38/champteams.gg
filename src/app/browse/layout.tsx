import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon Champions Tier List, Meta Cores & Top Teams | ChampTeams.gg',
  description:
    'Data-driven tier list, top meta cores, and community teams for Pokémon Champions Reg M-A doubles. Every Pokémon scored from tournament + ladder data. Mega Evolution · Doubles · Reg M-A.',
  keywords: [
    'Pokemon Champions teams',
    'top teams Pokemon Champions',
    'VGC Reg M-A teams',
    'Pokemon Champions Regulation M-A',
    'top cores Pokemon Champions',
    'competitive doubles teams',
    'Pokemon Champions meta',
    'Mega Evolution VGC',
    'ChampTeams',
  ],
  openGraph: {
    title: 'Top Teams for Pokémon Champions Reg M-A | ChampTeams.gg',
    description:
      'Browse the best competitive VGC double battle teams for Pokémon Champions Regulation M-A. Content creator teams, community builds, and top cores with upvote system.',
    type: 'website',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
