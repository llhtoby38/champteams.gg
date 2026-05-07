import { NextRequest, NextResponse } from 'next/server';
import { exportTeamToShowdown } from '@/lib/pokemon/export';

export async function POST(request: NextRequest) {
  const { pokemon } = await request.json();
  if (!Array.isArray(pokemon)) {
    return NextResponse.json({ error: 'pokemon must be an array' }, { status: 400 });
  }
  const text = exportTeamToShowdown(pokemon);
  return NextResponse.json({ text });
}
