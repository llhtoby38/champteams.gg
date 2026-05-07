import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

const KNOWN_TAGS = new Set([
  'pipeline-snapshot',
  'tier-list',
  'cores',
  'common-teams',
  'browse',
]);

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tag = typeof body.tag === 'string' ? body.tag : 'pipeline-snapshot';
  if (!KNOWN_TAGS.has(tag)) {
    return NextResponse.json({ error: 'unknown tag' }, { status: 400 });
  }

  revalidateTag(tag, 'max');
  return NextResponse.json({ ok: true, tag });
}
