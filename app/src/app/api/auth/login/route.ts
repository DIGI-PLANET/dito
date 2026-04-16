import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getSupabase } from '@/lib/supabase';
import { generateOTP, getRedis, otpMemory, type OtpData } from '@/lib/otp-store';
import { sendEmail, createOTPEmail } from '@/lib/resend';

const OTP_TTL = 300;

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Resolve identifier to email (could be email or username)
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('email')
        .eq('username', identifier.toLowerCase())
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ error: 'Account not found' }, { status: 401 });
      }
      email = profile.email;
    }

    // Authenticate with Supabase
    const supabase = getSupabase();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check discovery status
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('discovery_complete')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    const discoveryComplete = profile?.discovery_complete ?? false;

    // Send OTP for 2FA (optional for user)
    const code = generateOTP();
    const key = `otp:${email.toLowerCase()}`;
    const redis = await getRedis();
    const otpData: OtpData = { code, attempts: 0, sendCount: 1, lastSentAt: Date.now() };

    if (redis) {
      await redis.set(key, otpData, { ex: OTP_TTL });
    } else {
      otpMemory.set(key, otpData);
      setTimeout(() => otpMemory.delete(key), OTP_TTL * 1000);
    }

    const lang = req.headers.get('accept-language')?.includes('ko') ? 'ko' : 'en';
    const { subject, html } = createOTPEmail(code, lang);
    sendEmail({ to: email, subject, html }).catch(() => {});

    // Return session info with OTP requirement
    const response = NextResponse.json({
      requiresOtp: true,
      email: email.toLowerCase(),
      discoveryComplete,
    });

    // Set session cookie
    response.cookies.set('sb-access-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
