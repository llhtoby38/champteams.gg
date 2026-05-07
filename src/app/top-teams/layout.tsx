import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Pokémon Champions Teams — Top VGC Reg M-A Teams | ChampTeams.gg',
  description:
    'The best Pokémon Champions teams ranked by tournament results. Top VGC Reg M-A teams from Limitless with full movesets, items, abilities, and spreads. Doubles · Mega Evolution.',
  keywords: [
    'best Pokemon Champions teams',
    'top Pokemon Champions teams',
    'Pokemon Champions VGC teams',
    'Pokemon Champions Reg M-A teams',
    'Pokemon Champions tournament teams',
    'Pokemon Champions team builder',
    'Limitless VGC Pokemon Champions',
    'Pokemon Champions meta teams',
  ],
  openGraph: {
    title: 'Best Pokémon Champions Teams — Top VGC Reg M-A Teams | ChampTeams.gg',
    description:
      'The best Pokémon Champions teams, ranked by tournament results from Limitless VGC. Full sets with movesets, items, abilities, and spreads.',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
