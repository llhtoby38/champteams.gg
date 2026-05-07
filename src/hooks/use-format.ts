'use client';

import { useLocalStorage } from './use-local-storage';

export interface FormatInfo {
  id: string;
  name: string;
  shortName: string;
  game: string;
}

export const FORMATS: FormatInfo[] = [
  { id: 'season-m1', name: 'Season M-1', shortName: 'Season M-1', game: 'champions' },
  { id: 'champions-all', name: 'All Pokemon', shortName: 'All Pokemon', game: 'champions' },
];

export function useFormat() {
  const [formatId, setFormatId] = useLocalStorage<string>('poketeam_format', 'season-m1');
  // Validate stored format — reset to default if it's from an old/renamed format
  const validIds = new Set(FORMATS.map(f => f.id));
  const safeFormatId = validIds.has(formatId) ? formatId : 'season-m1';
  if (safeFormatId !== formatId) setFormatId(safeFormatId);
  const format = FORMATS.find(f => f.id === safeFormatId) || FORMATS[0];
  return { format, formatId: safeFormatId, setFormatId, formats: FORMATS };
}
