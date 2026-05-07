import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon Champions Tier List — Reg M-A Rankings | ChampTeams.gg',
  description:
    'Data-driven tier list for Pokémon Champions VGC Regulation M-A. Rankings based on tournament usage (Limitless First Tour, 532 teams), win rate, and ladder data. Every Pokémon scored 0-100.',
  keywords: [
    'Pokemon Champions tier list',
    'VGC Reg M-A tier list',
    'Pokemon Champions rankings',
    'best Pokemon Champions',
    'Pokemon Champions meta',
    'Regulation M-A tier list',
    'doubles tier list',
    'Mega Evolution tier list',
    'ChampTeams tier list',
  ],
  openGraph: {
    title: 'Pokémon Champions Tier List — Reg M-A | ChampTeams.gg',
    description:
      'Data-driven tier list for Pokémon Champions VGC Reg M-A. Scores combine tournament usage, win rate, and ladder data.',
    type: 'website',
  },
};

export default function TierListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
