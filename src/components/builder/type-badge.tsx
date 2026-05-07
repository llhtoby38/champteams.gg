import { TYPE_COLORS } from '@/lib/sprites';

export function TypeBadge({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const color = TYPE_COLORS[type] || '#777';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-block rounded font-semibold text-white uppercase tracking-wide ${sizeClasses}`}
      style={{ backgroundColor: color }}
    >
      {type}
    </span>
  );
}
