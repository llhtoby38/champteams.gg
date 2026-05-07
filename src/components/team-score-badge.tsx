'use client';

import { HoverTapPopover } from '@/components/ui/hover-tap-popover';

interface Member {
  name: string;
  score: number | null;
}

interface Props {
  score: number;
  members: Member[];
  bg: string;
  label?: string;
  className?: string;
  footerLink?: { href: string; label: string };
}

function memberColor(s: number): string {
  if (s >= 70) return '#d4a017';
  if (s >= 45) return '#c0392b';
  if (s >= 25) return '#3b82f6';
  if (s >= 10) return '#6b7280';
  return '#374151';
}

export function TeamScoreBadge({
  score,
  members,
  bg,
  label,
  className = '',
  footerLink,
}: Props) {
  const scored = members.filter(m => m.score != null) as { name: string; score: number }[];

  return (
    <HoverTapPopover
      width={240}
      trigger={
        <span
          className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded text-white ${className}`}
          style={{ background: bg }}
        >
          {label ? `${label} ` : ''}{score.toFixed(0)}
        </span>
      }
    >
      <div className="text-[10px] uppercase tracking-wider text-[#d4a017] font-bold mb-2">
        Team Score Breakdown
      </div>
      <div className="space-y-1">
        {members.map((m, i) => (
          <div key={`${m.name}-${i}`} className="flex items-center justify-between text-[11px]">
            <span className="text-white/80 truncate pr-2">{m.name || '—'}</span>
            {m.score != null ? (
              <span
                className="font-mono font-semibold tabular-nums px-1 rounded text-white"
                style={{ background: memberColor(m.score) }}
              >
                {m.score.toFixed(0)}
              </span>
            ) : (
              <span className="text-white/30 text-[10px]">—</span>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 mt-2 pt-1.5 flex items-baseline justify-between">
        <span className="text-[11px] text-white/80 font-semibold">
          Average {scored.length > 0 && <span className="text-white/40 font-normal">({scored.length})</span>}
        </span>
        <span className="text-[13px] font-mono font-bold" style={{ color: '#d4a017' }}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="text-[9px] text-white/40 mt-2 leading-snug">
        Average of each Pokémon&apos;s tier list score.
      </div>
      <div className="text-[9px] text-white/50 mt-1.5 leading-snug border-t border-white/10 pt-1.5">
        <span className="text-[#d4a017] font-semibold">Note:</span> A higher score doesn&apos;t mean your team is &quot;better&quot; — it reflects how &quot;meta&quot; it is compared to teams built by others and ones that placed well in tournaments.
      </div>
      {footerLink && (
        <a
          href={footerLink.href}
          className="block mt-2 text-[10px] text-[#d4a017] hover:underline font-semibold"
        >
          {footerLink.label}
        </a>
      )}
    </HoverTapPopover>
  );
}
