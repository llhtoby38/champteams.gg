import { NextResponse } from 'next/server';

// Lightweight health check — called by keep-alive cron or uptime monitor
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
