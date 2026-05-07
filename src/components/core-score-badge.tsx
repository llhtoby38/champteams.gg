'use client';

import { HoverTapPopover } from '@/components/ui/hover-tap-popover';

interface Props {
  score: number;
  synergyPercent: number;
  winRate: number;
  coOccurrence: number;
  bg: string;
  label?: string;
  className?: string;
  isTrio?: boolean;
}

export function CoreScoreBadge({
  score,
  synergyPercent,
  winRate,
  coOccurrence,
  bg,
  label,
  className = '',
  isTrio = false,
}: Props) {
  const synergyWeight = isTrio ? 14 : 22;
  const synergyPts = Math.max(0, Math.min(60, synergyPercent * synergyWeight));
  const wrPts = Math.max(-20, Math.min(40, (winRate - 50) * 4.5));
  const trustPts = coOccurrence > 0
    ? Math.max(0, Math.min(12, Math.log2(Math.max(1, coOccurrence)) * 2.5))
    : 0;

  return (
    <HoverTapPopover
      width={220}
      trigger={
        <span
          className={`text-[10px] font-bold font-mono px-1.5 rounded text-white ${className}`}
          style={{ background: bg }}
        >
          {label ? `${label} ` : ''}{score.toFixed(0)}
        </span>
      }
    >
      <div className="text-[10px] uppercase tracking-wider text-[#d4a017] font-bold mb-2">
        Core Score Breakdown
      </div>
      <Row label="Synergy (PMI)" value={`+${synergyPts.toFixed(0)}`} sub={`${synergyPercent.toFixed(1)} bits`} />
      <Row label="Win rate" value={`${wrPts >= 0 ? '+' : ''}${wrPts.toFixed(0)}`} sub={`${winRate.toFixed(0)}%`} />
      <Row label="Sample trust" value={`+${trustPts.toFixed(0)}`} sub={`${coOccurrence.toFixed(1)}% co-usage`} />
      <div className="border-t border-white/10 mt-2 pt-1.5 flex items-baseline justify-between">
        <span className="text-[11px] text-white/80 font-semibold">Total</span>
        <span className="text-[13px] font-mono font-bold" style={{ color: '#d4a017' }}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="text-[9px] text-white/40 mt-2 leading-snug">
        Higher PMI = appears together more than chance.
      </div>
    </HoverTapPopover>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between text-[11px] leading-relaxed">
      <span className="text-white/70">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[9px] text-white/40">{sub}</span>
        <span className="font-mono font-semibold tabular-nums w-7 text-right">{value}</span>
      </span>
    </div>
  );
}
