import type { Metadata } from 'next';
import { TeamBuilder } from '@/components/builder/team-builder';

export const metadata: Metadata = {
  title: 'Pokemon Champions Team Builder — Build VGC Teams | ChampTeams.gg',
  description:
    'Build competitive VGC teams for Pokemon Champions Regulation M-A. Full roster, items, abilities, learnsets, EV spreads, Mega Evolution, and Showdown import/export. Free online team builder.',
  keywords: [
    'Pokemon Champions team builder',
    'VGC team builder online',
    'Pokemon Champions teambuilder',
    'build Pokemon Champions team',
    'Pokemon Champions Reg M-A builder',
    'VGC team planner',
    'Pokemon Champions EV spreads',
    'Mega Evolution team builder',
  ],
  alternates: {
    canonical: 'https://champteams.gg/builder',
  },
  openGraph: {
    title: 'Pokemon Champions Team Builder | ChampTeams.gg',
    description:
      'Build competitive VGC teams for Pokemon Champions. Full Reg M-A roster, Mega Evolution, Showdown import/export.',
    type: 'website',
  },
};

export default function BuilderPage() {
  return <TeamBuilder />;
}
