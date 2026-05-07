import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top 20 Pokémon Champions Cores — Best VGC Pairs & Trios | ChampTeams.gg',
  description:
    'The best Pokémon Champions pairs and trios from this week\'s Limitless VGC tournaments. Top 20 cores for Reg M-A ranked by synergy, win rate, and co-usage. Doubles · Mega Evolution.',
  keywords: [
    'best Pokemon Champions cores',
    'top Pokemon Champions pairs',
    'Pokemon Champions trios',
    'Pokemon Champions meta cores',
    'Pokemon Champions VGC synergy',
    'Pokemon Champions Reg M-A cores',
    'best Pokemon Champions duos',
    'Pokemon Champions team cores',
  ],
  openGraph: {
    title: 'Top 20 Pokémon Champions Cores — Best VGC Pairs & Trios | ChampTeams.gg',
    description:
      'The best Pokémon Champions pairs and trios from this week\'s Limitless VGC tournaments, ranked by synergy and win rate.',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
