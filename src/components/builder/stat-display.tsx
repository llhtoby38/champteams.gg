'use client';

import type { StatsTable } from '@/types/pokemon';
import { calcStat, MAX_TOTAL_SP } from '@/lib/pokemon/stats';
import { STAT_NAMES } from '@/types/pokemon';

interface StatDisplayProps {
  baseStats: StatsTable;
  evs: StatsTable; // Stat points (0-32) in Champions
  nature: { plus: string | null; minus: string | null };
}

const STAT_BAR_COLORS: Record<keyof StatsTable, string> = {
  hp: 'bg-red-500',
  atk: 'bg-orange-500',
  def: 'bg-yellow-500',
  spa: 'bg-blue-500',
  spd: 'bg-green-500',
  spe: 'bg-pink-500',
};

export function StatDisplay({ baseStats, evs, nature }: StatDisplayProps) {
  const stats = (['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as (keyof StatsTable)[]).map(
    (stat) => ({
      key: stat,
      label: STAT_NAMES[stat],
      base: baseStats[stat],
      final: calcStat(stat, baseStats[stat], evs[stat], nature),
      sp: evs[stat],
    }),
  );

  const totalSp = stats.reduce((sum, s) => sum + s.sp, 0);

  return (
    <div className="space-y-1.5">
      {stats.map((s) => (
        <div key={s.key} className="flex items-center gap-2 text-xs">
          <span className="w-14 text-right text-muted-foreground font-medium">
            {s.label}
          </span>
          <span className="w-6 text-right text-muted-foreground">{s.base}</span>
          <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
            <div
              className={`h-full rounded ${STAT_BAR_COLORS[s.key]} transition-all`}
              style={{ width: `${(s.final / 250) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono font-bold">{s.final}</span>
          {s.sp > 0 && (
            <span className="text-[10px] text-primary w-8">+{s.sp}</span>
          )}
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground text-right">
        SP: {totalSp}/{MAX_TOTAL_SP}
      </div>
    </div>
  );
}
