'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TeamBuilder } from '@/components/builder/team-builder';

export default function LoadTeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [teamData, setTeamData] = useState<{ name: string; pokemonSets: unknown[]; metaThreats?: unknown[] | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Team not found');
        return r.json();
      })
      .then(setTeamData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading team...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Team not found</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <a href="/builder" className="text-sm text-[#d4a017] hover:underline mt-3 inline-block">
            Create a new team
          </a>
        </div>
      </div>
    );
  }

  // Pass team data to builder via URL params — the builder will load it
  return <TeamBuilder initialTeamId={teamId} initialTeamData={teamData} />;
}
