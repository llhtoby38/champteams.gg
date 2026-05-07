import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Teams — Pokémon Champions VGC | ChampTeams.gg',
  description: 'Browse and share user-submitted competitive VGC teams for Pokémon Champions Reg M-A doubles. Vote, copy, and build your own.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
