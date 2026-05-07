import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth consent screen.
 * Query params:
 *   ?mode=login|register|link  (default: login)
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
  }

  const mode = request.nextUrl.searchParams.get('mode') || 'login';
  // Use explicit base URL — nextUrl.origin can resolve to 0.0.0.0 in dev
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin.replace('0.0.0.0', 'localhost');
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Encode mode + optional userId in state for the callback
  const userId = request.nextUrl.searchParams.get('userId') || '';
  const state = Buffer.from(JSON.stringify({ mode, userId })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
