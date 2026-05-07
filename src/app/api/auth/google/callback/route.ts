import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
}

async function exchangeCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

async function getGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`User info fetch failed: ${res.status}`);
  return res.json();
}

/**
 * GET /api/auth/google/callback?code=xxx&state=xxx
 * Handles the OAuth callback from Google.
 * Creates or links account, then redirects with session data.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');
  const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin.replace('0.0.0.0', 'localhost');

  if (error) {
    return NextResponse.redirect(`${origin}/builder?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${origin}/builder?auth_error=missing_code`);
  }

  let mode = 'login';
  let linkUserId = '';
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    mode = state.mode || 'login';
    linkUserId = state.userId || '';
  } catch { /* ignore */ }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    const googleUser = await getGoogleUser(tokens.access_token);

    // MODE: link — attach Google to existing account
    if (mode === 'link' && linkUserId) {
      // Check if google_id is already used by another account
      const existing = await db.select().from(users).where(eq(users.googleId, googleUser.sub)).limit(1);
      if (existing.length > 0 && existing[0].id !== linkUserId) {
        return NextResponse.redirect(`${origin}/profile?error=${encodeURIComponent('This Google account is already linked to another user')}`);
      }
      await db.update(users)
        .set({ googleId: googleUser.sub, updatedAt: new Date() })
        .where(eq(users.id, linkUserId));

      return NextResponse.redirect(`${origin}/profile?google_linked=true`);
    }

    // MODE: login or register — find existing user or create new
    // First check by google_id, then by email
    let user = await db.select().from(users)
      .where(or(
        eq(users.googleId, googleUser.sub),
        eq(users.email, googleUser.email.toLowerCase()),
      ))
      .limit(1)
      .then(r => r[0] ?? null);

    if (user) {
      // Update google_id if not set
      if (!user.googleId) {
        await db.update(users)
          .set({ googleId: googleUser.sub, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    } else {
      // Create new user
      const result = await db.insert(users).values({
        email: googleUser.email.toLowerCase(),
        displayName: googleUser.name || googleUser.email.split('@')[0],
        googleId: googleUser.sub,
      }).returning();
      user = result[0];
    }

    // Redirect back with session data encoded in URL fragment (not visible to server)
    const session = encodeURIComponent(JSON.stringify({
      userId: user.id,
      username: user.displayName || user.email,
    }));

    return NextResponse.redirect(`${origin}/builder?auth_session=${session}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${origin}/builder?auth_error=oauth_failed`);
  }
}
