import type { SupabaseClient } from '@supabase/supabase-js';


export const SESSION_COOKIE_NAME = 'dito-session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export function generateSessionToken(): string {
  return Buffer.from(crypto.randomUUID() + Date.now()).toString('base64url');
}

export async function createSession(
  userId: string,
  cookieStore: { set: (name: string, value: string, options: Record<string, unknown>) => void },
  supabase: SupabaseClient,
): Promise<{ sessionToken: string; error?: string }> {
  const sessionToken = generateSessionToken();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  const { error } = await supabase
    .from('sessions')
    .upsert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
    });

  if (error) {
    return { sessionToken, error: 'Failed to create session' };
  }

  return { sessionToken };
}

