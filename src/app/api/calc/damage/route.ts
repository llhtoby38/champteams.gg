import { NextRequest, NextResponse } from 'next/server';
import { calculateDamage, calculateBulkDamage } from '@/lib/calc/damage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Single calc or bulk calc
    if (body.moves && Array.isArray(body.moves)) {
      const results = calculateBulkDamage(body.attacker, body.defender, body.moves, body.field);
      return NextResponse.json(results);
    }

    const result = calculateDamage(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Calculation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
