'use client';

import { useCallback } from 'react';
import { STAT_NAMES, type StatsTable } from '@/types/pokemon';
import { totalEvs, MAX_TOTAL_SP, MAX_STAT_SP } from '@/lib/pokemon/stats';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface EvEditorProps {
  evs: StatsTable; // Stat points (0-32) in Champions
  onEvChange: (stat: keyof StatsTable, value: number) => void;
}

export function EvEditor({ evs, onEvChange }: EvEditorProps) {
  const total = totalEvs(evs);
  const remaining = MAX_TOTAL_SP - total;

  const handleChange = useCallback((stat: keyof StatsTable, value: number) => {
    const clamped = Math.min(value, MAX_STAT_SP);
    const otherTotal = totalEvs(evs) - evs[stat];
    const maxForThisStat = Math.max(0, MAX_TOTAL_SP - otherTotal);
    onEvChange(stat, Math.max(0, Math.min(clamped, maxForThisStat)));
  }, [onEvChange, evs]);

  const presets = [
    { label: 'Max Atk/Spe', vals: { atk: 32, spe: 32, hp: 2 } },
    { label: 'Max SpA/Spe', vals: { spa: 32, spe: 32, hp: 2 } },
    { label: 'Max HP/Def', vals: { hp: 32, def: 32, spd: 2 } },
    { label: 'Max HP/SpD', vals: { hp: 32, spd: 32, def: 2 } },
    { label: 'Reset', vals: {} },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium">Stat Points</span>
        <span className={`${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {total}/{MAX_TOTAL_SP}
          {remaining > 0 && ` (${remaining} left)`}
        </span>
      </div>

      {/* Stat sliders */}
      {(['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as (keyof StatsTable)[]).map((stat) => (
        <div key={stat} className="flex items-center gap-3">
          <span className="text-xs w-14 text-right text-muted-foreground">
            {STAT_NAMES[stat]}
          </span>
          <Slider
            value={[evs[stat]]}
            min={0}
            max={MAX_STAT_SP}
            step={1}
            onValueChange={(val) => handleChange(stat, Array.isArray(val) ? val[0] : val)}
            className="flex-1"
          />
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={evs[stat]}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              const v = raw === '' ? 0 : parseInt(raw, 10);
              if (!isNaN(v)) handleChange(stat, v);
            }}
            className="w-16 h-7 text-xs text-center"
          />
        </div>
      ))}

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              const base: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
              const merged = { ...base, ...preset.vals };
              for (const stat of Object.keys(merged) as (keyof StatsTable)[]) {
                onEvChange(stat, merged[stat]);
              }
            }}
            className="text-[10px] px-2 py-0.5 rounded border hover:bg-accent transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
